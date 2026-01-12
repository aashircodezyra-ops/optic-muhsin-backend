const mongoose = require('mongoose');

const adConfigurationSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['google-adsense', 'taboola', 'ezoic', 'media-net'],
    required: [true, 'Ad provider is required'],
  },
  providerName: {
    type: String,
    required: [true, 'Provider name is required'],
    enum: ['Google AdSense', 'Taboola', 'Ezoic', 'Media.net'],
  },
  adType: {
    type: String,
    enum: ['banner', 'video', 'native', 'display', 'in-article', 'in-feed'],
    required: [true, 'Ad type is required'],
    default: 'banner',
  },
  adUnitId: {
    type: String,
    required: [true, 'Ad unit ID is required'],
    trim: true,
  },
  position: {
    type: String,
    enum: ['header', 'sidebar', 'content-top', 'content-middle', 'content-bottom', 'footer', 'in-article', 'sticky'],
    required: [true, 'Ad position is required'],
  },
  size: {
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
  },
  sizeLabel: {
    type: String,
    enum: ['300x250', '728x90', '320x50', '970x250', '300x600', '336x280', 'responsive', 'auto'],
    default: 'responsive',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Provider-specific settings
  settings: {
    // Google AdSense specific
    adFormat: {
      type: String,
      enum: ['auto', 'rectangle', 'vertical', 'horizontal', 'square', 'fluid'],
      default: 'auto',
    },
    adLayout: {
      type: String,
      default: null,
    },
    // Taboola specific
    publisherId: {
      type: String,
      default: null,
    },
    mode: {
      type: String,
      enum: ['thumbnails-a', 'thumbnails-b', 'mixed', 'video'],
      default: 'thumbnails-a',
    },
    // Ezoic specific
    placementId: {
      type: String,
      default: null,
    },
    // Media.net specific
    customerId: {
      type: String,
      default: null,
    },
  },
  // Additional configuration
  displayRules: {
    showOnPages: {
      type: [String],
      enum: ['home', 'predictions', 'news', 'live-scores', 'all'],
      default: ['all'],
    },
    hideForVIP: {
      type: Boolean,
      default: false,
    },
    hideForAdBlockers: {
      type: Boolean,
      default: true,
    },
    maxPerPage: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
  },
  // Tracking
  impressions: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
adConfigurationSchema.index({ provider: 1, position: 1 });
adConfigurationSchema.index({ isActive: 1, position: 1 });
adConfigurationSchema.index({ provider: 1, isActive: 1 });

// Compound index for active ads by position
adConfigurationSchema.index({ isActive: 1, position: 1, provider: 1 });

// Method to get display configuration for frontend
adConfigurationSchema.methods.getDisplayConfig = function() {
  return {
    provider: this.provider,
    providerName: this.providerName,
    adType: this.adType,
    adUnitId: this.adUnitId,
    position: this.position,
    size: this.size,
    sizeLabel: this.sizeLabel,
    settings: this.settings,
    displayRules: this.displayRules,
  };
};

// Static method to get active ads by position
adConfigurationSchema.statics.getActiveByPosition = async function(position) {
  return this.find({
    isActive: true,
    position: position,
  }).sort({ createdAt: -1 });
};

// Static method to get active ads by provider
adConfigurationSchema.statics.getActiveByProvider = async function(provider) {
  return this.find({
    isActive: true,
    provider: provider,
  }).sort({ position: 1 });
};

module.exports = mongoose.model('AdConfiguration', adConfigurationSchema);

