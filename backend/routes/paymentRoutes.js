// routes/paymentRoutes.js
const express = require('express');
const router  = express.Router();
const {
  createOrder, verifyPayment, webhook, getHistory, getPlanStatus
} = require('../controllers/paymentController');
const { protect, isOrgOwner } = require('../middleware/auth');

// Webhook — raw body needed, no auth (Razorpay calls this)
router.post('/webhook', express.raw({ type:'application/json' }), webhook);

// Protected routes — org_owner only
router.post('/create-order', protect, isOrgOwner, createOrder);
router.post('/verify',       protect, isOrgOwner, verifyPayment);
router.get('/history',       protect, isOrgOwner, getHistory);
router.get('/status',        protect, protect, getPlanStatus);

module.exports = router;
