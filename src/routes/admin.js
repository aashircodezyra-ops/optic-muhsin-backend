const express = require('express');
const router = express.Router();
const { adminLogin, getAdminInfo } = require('../controllers/adminController');
const { getDashboardStats, getRecentActivity } = require('../controllers/adminDashboardController');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/adminUsersController');
const { getAllPredictions, createPrediction, updatePrediction, deletePrediction } = require('../controllers/adminPredictionsController');
const { getAllComments, deleteComment, toggleCommentApproval } = require('../controllers/adminCommentsController');
const { getReports } = require('../controllers/adminReportsController');
const { getSettings, updateSettings } = require('../controllers/adminSettingsController');
const { verifyAdminAuth } = require('../middlewares/adminAuth');
const { apiLimiter, adminLoginLimiter } = require('../middlewares/rateLimiter');

/**
 * Admin Login Route (Public)
 * POST /api/admin/login
 */
router.post('/login', apiLimiter, adminLoginLimiter, adminLogin);

/**
 * Get Admin Info (Protected)
 * GET /api/admin/me
 */
router.get('/me', apiLimiter, verifyAdminAuth, getAdminInfo);

/**
 * Dashboard Routes (Protected)
 */
router.get('/stats', apiLimiter, verifyAdminAuth, getDashboardStats);
router.get('/activity', apiLimiter, verifyAdminAuth, getRecentActivity);

/**
 * User Management Routes (Protected)
 */
router.get('/users', apiLimiter, verifyAdminAuth, getAllUsers);
router.get('/users/:id', apiLimiter, verifyAdminAuth, getUserById);
router.post('/users', apiLimiter, verifyAdminAuth, createUser);
router.put('/users/:id', apiLimiter, verifyAdminAuth, updateUser);
router.delete('/users/:id', apiLimiter, verifyAdminAuth, deleteUser);

/**
 * Predictions Management Routes (Protected)
 */
router.get('/predictions', apiLimiter, verifyAdminAuth, getAllPredictions);
router.post('/predictions', apiLimiter, verifyAdminAuth, createPrediction);
router.put('/predictions/:id', apiLimiter, verifyAdminAuth, updatePrediction);
router.delete('/predictions/:id', apiLimiter, verifyAdminAuth, deletePrediction);

/**
 * Comments Management Routes (Protected)
 */
router.get('/comments', apiLimiter, verifyAdminAuth, getAllComments);
router.delete('/comments/:id', apiLimiter, verifyAdminAuth, deleteComment);
router.put('/comments/:id/approve', apiLimiter, verifyAdminAuth, toggleCommentApproval);

/**
 * Reports & Analytics Routes (Protected)
 */
router.get('/reports', apiLimiter, verifyAdminAuth, getReports);

/**
 * Settings Routes (Protected)
 */
router.get('/settings', apiLimiter, verifyAdminAuth, getSettings);
router.post('/settings', apiLimiter, verifyAdminAuth, updateSettings);

module.exports = router;

