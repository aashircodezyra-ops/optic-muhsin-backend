const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { registerValidator, loginValidator } = require('../middlewares/validator');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Removed authLimiter - only using general apiLimiter (100 requests per 15 minutes)
router.post('/register', apiLimiter, registerValidator, register);
router.post('/login', apiLimiter, loginValidator, login);
router.get('/me', apiLimiter, authenticate, getMe);

module.exports = router;

