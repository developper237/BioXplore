const { supabase } = require('../config/supabase');

// GET /api/admin/products — tous les produits (y compris inactifs)
async function getAllProducts(req, res) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('admin.getAllProducts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/admin/products — créer un produit
async function createProduct(req, res) {
  try {
    const {
      name, scientific, category, price, oldPrice,
      rating, reviews, badge, description,
      imageUrl, altText, features, stock
    } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ success: false, message: 'name, category and price are required' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        scientific:  scientific  || null,
        category,
        price:       parseFloat(price),
        old_price:   oldPrice ? parseFloat(oldPrice) : null,
        rating:      rating   ? parseFloat(rating)   : 0,
        reviews:     reviews  ? parseInt(reviews)    : 0,
        badge:       badge    || null,
        description: description || null,
        image_url:   imageUrl || null,
        alt_text:    altText  || null,
        features:    features || [],
        stock:       stock    ? parseInt(stock) : 99,
        is_active:   true
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('admin.createProduct error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// PUT /api/admin/products/:id — modifier un produit
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name, scientific, category, price, oldPrice,
      rating, reviews, badge, description,
      imageUrl, altText, features, stock, isActive
    } = req.body;

    const updates = {};
    if (name        !== undefined) updates.name        = name;
    if (scientific  !== undefined) updates.scientific  = scientific;
    if (category    !== undefined) updates.category    = category;
    if (price       !== undefined) updates.price       = parseFloat(price);
    if (oldPrice    !== undefined) updates.old_price   = oldPrice ? parseFloat(oldPrice) : null;
    if (rating      !== undefined) updates.rating      = parseFloat(rating);
    if (reviews     !== undefined) updates.reviews     = parseInt(reviews);
    if (badge       !== undefined) updates.badge       = badge || null;
    if (description !== undefined) updates.description = description;
    if (imageUrl    !== undefined) updates.image_url   = imageUrl;
    if (altText     !== undefined) updates.alt_text    = altText;
    if (features    !== undefined) updates.features    = features;
    if (stock       !== undefined) updates.stock       = parseInt(stock);
    if (isActive    !== undefined) updates.is_active   = isActive;

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('admin.updateProduct error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// DELETE /api/admin/products/:id — supprimer (soft delete = is_active false)
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const { hard } = req.query; // ?hard=true pour suppression réelle

    if (hard === 'true') {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true, message: 'Product permanently deleted' });
    }

    // Soft delete par défaut
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'Product deactivated', data });
  } catch (error) {
    console.error('admin.deleteProduct error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getAllProducts, createProduct, updateProduct, deleteProduct };