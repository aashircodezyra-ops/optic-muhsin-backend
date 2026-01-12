const mongoose = require('mongoose');

const basketballLiveMatchSchema = new mongoose.Schema({
  match_id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  fixture: {
    id: Number,
    date: Date,
    timezone: String,
    timestamp: Number,
    periods: {
      first: String,
      second: String,
      overtime: String,
    },
    venue: {
      id: Number,
      name: String,
      city: String,
    },
    status: {
      long: String,
      short: String,
      elapsed: Number,
    },
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
  },
  teams: {
    home: {
      id: Number,
      name: String,
      logo: String,
      winner: Boolean,
    },
    away: {
      id: Number,
      name: String,
      logo: String,
      winner: Boolean,
    },
  },
  scores: {
    home: {
      quarter_1: Number,
      quarter_2: Number,
      quarter_3: Number,
      quarter_4: Number,
      over_time: Number,
      total: Number,
    },
    away: {
      quarter_1: Number,
      quarter_2: Number,
      quarter_3: Number,
      quarter_4: Number,
      over_time: Number,
      total: Number,
    },
  },
  events: [{
    time: {
      elapsed: Number,
      extra: Number,
    },
    team: {
      id: Number,
      name: String,
      logo: String,
    },
    player: {
      id: Number,
      name: String,
    },
    type: String,
    detail: String,
    comments: String,
  }],
  statistics: [{
    team: {
      id: Number,
      name: String,
      logo: String,
    },
    statistics: [{
      type: String,
      value: mongoose.Schema.Types.Mixed,
    }],
  }],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
basketballLiveMatchSchema.index({ 'fixture.date': 1 });
basketballLiveMatchSchema.index({ 'fixture.status.short': 1 });
basketballLiveMatchSchema.index({ lastUpdated: 1 });

module.exports = mongoose.model('BasketballLiveMatch', basketballLiveMatchSchema);


