const express = require('express');
const router = express.Router();
const { getBulletin, getMatchBulletin, upsertMatch } = require('../controllers/bulletinController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.get('/', apiLimiter, getBulletin);
router.get('/:id', apiLimiter, getMatchBulletin);
router.post('/', apiLimiter, authenticate, requireAdmin, upsertMatch);
router.put('/:id', apiLimiter, authenticate, requireAdmin, upsertMatch);

module.exports = router;

