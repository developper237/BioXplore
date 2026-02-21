const express = require('express');
const router  = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getOrders, getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/ordersWishlistController');
const { createCheckout, updateOrderStatus, getAllOrders } = require('../controllers/checkoutController');

// Routes user (connecté)
router.use(authenticateToken);

router.get   ('/orders',              getOrders);
router.get   ('/wishlist',            getWishlist);
router.post  ('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);
router.post  ('/checkout',            createCheckout);

// Routes admin
router.get('/admin/orders',                   requireAdmin, getAllOrders);
router.put('/admin/orders/:id/status',        requireAdmin, updateOrderStatus);

module.exports = router;