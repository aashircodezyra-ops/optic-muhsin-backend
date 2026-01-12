const mongoose = require('mongoose');

const footballUpcomingMatchSchema = new mongoose.Schema({
  match_id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  fixture: {
    id: Number,
    referee: String,
    timezone: String,
    date: Date,
    timestamp: Number,
    periods: {
      first: Number,
      second: Number,
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
    country: String,
    logo: String,
    flag: String,
    season: Number,
    round: String,
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
  goals: {
    home: Number,
    away: Number,
  },
  score: {
    halftime: {
      home: Number,
      away: Number,
    },
    fulltime: {
      home: Number,
      away: Number,
    },
    extratime: {
      home: Number,
      away: Number,
    },
    penalty: {
      home: Number,
      away: Number,
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
    assist: {
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
footballUpcomingMatchSchema.index({ 'fixture.date': 1 });
footballUpcomingMatchSchema.index({ 'league.id': 1 });

module.exports = mongoose.model('FootballUpcomingMatch', footballUpcomingMatchSchema);


