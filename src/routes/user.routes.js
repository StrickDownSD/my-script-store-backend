const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const statsController = require('../controllers/stats.controller');
const authenticateToken = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/admin.middleware');

// All routes require authentication and admin role
router.use(authenticateToken, isAdmin);

// Stats route
router.get('/stats', statsController.getAdminStats);

// User management routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;
