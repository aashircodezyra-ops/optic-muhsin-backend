const mongoose = require('mongoose');

const footballLeagueSchema = new mongoose.Schema({
  league_id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  league: {
    id: Number,
    name: String,
    type: String,
    logo: String,
  },
  country: {
    name: String,
    code: String,
    flag: String,
  },
  seasons: [{
    year: Number,
    start: Date,
    end: Date,
    current: Boolean,
    coverage: {
      fixtures: {
        events: Boolean,
        lineups: Boolean,
        statistics_fixtures: Boolean,
        statistics_players: Boolean,
      },
      standings: Boolean,
      players: Boolean,
      top_scorers: Boolean,
      top_assists: Boolean,
      top_cards: Boolean,
      injuries: Boolean,
      predictions: Boolean,
      odds: Boolean,
    },
  }],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FootballLeague', footballLeagueSchema);


