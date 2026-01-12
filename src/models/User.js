const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isVIP: {
    type: Boolean,
    default: false,
  },
  vipExpiry: {
    type: Date,
    default: null,
  },
  vipExpiryDate: {
    type: Date,
    default: null,
  },
  vipPlan: {
    type: String,
    enum: ['none', 'monthly', '3months', 'yearly'],
    default: 'none',
    required: true,
  },
  profile: {
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
  },
  predictionsCreated: {
    type: Number,
    default: 0,
  },
  lastPredictionDate: {
    type: Date,
    default: null,
  },
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  oneSignalPlayerId: {
    type: String,
    default: null,
  },
  notificationSettings: {
    liveAlerts: { type: Boolean, default: true },
    goals: { type: Boolean, default: true },
    bulletin: { type: Boolean, default: true },
    predictions: { type: Boolean, default: false },
    favTeams: { type: [String], default: [] }
  },
  preferences: {
    theme: { type: String, default: "light" },
    language: { type: String, default: "english" }
  },
  profilePhoto: { type: String, default: "" },
  vipExpiresAt: { type: Date, default: null },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if VIP is active
userSchema.methods.isVIPActive = function() {
  if (!this.isVIP) return false;
  if (!this.vipExpiryDate) return false;
  return this.vipExpiryDate > new Date();
};

// Method to reset daily prediction count
userSchema.methods.resetDailyPredictions = function() {
  const today = new Date();
  const lastDate = this.lastPredictionDate;
  
  if (!lastDate) {
    this.lastPredictionDate = today;
    this.predictionsCreated = 0;
    return true;
  }
  
  const lastDateOnly = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (todayOnly > lastDateOnly) {
    this.lastPredictionDate = today;
    this.predictionsCreated = 0;
    return true;
  }
  
  return false;
};

module.exports = mongoose.model('User', userSchema);

