const mongoose = require('mongoose');

const bulletinSchema = new mongoose.Schema({
  sport: {
    type: String,
    enum: ['football', 'basketball'],
    required: [true, 'Sport is required'],
  },
  league: {
    type: String,
    required: [true, 'League is required'],
  },
  homeTeam: {
    type: String,
    required: [true, 'Home team is required'],
  },
  awayTeam: {
    type: String,
    required: [true, 'Away team is required'],
  },
  matchDate: {
    type: Date,
    required: [true, 'Match date is required'],
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'finished', 'postponed'],
    default: 'scheduled',
  },
  score: {
    home: {
      type: Number,
      default: null,
    },
    away: {
      type: Number,
      default: null,
    },
  },
  venue: {
    type: String,
    default: '',
  },
  referee: {
    type: String,
    default: '',
  },
  matchId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
bulletinSchema.index({ sport: 1, matchDate: -1 });
bulletinSchema.index({ league: 1 });
bulletinSchema.index({ status: 1 });
bulletinSchema.index({ matchDate: 1 });

module.exports = mongoose.model('Bulletin', bulletinSchema);

