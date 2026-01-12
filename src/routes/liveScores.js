const express = require('express');
const router = express.Router();
const { getToday, getLive, getMatch, getLeaguesList } = require('../controllers/liveScoresController');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.get('/today', apiLimiter, getToday);
router.get('/live', apiLimiter, getLive);
router.get('/leagues', apiLimiter, getLeaguesList);
router.get('/match/:fixtureId', apiLimiter, getMatch);

module.exports = router;

