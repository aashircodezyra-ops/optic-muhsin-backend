const express = require('express');
const router = express.Router();
const {
  getVIPPlans,
  createPaymentIntent,
  createSession,
  activateVIP,
  getVIPStatus,
  handleWebhook,
  verifyVIPStatus,
} = require('../controllers/vipController');
const { authenticate, requireVIP } = require('../middlewares/auth');
const { vipPaymentValidator } = require('../middlewares/validator');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Public routes
router.get('/plans', apiLimiter, getVIPPlans);

// Authenticated routes
router.post('/create-session', apiLimiter, authenticate, vipPaymentValidator, createSession);
router.post('/payment', apiLimiter, authenticate, vipPaymentValidator, createPaymentIntent);
router.post('/activate', apiLimiter, authenticate, vipPaymentValidator, activateVIP);
router.get('/status', apiLimiter, authenticate, getVIPStatus);
router.get('/verify', apiLimiter, authenticate, verifyVIPStatus);

// Webhook routes (no authentication required, but signature verification should be done in controller)
// Stripe webhook - requires raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleWebhook);
// PayPal webhook - can use JSON body
router.post('/webhook/paypal', express.json(), handleWebhook);

module.exports = router;

