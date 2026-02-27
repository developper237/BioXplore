const { supabase } = require('../config/supabase');

// Génère un numéro de commande unique : BX-YYYYMMDD-XXXXXXXX
function generateOrderNumber() {
  const d   = new Date();
  const pad = n => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `BX-${date}-${rand}`;
}

// POST /api/checkout
async function createCheckout(req, res) {
  try {
    const userId = req.user.userId;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Récupérer les infos du user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone')
      .eq('id', userId)
      .single();

    if (userErr || !user) throw new Error('User not found');

    // Adresse par défaut (optionnel)
    const { data: address } = await supabase
      .from('addresses')
      .select('street, city, state, zip_code, country')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    // Calcul des totaux
    const subtotal = items.reduce(
      (sum, i) => sum + (parseFloat(i.price) * parseInt(i.quantity || 1)),
      0
    );
    const shipping = subtotal >= 100 ? 0 : 15;
    const tax      = 0;
    const total    = subtotal + shipping + tax;

    const customerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Client';

    // ── INSERT orders ──────────────────────────────────────────────────────────
    // NOT NULL : order_number, subtotal, total
    // Tout le reste a DEFAULT ou est nullable
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number : generateOrderNumber(),               // NOT NULL
        subtotal     : parseFloat(subtotal.toFixed(2)),     // NOT NULL
        total        : parseFloat(total.toFixed(2)),        // NOT NULL
        user_id      : userId,
        status       : 'pending_payment',
        shipping     : parseFloat(shipping.toFixed(2)),
        tax          : parseFloat(tax.toFixed(2)),
        payment_method        : 'whatsapp',
        payment_status        : 'pending',
        whatsapp_message_sent : false,
        customer_name  : customerName,
        customer_phone : user.phone || null,
        shipping_name        : customerName,
        shipping_email       : user.email  || null,
        shipping_phone       : user.phone  || null,
        shipping_address     : address?.street   || null,
        shipping_city        : address?.city     || null,
        shipping_country     : address?.country  || null,
        shipping_postal_code : address?.zip_code || null,
        notes : address
          ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip_code || ''}, ${address.country || ''}`.trim()
          : null
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // ── INSERT order_items ─────────────────────────────────────────────────────
    // NOT NULL : product_name, product_price, quantity, subtotal
    const orderItems = items.map(i => {
      const qty          = parseInt(i.quantity) || 1;
      const unitPrice    = parseFloat(i.price);
      const lineSubtotal = parseFloat((unitPrice * qty).toFixed(2));

      return {
        order_id      : order.id,
        product_id    : i.id || null,              // nullable integer
        product_name  : i.name,                    // NOT NULL
        product_price : unitPrice,                 // NOT NULL
        quantity      : qty,                       // NOT NULL
        subtotal      : lineSubtotal,              // NOT NULL
        name          : i.name,                    // nullable duplicate (legacy)
        image_url     : i.image || i.image_url || null,
        price         : unitPrice                  // nullable duplicate (legacy)
      };
    });

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsErr) throw itemsErr;

    // ── Message WhatsApp ───────────────────────────────────────────────────────
    const orderRef  = order.order_number;
    const date      = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const itemsText = items.map(i =>
      `• ${i.name} (x${i.quantity || 1}) — $${(parseFloat(i.price) * (i.quantity || 1)).toFixed(2)}`
    ).join('\n');

    const addressText = address
      ? ` *Adresse :* ${address.street || ''}, ${address.city || ''}, ${address.country || ''}`
      : ` *Adresse :* Not provided`;

    const message = [
      ` *New bioXplore order*`,
      ``,
      ` *Client :* ${customerName}`,
      ` ${user.email}`,
      user.phone ? ` ${user.phone}` : null,
      addressText,
      ``,
      ` *Items :*`,
      itemsText,
      ``,
      ` *Sub-total :* $${subtotal.toFixed(2)}`,
      ` *Shipping :* ${shipping === 0 ? 'FREE !' : '$' + shipping.toFixed(2)}`,
      ` *TOTAL : $${total.toFixed(2)}*`,
      ``,
      ` *Order ID :* #${orderRef}`,
      ` ${date}`,
      ``,
      ` Waiting for payment instructions.`
    ].filter(l => l !== null).join('\n');

    res.status(201).json({
      success: true,
      data: { orderId: order.id, orderRef, total, message }
    });

  } catch (err) {
    console.error('createCheckout error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/admin/orders/:id/status
async function updateOrderStatus(req, res) {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const validStatuses = [
      'pending_payment', 'payment_received', 'pending_delivery',
      'shipped', 'delivered', 'cancelled', 'pending', 'processing'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: "${status}". Valid: ${validStatuses.join(', ')}`
      });
    }

    const normalised = status === 'processing' ? 'pending_delivery' : status;

    const { data, error } = await supabase
      .from('orders')
      .update({ status: normalised })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/orders
async function getAllOrders(req, res) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status,
        subtotal, shipping, tax, total,
        customer_name, customer_phone,
        shipping_name, shipping_email, shipping_phone,
        shipping_address, shipping_city, shipping_country, shipping_postal_code,
        payment_method, payment_status,
        whatsapp_message_sent, whatsapp_sent_at,
        notes, created_at, updated_at,
        users ( email ),
        order_items ( id, product_name, product_price, quantity, subtotal, image_url )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { createCheckout, updateOrderStatus, getAllOrders };