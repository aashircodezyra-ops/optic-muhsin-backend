const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  skipSuccessfulRequests: true,
});

// Comment rate limiter (1 comment per 5 seconds)
const commentLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 1, // limit each IP to 1 request per windowMs
  message: {
    success: false,
    message: 'Please wait 5 seconds before posting another comment',
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
});

// Prediction creation limiter
const predictionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each user to 20 predictions per hour
  message: {
    success: false,
    message: 'Too many predictions created, please try again later',
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
});

// Admin login limiter (more lenient - allows many attempts)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (much higher than regular auth)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  commentLimiter,
  predictionLimiter,
  adminLoginLimiter,
};

