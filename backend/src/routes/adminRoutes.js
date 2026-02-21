const express = require('express');
const router  = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const admin = require('../controllers/adminController');

// Toutes les routes admin nécessitent un token valide + rôle admin
router.use(authenticateToken, requireAdmin);

router.get   ('/products',     admin.getAllProducts);
router.post  ('/products',     admin.createProduct);
router.put   ('/products/:id', admin.updateProduct);
router.delete('/products/:id', admin.deleteProduct);

module.exports = router;