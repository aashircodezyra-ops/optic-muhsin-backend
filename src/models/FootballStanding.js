const mongoose = require('mongoose');

const footballStandingSchema = new mongoose.Schema({
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
    country: String,
    logo: String,
    flag: String,
    season: Number,
    standings: [{
      rank: Number,
      team: {
        id: Number,
        name: String,
        logo: String,
      },
      points: Number,
      goalsDiff: Number,
      group: String,
      form: String,
      status: String,
      description: String,
      all: {
        played: Number,
        win: Number,
        draw: Number,
        lose: Number,
        goals: {
          for: Number,
          against: Number,
        },
      },
      home: {
        played: Number,
        win: Number,
        draw: Number,
        lose: Number,
        goals: {
          for: Number,
          against: Number,
        },
      },
      away: {
        played: Number,
        win: Number,
        draw: Number,
        lose: Number,
        goals: {
          for: Number,
          against: Number,
        },
      },
      update: Date,
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
footballStandingSchema.index({ league_id: 1, season: 1 }, { unique: true });

module.exports = mongoose.model('FootballStanding', footballStandingSchema);


