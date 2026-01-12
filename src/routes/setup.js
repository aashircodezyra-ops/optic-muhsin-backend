/**
 * TEMPORARY SETUP ROUTES
 * 
 * ⚠️  WARNING: These routes are for development/testing only!
 * 
 * SECURITY INSTRUCTIONS:
 * 1. DELETE this file after creating admin account
 * 2. Remove the route from server.js
 * 3. Never deploy this to production
 * 4. Use environment variables for secrets
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * POST /api/setup/create-admin
 * 
 * Creates an admin user (ONE-TIME USE ONLY)
 * 
 * Headers:
 *   X-Setup-Secret: <ADMIN_SETUP_SECRET from .env>
 * 
 * Body:
 *   {
 *     "email": "admin@example.com",
 *     "password": "SecurePassword123!",
 *     "username": "admin" (optional)
 *   }
 */
router.post('/create-admin', async (req, res) => {
  try {
    // Only allow in development or with secret key
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    const providedSecret = req.headers['x-setup-secret'];
    
    if (process.env.NODE_ENV === 'production' && (!setupSecret || providedSecret !== setupSecret)) {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is disabled in production or requires a valid secret',
      });
    }

    const { email, password, username } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email },
        { username: username || 'admin' },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin user already exists',
        existingAdmin: {
          email: existingAdmin.email,
          username: existingAdmin.username,
        },
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const admin = await User.create({
      username: username || 'admin',
      email,
      password: hashedPassword,
      role: 'admin',
      isVIP: false,
      vipPlan: 'none',
      vipExpiryDate: null,
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      warning: '⚠️  DELETE THIS ROUTE AFTER USE! Remove /api/setup route from server.js',
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create admin user',
    });
  }
});

/**
 * GET /api/setup/fix-vipplan
 * 
 * Fixes existing users with null vipPlan (ONE-TIME USE ONLY)
 * 
 * Headers (optional in dev, required in production):
 *   X-Setup-Secret: <ADMIN_SETUP_SECRET from .env>
 */
router.get('/fix-vipplan', async (req, res) => {
  try {
    // Only allow in development or with secret key
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    const providedSecret = req.headers['x-setup-secret'];
    
    if (process.env.NODE_ENV === 'production' && (!setupSecret || providedSecret !== setupSecret)) {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is disabled in production or requires a valid secret',
      });
    }

    // Find and update users with null vipPlan
    const result = await User.updateMany(
      {
        $or: [
          { vipPlan: null },
          { vipPlan: { $exists: false } }
        ]
      },
      {
        $set: {
          vipPlan: 'none',
          isVIP: false
        }
      }
    );

    res.json({
      success: true,
      message: `Fixed ${result.modifiedCount} user(s)`,
      updated: result.modifiedCount,
      warning: '⚠️  DELETE THIS ROUTE AFTER USE! Remove /api/setup route from server.js',
    });
  } catch (error) {
    console.error('Fix vipPlan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fix vipPlan',
    });
  }
});

module.exports = router;

