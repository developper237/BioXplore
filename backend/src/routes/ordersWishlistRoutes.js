const express = require('express');
const router  = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getOrders, getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/ordersWishlistController');
const { createCheckout, updateOrderStatus, getAllOrders } = require('../controllers/checkoutController');

// Routes utilisateur connecté
router.get   ('/orders',              authenticateToken, getOrders);
router.get   ('/wishlist',            authenticateToken, getWishlist);
router.post  ('/wishlist/:productId', authenticateToken, addToWishlist);
router.delete('/wishlist/:productId', authenticateToken, removeFromWishlist);
router.post  ('/checkout',            authenticateToken, createCheckout);

// Routes admin
router.get('/admin/orders',            authenticateToken, requireAdmin, getAllOrders);
router.put('/admin/orders/:id/status', authenticateToken, requireAdmin, updateOrderStatus);

module.exports = router;