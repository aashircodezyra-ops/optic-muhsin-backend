const User = require('../models/User');
const Prediction = require('../models/Prediction');
const Comment = require('../models/Comment');

/**
 * Get Reports & Analytics
 * GET /api/admin/reports
 */
const getReports = async (req, res) => {
  try {
    // Basic app stats
    let totalUsers = 0;
    let vipUsers = 0;
    let totalPredictions = 0;
    let totalComments = 0;
    let activeUsers = 0;

    try {
      totalUsers = await User.countDocuments();
      vipUsers = await User.countDocuments({ isVIP: true });
      totalPredictions = await Prediction.countDocuments();
      totalComments = await Comment.countDocuments();
      
      // Active users (users who created predictions in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      activeUsers = await User.countDocuments({
        lastPredictionDate: { $gte: thirtyDaysAgo },
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }

    // Prediction accuracy (sample calculation)
    let predictionStats = {
      total: 0,
      won: 0,
      lost: 0,
      pending: 0,
      accuracy: 0,
    };

    try {
      const predictions = await Prediction.find().lean();
      predictionStats.total = predictions.length;
      predictionStats.won = predictions.filter(p => p.status === 'won').length;
      predictionStats.lost = predictions.filter(p => p.status === 'lost').length;
      predictionStats.pending = predictions.filter(p => p.status === 'pending').length;
      
      const resolved = predictionStats.won + predictionStats.lost;
      predictionStats.accuracy = resolved > 0 
        ? Math.round((predictionStats.won / resolved) * 100) 
        : 0;
    } catch (error) {
      console.error('Error calculating prediction stats:', error);
    }

    // User growth (last 7 days)
    let userGrowth = [];
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await User.countDocuments({
          createdAt: {
            $gte: date,
            $lt: nextDate,
          },
        });
        
        userGrowth.push({
          date: date.toISOString().split('T')[0],
          count,
        });
      }
    } catch (error) {
      console.error('Error calculating user growth:', error);
      userGrowth = Array(7).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          count: 0,
        };
      });
    }

    // Chart-friendly data
    const chartData = {
      userGrowth,
      predictionAccuracy: predictionStats.accuracy,
      statusDistribution: {
        won: predictionStats.won,
        lost: predictionStats.lost,
        pending: predictionStats.pending,
      },
    };

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          vipUsers,
          totalPredictions,
          totalComments,
          activeUsers,
        },
        predictions: predictionStats,
        charts: chartData,
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    // Return placeholder data on error
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: 0,
          vipUsers: 0,
          totalPredictions: 0,
          totalComments: 0,
          activeUsers: 0,
        },
        predictions: {
          total: 0,
          won: 0,
          lost: 0,
          pending: 0,
          accuracy: 0,
        },
        charts: {
          userGrowth: [],
          predictionAccuracy: 0,
          statusDistribution: {
            won: 0,
            lost: 0,
            pending: 0,
          },
        },
      },
    });
  }
};

module.exports = {
  getReports,
};

