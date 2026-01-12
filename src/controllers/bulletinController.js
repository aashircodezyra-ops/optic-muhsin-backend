const Bulletin = require('../models/Bulletin');
const { translate } = require('../utils/translations');
const { paginate } = require('../utils/helpers');

// Get bulletin matches
const getBulletin = async (req, res) => {
  try {
    const { page, limit, sport, league, team, date, status } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    const filter = {};
    if (sport) filter.sport = sport;
    if (league) filter.league = { $regex: league, $options: 'i' };
    if (team) {
      filter.$or = [
        { homeTeam: { $regex: team, $options: 'i' } },
        { awayTeam: { $regex: team, $options: 'i' } },
      ];
    }
    if (date) {
      const dateObj = new Date(date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.matchDate = { $gte: dateObj, $lt: nextDay };
    }
    if (status) filter.status = status;

    const matches = await Bulletin.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ matchDate: -1 });

    const total = await Bulletin.countDocuments(filter);

    res.json({
      success: true,
      data: {
        matches,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get single match bulletin
const getMatchBulletin = async (req, res) => {
  try {
    const match = await Bulletin.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: translate('error.not.found', req.query.lang || 'en'),
      });
    }

    res.json({
      success: true,
      data: { match },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Create/Update match bulletin (Admin only)
const upsertMatch = async (req, res) => {
  try {
    const match = await Bulletin.findOneAndUpdate(
      { matchId: req.body.matchId || req.body._id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Match bulletin updated',
      data: { match },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

module.exports = {
  getBulletin,
  getMatchBulletin,
  upsertMatch,
};

