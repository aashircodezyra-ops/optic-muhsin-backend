const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers, getUserById } = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Get all users (Admin only)
router.get('/', apiLimiter, authenticate, requireAdmin, getAllUsers);

// Get user by ID (Admin only)
router.get('/:id', apiLimiter, authenticate, requireAdmin, getUserById);

// Update profile (Authenticated users)
router.put('/profile', apiLimiter, authenticate, updateProfile);

module.exports = router;

