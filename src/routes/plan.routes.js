
const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { auth, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', planController.getPlans);

// Admin routes
router.put('/:id', auth, isAdmin, planController.updatePlan);

module.exports = router;
