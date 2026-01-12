const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  matchId: {
    type: String,
    default: null,
    index: true,
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    maxlength: [50, 'Username cannot exceed 50 characters'],
  },
  isFlagged: {
    type: Boolean,
    default: false,
  },
  isSpam: {
    type: Boolean,
    default: false,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  reports: {
    type: Number,
    default: 0,
  },
  reportedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
commentSchema.index({ matchId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ isSpam: 1 });
commentSchema.index({ isFlagged: 1 });

module.exports = mongoose.model('Comment', commentSchema);
