const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authenticateToken = require('../middleware/auth.middleware');

// Create checkout session for subscription (requires auth)
router.post('/create-checkout-session', authenticateToken, paymentController.createCheckoutSession);

// Create checkout session for SCRIPT purchase (requires auth)
router.post('/create-script-checkout', authenticateToken, paymentController.createScriptCheckout);

// Get user's purchased scripts/licenses (requires auth)
router.get('/purchases', authenticateToken, paymentController.getUserPurchases);

// Stripe webhook (no auth - called by Stripe)
// Note: This route needs raw body, configured in index.js
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Get order status (requires auth)
router.get('/order/:sessionId', authenticateToken, paymentController.getOrderStatus);

// Get user's subscription (requires auth)
router.get('/subscription', authenticateToken, paymentController.getSubscription);

// Verify session (for success page - no auth needed, just session ID)
router.get('/verify/:sessionId', paymentController.verifySession);

module.exports = router;
