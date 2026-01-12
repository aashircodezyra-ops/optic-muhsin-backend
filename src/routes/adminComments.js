const express = require('express');
const router = express.Router();
const { getAllComments, deleteComment } = require('../controllers/adminCommentsController');
const { verifyAdminAuth } = require('../middlewares/adminAuth');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Admin-only endpoint - Get all comments with filters
router.get('/', apiLimiter, verifyAdminAuth, getAllComments);

// Admin-only endpoint - Delete a comment
router.delete('/:id', apiLimiter, verifyAdminAuth, deleteComment);

module.exports = router;

