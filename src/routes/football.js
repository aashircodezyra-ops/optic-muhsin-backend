const express = require('express');
const router = express.Router();
const {
  getLive,
  getUpcoming,
  getLeagues,
  getTeams,
  getStandings,
  getMatch,
  getPlayers,
  getPlayerStats,
  getSportsDBTeams,
  getSportsDBLeagues,
} = require('../controllers/footballController');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Football routes
router.get('/live', apiLimiter, getLive);
router.get('/upcoming', apiLimiter, getUpcoming);
router.get('/leagues', apiLimiter, getLeagues);
router.get('/teams', apiLimiter, getTeams);
router.get('/standings', apiLimiter, getStandings);
router.get('/match/:id', apiLimiter, getMatch);
router.get('/players', apiLimiter, getPlayers);
router.get('/player/:id/stats', apiLimiter, getPlayerStats);

// TheSportsDB routes (static data)
router.get('/sportsdb/teams', apiLimiter, getSportsDBTeams);
router.get('/sportsdb/leagues', apiLimiter, getSportsDBLeagues);

module.exports = router;


