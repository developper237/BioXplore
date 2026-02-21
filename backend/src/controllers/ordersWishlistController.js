const { supabase } = require('../config/supabase');

// GET /api/orders — commandes du user connecté
async function getOrders(req, res) {
  try {
    const userId = req.user.userId;

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, status, total, created_at,
        order_items ( id, name, image_url, price, quantity, product_id )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/wishlist — wishlist du user connecté
async function getWishlist(req, res) {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        id, added_at,
        products ( id, name, price, old_price, image_url, badge, is_active )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('getWishlist error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/wishlist/:productId — ajouter à la wishlist
async function addToWishlist(req, res) {
  try {
    const userId    = req.user.userId;
    const productId = parseInt(req.params.productId);

    const { data, error } = await supabase
      .from('wishlist')
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // duplicate
        return res.status(409).json({ success: false, message: 'Already in wishlist' });
      }
      throw error;
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('addToWishlist error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/wishlist/:productId — retirer de la wishlist
async function removeFromWishlist(req, res) {
  try {
    const userId    = req.user.userId;
    const productId = parseInt(req.params.productId);

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    console.error('removeFromWishlist error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getOrders, getWishlist, addToWishlist, removeFromWishlist };