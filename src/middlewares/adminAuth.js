const { verifyToken } = require('../config/jwt');

/**
 * Verify Admin Authentication Middleware
 * Checks JWT token and ensures role === "admin"
 * Returns 403 (Forbidden) if not admin
 */
const verifyAdminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Check if token has admin role - MUST be exactly "admin"
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    // Attach admin info to request
    req.admin = {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      role: 'admin',
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Token verification failed',
    });
  }
};

module.exports = {
  verifyAdminAuth,
};

