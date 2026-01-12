const mongoose = require('mongoose');

const basketballStandingSchema = new mongoose.Schema({
  league_id: {
    type: Number,
    required: true,
    index: true,
  },
  season: {
    type: Number,
    required: true,
    index: true,
  },
  league: {
    id: Number,
    name: String,
    type: String,
    logo: String,
    country: {
      id: Number,
      name: String,
      code: String,
      flag: String,
    },
    season: Number,
    standings: [{
      position: Number,
      stage: String,
      group: {
        name: String,
        points: String,
      },
      team: {
        id: Number,
        name: String,
        logo: String,
      },
      conference: {
        name: String,
        rank: Number,
        win: Number,
        loss: Number,
      },
      win: {
        home: Number,
        away: Number,
        total: Number,
        percentage: String,
      },
      loss: {
        home: Number,
        away: Number,
        total: Number,
        percentage: String,
      },
      gamesBehind: String,
      streak: Number,
      winStreak: Boolean,
      tieBreakerPoints: Number,
    }],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
basketballStandingSchema.index({ league_id: 1, season: 1 }, { unique: true });

module.exports = mongoose.model('BasketballStanding', basketballStandingSchema);


