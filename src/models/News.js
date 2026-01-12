const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  link: {
    type: String,
    required: [true, 'Link is required'],
  },
  image: {
    type: String,
    default: null,
  },
  source: {
    type: String,
    enum: ['api1', 'api2', 'trt'],
    required: [true, 'Source is required'],
  },
  author: {
    type: String,
    default: null,
  },
  publishedAt: {
    type: Date,
    required: [true, 'Published date is required'],
  },
  tags: {
    type: [String],
    default: [],
  },
  raw: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
// Unique index on link (partial, only if link exists)
newsSchema.index(
  { link: 1 },
  {
    unique: true,
    partialFilterExpression: { link: { $exists: true, $ne: null } },
  }
);

// Index on publishedAt for sorting
newsSchema.index({ publishedAt: -1 });

// Index on source for filtering
newsSchema.index({ source: 1 });

// Index on isActive for filtering
newsSchema.index({ isActive: 1 });

// Compound index for deduplication
newsSchema.index({ title: 1, publishedAt: 1 });

module.exports = mongoose.model('News', newsSchema);
