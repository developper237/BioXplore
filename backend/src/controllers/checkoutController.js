const { supabase } = require('../config/supabase');

// POST /api/checkout
async function createCheckout(req, res) {
  try {
    const userId = req.user.userId;
    const { items } = req.body; // [{ id, name, price, quantity, image_url }]

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Récupérer les infos du user + adresse
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone')
      .eq('id', userId)
      .single();

    if (userErr || !user) throw new Error('User not found');

    const { data: address } = await supabase
      .from('addresses')
      .select('street, city, state, zip_code, country')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    // Calcul du total
    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);
    const shipping = subtotal > 100 ? 0 : 15;
    const total    = subtotal + shipping;

    const customerName = `${user.first_name} ${user.last_name}`.trim();

    // Créer la commande
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:       userId,
        status:        'pending_payment',
        total:         total,
        customer_name: customerName,
        customer_phone: user.phone || null,
        notes:         address
          ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip_code || ''}, ${address.country || ''}`.trim()
          : null
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insérer les articles
    const orderItems = items.map(i => ({
      order_id:   order.id,
      product_id: i.id || null,
      name:       i.name,
      image_url:  i.image || i.image_url || null,
      price:      parseFloat(i.price),
      quantity:   i.quantity
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsErr) throw itemsErr;

    // Formater le message WhatsApp
    const orderRef = `BX-${String(order.id).padStart(6, '0')}`;
    const date     = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    const itemsText = items.map(i =>
      `• ${i.name} (x${i.quantity}) — $${(parseFloat(i.price) * i.quantity).toFixed(2)}`
    ).join('\n');

    const addressText = address
      ? `📍 *Adresse de livraison :* ${address.street || ''}, ${address.city || ''}, ${address.country || ''}`
      : `📍 *Adresse de livraison :* Non renseignée`;

    const message = [
      `🌿 *Nouvelle commande BioXplore*`,
      ``,
      `👤 *Client :* ${customerName}`,
      `📧 ${user.email}`,
      user.phone ? `📱 ${user.phone}` : null,
      addressText,
      ``,
      `🛒 *Articles commandés :*`,
      itemsText,
      ``,
      `📦 *Sous-total :* $${subtotal.toFixed(2)}`,
      `🚚 *Livraison :* ${shipping === 0 ? 'GRATUITE' : '$' + shipping.toFixed(2)}`,
      `💰 *TOTAL : $${total.toFixed(2)}*`,
      ``,
      `🔖 *Commande :* #${orderRef}`,
      `📅 ${date}`,
      ``,
      `⏳ En attente de vos instructions de paiement.`
    ].filter(l => l !== null).join('\n');

    res.status(201).json({
      success: true,
      data: {
        orderId:   order.id,
        orderRef,
        total,
        message    // le message prêt pour WhatsApp
      }
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
      'pending_payment', 'payment_received',
      'pending_delivery', 'shipped', 'delivered', 'cancelled',
      'pending', 'processing' // anciens statuts legacy
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: "${status}". Valid: ${validStatuses.join(', ')}` });
    }

    // Normalise les anciens statuts vers les nouveaux si nécessaire
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

// GET /api/admin/orders — toutes les commandes
async function getAllOrders(req, res) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, status, total, customer_name, customer_phone, notes, created_at,
        users ( email ),
        order_items ( id, name, image_url, price, quantity )
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