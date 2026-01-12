const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  slot: {
    type: String,
    enum: ['topBanner', 'sidebar', 'content1', 'content2', 'footer'],
    required: [true, 'Ad slot is required'],
    unique: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  image: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  link: {
    type: String,
    required: [true, 'Link is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
  displayCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
adSchema.index({ slot: 1 }, { unique: true });
adSchema.index({ isActive: 1 });

module.exports = mongoose.model('Ad', adSchema);

