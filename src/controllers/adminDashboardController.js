const User = require('../models/User');
const Prediction = require('../models/Prediction');
const Comment = require('../models/Comment');

/**
 * Get Dashboard Stats
 * GET /api/admin/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get all counts - use try/catch for each to prevent crashes
    let totalUsers = 0;
    let vipUsers = 0;
    let totalPredictions = 0;
    let totalComments = 0;
    let totalReports = 0;

    try {
      totalUsers = await User.countDocuments();
    } catch (error) {
      console.error('Error counting users:', error);
    }

    try {
      vipUsers = await User.countDocuments({ isVIP: true });
    } catch (error) {
      console.error('Error counting VIP users:', error);
    }

    try {
      totalPredictions = await Prediction.countDocuments();
    } catch (error) {
      console.error('Error counting predictions:', error);
    }

    try {
      totalComments = await Comment.countDocuments();
    } catch (error) {
      console.error('Error counting comments:', error);
    }

    // Reports count (if you have a Report model, otherwise return 0)
    totalReports = 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        vipUsers,
        totalPredictions,
        totalComments,
        totalReports,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return zeroes on error so UI never breaks
    res.json({
      success: true,
      data: {
        totalUsers: 0,
        vipUsers: 0,
        totalPredictions: 0,
        totalComments: 0,
        totalReports: 0,
      },
    });
  }
};

/**
 * Get Recent Activity
 * GET /api/admin/activity
 * Returns: { recentUsers: [...], recentPredictions: [...] }
 */
const getRecentActivity = async (req, res) => {
  try {
    let recentUsers = [];
    let recentPredictions = [];

    // Get latest registered users (limit 5)
    try {
      const users = await User.find()
        .select('username email role isVIP createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      recentUsers = users.map(user => ({
        id: user._id.toString(),
        username: user.username || 'Unknown',
        email: user.email || '',
        role: user.role || 'normal',
        isVIP: user.isVIP || false,
        createdAt: user.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching recent users:', error);
      recentUsers = [];
    }

    // Get latest predictions (limit 5)
    try {
      const predictions = await Prediction.find()
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      recentPredictions = predictions.map(prediction => ({
        id: prediction._id.toString(),
        homeTeam: prediction.homeTeam || '',
        awayTeam: prediction.awayTeam || '',
        league: prediction.league || '',
        sport: prediction.sport || 'football',
        status: prediction.status || 'pending',
        createdBy: prediction.createdBy 
          ? {
              username: prediction.createdBy.username || '',
              email: prediction.createdBy.email || '',
            }
          : null,
        createdAt: prediction.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching recent predictions:', error);
      recentPredictions = [];
    }

    res.json({
      success: true,
      data: {
        recentUsers,
        recentPredictions,
      },
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    // Return safe empty structures on error
    res.json({
      success: true,
      data: {
        recentUsers: [],
        recentPredictions: [],
      },
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
};

