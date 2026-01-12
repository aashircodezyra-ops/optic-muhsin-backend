const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  // Match ID from API-Football
  matchId: {
    type: String,
    required: [true, 'Match ID is required'],
    index: true,
  },
  // Admin who created this prediction (optional, for manual predictions)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Prediction type
  predictionType: {
    type: String,
    enum: ['all', 'banker', 'surprise', 'vip'],
    required: [true, 'Prediction type is required'],
    default: 'all',
  },
  // Sport type
  sport: {
    type: String,
    enum: ['football', 'basketball'],
    default: 'football',
  },
  // League name
  league: {
    type: String,
    required: [true, 'League is required'],
  },
  // Team names
  homeTeam: {
    type: String,
    required: [true, 'Home team is required'],
  },
  awayTeam: {
    type: String,
    required: [true, 'Away team is required'],
  },
  // Match start date/time (alias for matchTime)
  matchStart: {
    type: Date,
    required: [true, 'Match start date is required'],
  },
  // Match time (alias for matchStart, for consistency)
  matchTime: {
    type: Date,
    required: [true, 'Match time is required'],
  },
  // Prediction text (legacy field)
  prediction: {
    type: String,
    default: '',
  },
  // Tip (e.g., "Over 2.5", "BTTS", "1X", etc.)
  tip: {
    type: String,
    required: [true, 'Tip is required'],
  },
  // Confidence level (0-100)
  confidence: {
    type: Number,
    required: [true, 'Confidence is required'],
    min: 0,
    max: 100,
    default: 50,
  },
  // Source of prediction
  source: {
    type: String,
    enum: ['ai', 'api-football', 'manual'],
    default: 'api-football',
  },
  // Optional notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: '',
  },
  // VIP only flag
  isVIP: {
    type: Boolean,
    default: false,
  },
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'void'],
    default: 'pending',
  },
  // Result tracking
  result: {
    homeScore: {
      type: Number,
      default: null,
    },
    awayScore: {
      type: Number,
      default: null,
    },
  },
  // Public visibility
  isPublic: {
    type: Boolean,
    default: true,
  },
  // View count
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
predictionSchema.index({ matchId: 1 }, { unique: true });
predictionSchema.index({ predictionType: 1, createdAt: -1 });
predictionSchema.index({ isVIP: 1, createdAt: -1 });
predictionSchema.index({ status: 1 });
predictionSchema.index({ matchStart: 1 });
predictionSchema.index({ matchTime: 1 });
predictionSchema.index({ sport: 1, predictionType: 1 });
predictionSchema.index({ source: 1 });

// Pre-save hook to sync matchStart and matchTime
predictionSchema.pre('save', function(next) {
  if (this.matchStart && !this.matchTime) {
    this.matchTime = this.matchStart;
  } else if (this.matchTime && !this.matchStart) {
    this.matchStart = this.matchTime;
  }
  next();
});

module.exports = mongoose.model('Prediction', predictionSchema);

