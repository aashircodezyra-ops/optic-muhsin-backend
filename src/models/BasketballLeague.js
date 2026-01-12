const mongoose = require('mongoose');

const basketballLeagueSchema = new mongoose.Schema({
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
    id: Number,
    name: String,
    code: String,
    flag: String,
  },
  seasons: [{
    year: Number,
    start: Date,
    end: Date,
    current: Boolean,
  }],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('BasketballLeague', basketballLeagueSchema);


