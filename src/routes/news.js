const express = require('express');
const router = express.Router();
const { getNews, getSportsNews, getBulletin, getSingleNews, refreshNews } = require('../controllers/newsController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.get('/', apiLimiter, getNews);
router.get('/sports', apiLimiter, getSportsNews); // Sports news endpoint (must be before /:id)
router.get('/bulletin', apiLimiter, getBulletin);
router.get('/:id', apiLimiter, getSingleNews);
router.post('/refresh', apiLimiter, authenticate, requireAdmin, refreshNews);

module.exports = router;

