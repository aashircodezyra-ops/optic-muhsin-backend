const express = require('express');
const router = express.Router();
const { notifyVIP, notifyUsers } = require('../controllers/notificationController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.post('/vip', apiLimiter, authenticate, requireAdmin, notifyVIP);
router.post('/users', apiLimiter, authenticate, requireAdmin, notifyUsers);

module.exports = router;

