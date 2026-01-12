/**
 * Authentication Middlewares
 * 
 * Provides authentication and authorization middleware functions for Express routes.
 * Handles JWT token verification, user authentication, and role-based access control.
 * 
 * @module middlewares/auth
 */

const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

/**
 * Authenticate user (for both regular users and admins)
 * 
 * Verifies JWT token from Authorization header and attaches user to request object.
 * Works for both regular users and admin users.
 * 
 * @middleware authenticate
 * @param {Object} req - Express request object
 * @param {string} req.header.Authorization - Bearer token in format "Bearer <token>"
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @returns {void} Attaches user object to req.user on success
 * @throws {401} If token is missing, invalid, or expired
 * @throws {401} If user not found in database
 * 
 * @example
 * router.get('/protected', authenticate, (req, res) => {
 *   // req.user is available here
 * });
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    let user;
    try {
      user = await User.findById(decoded.userId).select('-password');
    } catch (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({
        success: false,
        message: 'Error accessing database',
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Token is not valid',
    });
  }
};

/**
 * Verify user authentication (for regular users only, not admin)
 * Use this for user-protected routes
 */
const verifyUserAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Check if token has admin role - admins should use admin routes
    if (decoded.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is for regular users only',
      });
    }

    let user;
    try {
      user = await User.findById(decoded.userId).select('-password');
    } catch (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({
        success: false,
        message: 'Error accessing database',
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Ensure user role is 'user' (not admin)
    if (user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('User auth verification error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Token verification failed',
    });
  }
};

const requireVIP = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check Membership model first
    const Membership = require('../models/Membership');
    let membership = await Membership.findOne({ userId: req.user._id });
    
    // If membership exists, check if it's active
    if (membership) {
      if (!membership.isActive()) {
        return res.status(403).json({
          success: false,
          message: 'VIP membership required. Your membership has expired.',
        });
      }
      // VIP is active, allow access
      req.membership = membership;
      return next();
    }

    // Fallback to User model for backward compatibility
    if (!req.user.isVIPActive()) {
      return res.status(403).json({
        success: false,
        message: 'VIP membership required',
      });
    }

    next();
  } catch (error) {
    console.error('VIP middleware error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

module.exports = {
  authenticate,
  verifyUserAuth,
  requireVIP,
  requireAdmin,
};

