const mongoose = require('mongoose');

const predictionCacheSchema = new mongoose.Schema({
  match_id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  sport: {
    type: String,
    enum: ['football', 'basketball'],
    required: true,
  },
  category: {
    type: String,
    enum: ['banker', 'surprise', 'vip'],
    required: true,
  },
  prediction: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  homeTeam: {
    id: Number,
    name: String,
    rank: Number,
  },
  awayTeam: {
    id: Number,
    name: String,
    rank: Number,
  },
  league: {
    id: Number,
    name: String,
  },
  fixture: {
    date: Date,
    time: String,
  },
  reasoning: {
    homeForm: String,
    awayForm: String,
    h2h: String,
    stats: mongoose.Schema.Types.Mixed,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
predictionCacheSchema.index({ sport: 1, category: 1 });
predictionCacheSchema.index({ confidence: -1 });
predictionCacheSchema.index({ lastUpdated: 1 });

module.exports = mongoose.model('PredictionCache', predictionCacheSchema);


