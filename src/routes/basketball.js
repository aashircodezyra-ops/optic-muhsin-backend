const express = require('express');
const router = express.Router();
const {
  getLive,
  getUpcoming,
  getLeagues,
  getTeams,
  getStandings,
  getMatch,
  getSportsDBTeams,
  getSportsDBLeagues,
} = require('../controllers/basketballController');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Basketball routes
router.get('/live', apiLimiter, getLive);
router.get('/upcoming', apiLimiter, getUpcoming);
router.get('/leagues', apiLimiter, getLeagues);
router.get('/teams', apiLimiter, getTeams);
router.get('/standings', apiLimiter, getStandings);
router.get('/match/:id', apiLimiter, getMatch);

// TheSportsDB routes (static data)
router.get('/sportsdb/teams', apiLimiter, getSportsDBTeams);
router.get('/sportsdb/leagues', apiLimiter, getSportsDBLeagues);

module.exports = router;


