const express = require('express');
const router = express.Router();
const { createComment, getComments, deleteComment, likeComment, reportComment } = require('../controllers/commentsController');
const { verifyUserAuth } = require('../middlewares/auth');
const { verifyAdminAuth } = require('../middlewares/adminAuth');
const { apiLimiter, commentLimiter } = require('../middlewares/rateLimiter');

// Public endpoint - Get comments list (must be before /:id routes)
router.get('/list', apiLimiter, getComments);

// User endpoint - Create comment (requires user auth, rate limited)
router.post('/create', apiLimiter, commentLimiter, verifyUserAuth, createComment);

// User endpoints - Like and Report (requires user auth, must be before /:id delete)
router.post('/:id/like', apiLimiter, verifyUserAuth, likeComment);
router.post('/:id/report', apiLimiter, verifyUserAuth, reportComment);

// Admin endpoint - Delete comment (requires admin auth, must be last)
router.delete('/:id', apiLimiter, verifyAdminAuth, deleteComment);

module.exports = router;
