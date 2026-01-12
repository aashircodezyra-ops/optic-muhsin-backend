const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', apiLimiter, getProfile);

// Update user profile
router.put('/update', apiLimiter, updateProfile);

// Change password
router.put('/change-password', apiLimiter, changePassword);

// Delete account
router.delete('/delete', apiLimiter, deleteAccount);

module.exports = router;

