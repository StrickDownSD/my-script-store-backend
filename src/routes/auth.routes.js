const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/verify', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/resend-otp', authController.resendOTP);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
