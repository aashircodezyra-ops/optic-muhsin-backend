const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Get the first error message for better user experience
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg || 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Auth validators
const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('Name can only contain letters, numbers, and spaces'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const loginValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Prediction validators
const predictionValidator = [
  body('category')
    .isIn(['banker', 'surprise', 'coupon', 'vip'])
    .withMessage('Invalid prediction category'),
  body('sport')
    .optional()
    .isIn(['football', 'basketball'])
    .withMessage('Invalid sport'),
  body('league')
    .trim()
    .notEmpty()
    .withMessage('League is required'),
  body('homeTeam')
    .trim()
    .notEmpty()
    .withMessage('Home team is required'),
  body('awayTeam')
    .trim()
    .notEmpty()
    .withMessage('Away team is required'),
  body('prediction')
    .trim()
    .notEmpty()
    .withMessage('Prediction is required'),
  body('matchDate')
    .isISO8601()
    .withMessage('Invalid match date format'),
  handleValidationErrors,
];

// Comment validators
const commentValidator = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),
  body('relatedTo.type')
    .isIn(['prediction', 'news', 'bulletin'])
    .withMessage('Invalid related type'),
  body('relatedTo.id')
    .notEmpty()
    .withMessage('Related ID is required'),
  handleValidationErrors,
];

// VIP payment validators
const vipPaymentValidator = [
  body('plan')
    .isIn(['monthly', '3months', 'yearly'])
    .withMessage('Invalid VIP plan'),
  body('paymentMethod')
    .isIn(['stripe', 'paypal'])
    .withMessage('Invalid payment method'),
  handleValidationErrors,
];

// Ad configuration validators
const adConfigurationValidator = [
  body('provider')
    .isIn(['google-adsense', 'taboola', 'ezoic', 'media-net'])
    .withMessage('Invalid ad provider'),
  body('providerName')
    .isIn(['Google AdSense', 'Taboola', 'Ezoic', 'Media.net'])
    .withMessage('Invalid provider name'),
  body('adUnitId')
    .trim()
    .notEmpty()
    .withMessage('Ad unit ID is required'),
  body('position')
    .isIn(['header', 'sidebar', 'content-top', 'content-middle', 'content-bottom', 'footer', 'in-article', 'sticky'])
    .withMessage('Invalid ad position'),
  body('size.width')
    .isInt({ min: 1 })
    .withMessage('Size width must be a positive integer'),
  body('size.height')
    .isInt({ min: 1 })
    .withMessage('Size height must be a positive integer'),
  body('adType')
    .optional()
    .isIn(['banner', 'video', 'native', 'display', 'in-article', 'in-feed'])
    .withMessage('Invalid ad type'),
  handleValidationErrors,
];

module.exports = {
  registerValidator,
  loginValidator,
  predictionValidator,
  commentValidator,
  vipPaymentValidator,
  adConfigurationValidator,
  handleValidationErrors,
};

