const express = require('express');
const router = express.Router();
const { getProducts, getProductById } = require('../controllers/productsController');

// Routes publiques (pas besoin d'être connecté pour voir les produits)
router.get('/', getProducts);
router.get('/:id', getProductById);

module.exports = router;