const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true,
  },
  vipStatus: {
    type: Boolean,
    default: false,
    required: true,
  },
  vipExpiry: {
    type: Date,
    default: null,
  },
  vipPlan: {
    type: String,
    enum: ['none', 'monthly', '3months', 'yearly'],
    default: 'none',
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'paypal', null],
    default: null,
  },
  paymentId: {
    type: String,
    default: null,
  },
  subscriptionId: {
    type: String,
    default: null,
  },
  lastPaymentDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
membershipSchema.index({ vipStatus: 1, vipExpiry: 1 });
membershipSchema.index({ userId: 1 });

// Method to check if VIP is active
membershipSchema.methods.isActive = function() {
  if (!this.vipStatus) return false;
  if (!this.vipExpiry) return false;
  return new Date(this.vipExpiry) > new Date();
};

// Method to get days remaining
membershipSchema.methods.getDaysRemaining = function() {
  if (!this.isActive()) return 0;
  const now = new Date();
  const expiry = new Date(this.vipExpiry);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Pre-save hook to update updatedAt
membershipSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Membership', membershipSchema);

