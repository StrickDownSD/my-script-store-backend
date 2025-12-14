const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authenticateToken = require('../middleware/auth.middleware');

// Protect order creation with JWT authentication
router.post('/', authenticateToken, orderController.createOrder);

module.exports = router;
