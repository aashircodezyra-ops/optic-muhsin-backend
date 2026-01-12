const mongoose = require('mongoose');

const footballLiveMatchSchema = new mongoose.Schema({
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
  lineups: [{
    team: {
      id: Number,
      name: String,
      logo: String,
      colors: {
        player: {
          primary: String,
          number: String,
          border: String,
        },
        goalkeeper: {
          primary: String,
          number: String,
          border: String,
        },
      },
    },
    coach: {
      id: Number,
      name: String,
      photo: String,
    },
    formation: String,
    startXI: [{
      player: {
        id: Number,
        name: String,
        number: Number,
        pos: String,
        grid: String,
      },
    }],
    substitutes: [{
      player: {
        id: Number,
        name: String,
        number: Number,
        pos: String,
        grid: String,
      },
    }],
  }],
  cards: {
    home: [{
      time: {
        elapsed: Number,
        extra: Number,
      },
      player: {
        id: Number,
        name: String,
      },
      type: String,
    }],
    away: [{
      time: {
        elapsed: Number,
        extra: Number,
      },
      player: {
        id: Number,
        name: String,
      },
      type: String,
    }],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
footballLiveMatchSchema.index({ 'fixture.date': 1 });
footballLiveMatchSchema.index({ 'fixture.status.short': 1 });
footballLiveMatchSchema.index({ lastUpdated: 1 });

module.exports = mongoose.model('FootballLiveMatch', footballLiveMatchSchema);


