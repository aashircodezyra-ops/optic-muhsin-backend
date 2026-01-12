const express = require('express');
const router = express.Router();
const { getPublicSettings } = require('../controllers/settingsController');
const { apiLimiter } = require('../middlewares/rateLimiter');

/**
 * Get Public Settings
 * GET /api/settings
 */
router.get('/', apiLimiter, getPublicSettings);

module.exports = router;
