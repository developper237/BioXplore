const { supabase } = require('../config/supabase');

// GET /api/products
// Query params: category, badge, sort, minPrice, maxPrice, search
async function getProducts(req, res) {
  try {
    const { category, badge, sort, minPrice, maxPrice, search } = req.query;

    let query = supabase
      .from('products')
      .select('id, name, scientific, category, price, old_price, rating, reviews, badge, description, image_url, alt_text, features, stock')
      .eq('is_active', true);

    // Filtres
    if (category && category !== 'all') {
      if (category === 'sale') {
        query = query.eq('badge', 'sale');
      } else {
        query = query.eq('category', category);
      }
    }
    if (badge) query = query.eq('badge', badge);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    if (search) query = query.ilike('name', `%${search}%`);

    // Tri
    switch (sort) {
      case 'price-asc':  query = query.order('price', { ascending: true });  break;
      case 'price-desc': query = query.order('price', { ascending: false }); break;
      case 'rating':     query = query.order('rating', { ascending: false }); break;
      case 'name-asc':   query = query.order('name', { ascending: true });   break;
      default:           query = query.order('id', { ascending: true });
    }

    const { data: products, error } = await query;

    if (error) throw error;

    // Normaliser pour le frontend (camelCase + renommer image_url → image)
    const normalized = products.map(p => ({
      id:         p.id,
      name:       p.name,
      scientific: p.scientific,
      category:   p.category,
      price:      parseFloat(p.price),
      oldPrice:   p.old_price ? parseFloat(p.old_price) : null,
      rating:     parseFloat(p.rating),
      reviews:    p.reviews,
      badge:      p.badge,
      desc:       p.description,
      image:      p.image_url,
      alt:        p.alt_text,
      features:   (function(f) {
        if (!f) return [];
        if (typeof f === 'string') { try { return JSON.parse(f); } catch(e) { return []; } }
        return Array.isArray(f) ? f : [];
      })(p.features),
      stock:      p.stock
    }));

    res.json({ success: true, data: normalized });

  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, message: 'Server error', detail: error.message });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: {
        id:         product.id,
        name:       product.name,
        scientific: product.scientific,
        category:   product.category,
        price:      parseFloat(product.price),
        oldPrice:   product.old_price ? parseFloat(product.old_price) : null,
        rating:     parseFloat(product.rating),
        reviews:    product.reviews,
        badge:      product.badge,
        desc:       product.description,
        image:      product.image_url,
        alt:        product.alt_text,
        features:   product.features || [],
        stock:      product.stock
      }
    });

  } catch (error) {
    console.error('getProductById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getProducts, getProductById };