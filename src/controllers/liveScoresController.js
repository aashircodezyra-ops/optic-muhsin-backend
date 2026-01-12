const { getTodayMatches, getLiveMatches, getMatchDetails, getLeagues } = require('../services/apiFootball');
const { translate } = require('../utils/translations');

// Get today's matches
const getToday = async (req, res) => {
  try {
    const { leagueId } = req.query;
    const result = await getTodayMatches(leagueId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to fetch today\'s matches',
      });
    }

    res.json({
      success: true,
      data: { matches: result.data },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get live matches
const getLive = async (req, res) => {
  try {
    const result = await getLiveMatches();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to fetch live matches',
      });
    }

    res.json({
      success: true,
      data: { matches: result.data },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get match details
const getMatch = async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const result = await getMatchDetails(fixtureId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to fetch match details',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get leagues
const getLeaguesList = async (req, res) => {
  try {
    const result = await getLeagues();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to fetch leagues',
      });
    }

    res.json({
      success: true,
      data: { leagues: result.data },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

module.exports = {
  getToday,
  getLive,
  getMatch,
  getLeaguesList,
};

