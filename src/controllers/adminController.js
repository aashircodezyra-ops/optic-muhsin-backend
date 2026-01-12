const { generateToken } = require('../config/jwt');

/**
 * Admin Login
 * Authenticates admin using environment variables only
 * POST /api/admin/login
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Get admin credentials from environment variables (ALWAYS from process.env)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    // Check if admin credentials are configured
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('Admin credentials not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Admin authentication is not configured',
      });
    }

    // Compare credentials (case-sensitive, exact match)
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    // Generate JWT token with role: "admin" (expires in 7d as per JWT_EXPIRE)
    const token = generateToken('admin', 'admin');

    res.json({
      success: true,
      token,
      message: 'Admin login successful',
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Get admin info
 * GET /api/admin/me
 */
const getAdminInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          email: process.env.ADMIN_EMAIL || 'admin@example.com',
          role: 'admin',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

module.exports = {
  adminLogin,
  getAdminInfo,
};

