const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { translate } = require('../utils/translations');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendConflict,
} = require('../utils/responseHandler');

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Check VIP status
    const isVIPActive = user.isVIP && user.vipExpiry && new Date(user.vipExpiry) > new Date();

    return sendSuccess(
      res,
      {
        user: {
          ...user.toObject(),
          isVIP: isVIPActive,
        },
      },
      'Profile retrieved successfully'
    );
  } catch (error) {
    console.error('[UserController] Error fetching profile:', error);
    return sendError(res, error.message || 'Failed to fetch profile', 500);
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, profilePhoto, notificationSettings, preferences, favTeams } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Update name if provided (note: User model uses 'name', not 'username')
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return sendValidationError(res, 'Name cannot be empty');
      }
      
      if (name.trim().length < 2 || name.trim().length > 50) {
        return sendValidationError(res, 'Name must be between 2 and 50 characters');
      }
      
      // Check if name is already taken by another user (if you want unique names)
      // For now, we'll allow duplicate names
      user.name = name.trim();
    }

    // Update profile photo if provided
    if (profilePhoto !== undefined) {
      user.profilePhoto = profilePhoto;
    }

    // Initialize notificationSettings if it doesn't exist
    if (!user.notificationSettings) {
      user.notificationSettings = {
        liveAlerts: true,
        goals: true,
        bulletin: true,
        predictions: false,
        favTeams: []
      };
    }

    // Update notification settings if provided
    if (notificationSettings !== undefined) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...notificationSettings,
      };
    }

    // Initialize preferences if it doesn't exist
    if (!user.preferences) {
      user.preferences = {
        theme: "light",
        language: "english"
      };
    }

    // Update preferences if provided
    if (preferences !== undefined) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    // Update favorite teams if provided
    if (favTeams !== undefined) {
      if (Array.isArray(favTeams)) {
        if (!user.notificationSettings) {
          user.notificationSettings = {
            liveAlerts: true,
            goals: true,
            bulletin: true,
            predictions: false,
            favTeams: []
          };
        }
        user.notificationSettings.favTeams = favTeams;
      }
    }

    await user.save();
    console.log(`[UserController] Profile updated for user: ${user._id}`);

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, { user: userObj }, 'Profile updated successfully');
  } catch (error) {
    console.error('[UserController] Error updating profile:', error);
    return sendError(res, error.message || 'Failed to update profile', 500);
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate required fields
    const errors = [];
    if (!oldPassword) {
      errors.push('Current password is required');
    }
    if (!newPassword) {
      errors.push('New password is required');
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return sendValidationError(res, 'New password must be at least 6 characters');
    }

    // Check if new password is same as old
    if (oldPassword === newPassword) {
      return sendValidationError(res, 'New password must be different from current password');
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      console.log(`[UserController] Password change failed - incorrect current password for user: ${user._id}`);
      return sendError(res, 'Current password is incorrect', 400);
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    console.log(`[UserController] Password changed successfully for user: ${user._id}`);
    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('[UserController] Error changing password:', error);
    return sendError(res, error.message || 'Failed to change password', 500);
  }
};

// Delete user account
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return sendError(res, 'Cannot delete admin accounts', 403);
    }

    // Delete user from database
    await User.findByIdAndDelete(req.user._id);
    console.log(`[UserController] Account deleted: ${user._id}`);

    return sendSuccess(res, null, 'Account deleted successfully');
  } catch (error) {
    console.error('[UserController] Error deleting account:', error);
    return sendError(res, error.message || 'Failed to delete account', 500);
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { users },
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users',
    });
  }
};

// Get user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getAllUsers,
  getUserById,
};
