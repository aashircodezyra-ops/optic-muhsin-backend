const mongoose = require('mongoose');

const basketballTeamSchema = new mongoose.Schema({
  team_id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  team: {
    id: Number,
    name: String,
    code: String,
    logo: String,
    country: String,
    founded: Number,
    national: Boolean,
  },
  venue: {
    id: Number,
    name: String,
    address: String,
    city: String,
    capacity: Number,
    surface: String,
    image: String,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('BasketballTeam', basketballTeamSchema);


