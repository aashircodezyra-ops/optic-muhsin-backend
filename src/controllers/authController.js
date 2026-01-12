const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const bcrypt = require('bcryptjs');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendNotFound,
  sendConflict,
  asyncHandler,
} = require('../utils/responseHandler');

/**
 * Register a new user
 * POST /api/auth/register
 * Accepts: name, email, password
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    const errors = [];
    if (!name || !name.trim()) {
      errors.push('Name is required');
    }
    if (!email || !email.trim()) {
      errors.push('Email is required');
    }
    if (!password) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return sendValidationError(res, 'Invalid email format');
    }

    // Validate password length
    if (password.length < 6) {
      return sendValidationError(res, 'Password must be at least 6 characters');
    }

    // Validate name length
    if (name.trim().length < 2 || name.trim().length > 50) {
      return sendValidationError(res, 'Name must be between 2 and 50 characters');
    }

    // Check if email already exists (must be done before creating user)
    const normalizedEmail = email.toLowerCase().trim();
    try {
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        console.log(`[AuthController] Registration failed - Email already exists: ${normalizedEmail}`);
        return sendConflict(res, 'Email already exists. Please log in instead.');
      }
    } catch (error) {
      console.error('[AuthController] Error checking existing user:', error);
      return sendError(res, 'Error checking user existence', 500);
    }

    // Create user in MongoDB
    // Note: Password will be automatically hashed by the User model's pre-save hook
    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: password, // Pass plain password - pre-save hook will hash it
        role: 'user',
        isVIP: false,
        vipExpiry: null,
      });
    } catch (error) {
      // Handle duplicate key errors (fallback check - should not happen if email check above works)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === 'email') {
          return sendConflict(res, 'Email already exists. Please log in instead.');
        }
        // Handle old 'username' field from previous schema
        if (field === 'username') {
          return sendConflict(res, 'This name is already taken. Please use a different name.');
        }
        return sendConflict(res, `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return sendValidationError(res, messages);
      }

      console.error('[AuthController] Error creating user:', error);
      return sendError(res, 'Error creating user account', 500);
    }

    // Generate token with role and isVIP
    const token = generateToken(user._id.toString(), 'user', false);

    // Log successful registration
    console.log(`[AuthController] User registered successfully: ${user.email}`);

    // Return success response
    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isVIP: user.isVIP,
          vipExpiry: user.vipExpiry,
        },
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('[AuthController] Registration error:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

/**
 * Login user
 * POST /api/auth/login
 * Accepts: email, password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    const errors = [];
    if (!email || !email.trim()) {
      errors.push('Email is required');
    }
    if (!password) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Find user in database (include password field)
    let user;
    try {
      user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    } catch (error) {
      console.error('[AuthController] Error finding user:', error);
      return sendError(res, 'Error accessing database', 500);
    }

    if (!user) {
      console.log(`[AuthController] Login failed - User not found: ${email.toLowerCase().trim()}`);
      return sendUnauthorized(res, 'Invalid email or password');
    }

    // Check if password field exists
    if (!user.password) {
      console.error(`[AuthController] User found but password field is missing: ${email}`);
      return sendError(res, 'Account error. Please contact support.', 500);
    }

    // Compare password with bcrypt
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('[AuthController] Error comparing password:', error);
      return sendError(res, 'Error verifying password', 500);
    }

    if (!isMatch) {
      console.log(`[AuthController] Login failed - Password mismatch: ${email}`);
      return sendUnauthorized(res, 'Invalid email or password');
    }

    // Check if VIP is still active
    const isVIPActive = user.isVIP && user.vipExpiry && new Date(user.vipExpiry) > new Date();
    const effectiveIsVIP = isVIPActive;

    // Generate JWT token with userId, role, and isVIP status
    // This token must be included in Authorization header for subsequent requests
    let token;
    try {
      token = generateToken(user._id.toString(), user.role || 'user', effectiveIsVIP);

      if (!token) {
        console.error('[AuthController] Token generation returned null/undefined');
        return sendError(res, 'Error generating authentication token', 500);
      }
    } catch (error) {
      console.error('[AuthController] Error generating token:', error);
      return sendError(res, 'Error generating authentication token', 500);
    }

    // Log successful login
    console.log(`[AuthController] User logged in successfully: ${user.email}`);

    // Return success response with token
    // The token must be stored on the client and sent in Authorization header as "Bearer <token>"
    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isVIP: effectiveIsVIP,
          vipExpiry: user.vipExpiry,
        },
      },
      'Login successful'
    );
  } catch (error) {
    console.error('[AuthController] Login error:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    let user;
    try {
      user = await User.findById(req.user._id);
    } catch (error) {
      console.error('[AuthController] Error finding user:', error);
      return sendError(res, 'Error accessing database', 500);
    }

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Check if VIP is still active
    const isVIPActive = user.isVIP && user.vipExpiry && new Date(user.vipExpiry) > new Date();

    return sendSuccess(
      res,
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isVIP: isVIPActive,
          vipExpiry: user.vipExpiry,
        },
      },
      'User retrieved successfully'
    );
  } catch (error) {
    console.error('[AuthController] Get me error:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
