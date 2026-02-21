const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/address', profileController.updateAddress);
router.put('/settings', profileController.updateSettings);
router.put('/password', profileController.updatePassword);

module.exports = router;