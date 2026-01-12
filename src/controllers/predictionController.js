const Prediction = require('../models/Prediction');
const { translate } = require('../utils/translations');
const { paginate } = require('../utils/helpers');
const { generatePredictions } = require('../services/predictionEngine');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
} = require('../utils/responseHandler');

// Create prediction (Admin only)
const createPrediction = async (req, res) => {
  try {
    const { homeTeam, awayTeam, league, matchStart, predictionType, confidence, notes, isVIP, sport } = req.body;

    // Validate required fields
    const errors = [];
    if (!homeTeam || !homeTeam.trim()) {
      errors.push('Home team is required');
    }
    if (!awayTeam || !awayTeam.trim()) {
      errors.push('Away team is required');
    }
    if (!league || !league.trim()) {
      errors.push('League is required');
    }
    if (!matchStart) {
      errors.push('Match start date is required');
    }
    if (!predictionType) {
      errors.push('Prediction type is required');
    }
    if (!req.body.prediction || !req.body.prediction.trim()) {
      errors.push('Prediction text is required');
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Validate predictionType
    const validTypes = ['all', 'banker', 'surprise', 'vip'];
    if (!validTypes.includes(predictionType)) {
      return sendValidationError(res, `Invalid prediction type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate confidence
    const conf = confidence || 50;
    if (conf < 0 || conf > 100) {
      return sendValidationError(res, 'Confidence must be between 0 and 100');
    }

    // Validate match start date
    const matchStartDate = new Date(matchStart);
    if (isNaN(matchStartDate.getTime())) {
      return sendValidationError(res, 'Invalid match start date format');
    }

    // Create prediction
    const prediction = await Prediction.create({
      homeTeam,
      awayTeam,
      league,
      matchStart: new Date(matchStart),
      predictionType,
      confidence: conf,
      notes: notes || '',
      isVIP: isVIP || false,
      sport: sport || 'football',
      createdBy: req.user._id,
      prediction: req.body.prediction.trim(),
    });

    console.log(`[PredictionController] Prediction created: ${prediction._id} by admin: ${req.user._id}`);
    return sendSuccess(res, { prediction }, 'Prediction created successfully', 201);
  } catch (error) {
    console.error('[PredictionController] Error creating prediction:', error);
    return sendError(res, error.message || 'Failed to create prediction', 500);
  }
};

// Get all predictions (Public - non-VIP only)
const getAllPredictions = async (req, res) => {
  try {
    const { sport = 'football', page = 1, limit = 50 } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);
    
    const predictions = await Prediction.find({
      isPublic: true,
      isVIP: false,
      predictionType: { $ne: 'vip' },
      sport,
      matchStart: { $gte: new Date() },
    })
      .sort({ matchStart: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Prediction.countDocuments({
      isPublic: true,
      isVIP: false,
      predictionType: { $ne: 'vip' },
      sport,
      matchStart: { $gte: new Date() },
    });

    return sendSuccess(
      res,
      {
        predictions,
        count: predictions.length,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Predictions retrieved successfully'
    );
  } catch (error) {
    console.error('[PredictionController] Error fetching all predictions:', error);
    return sendError(res, error.message || 'Failed to fetch predictions', 500);
  }
};

// Get Banker predictions (Public)
const getBanker = async (req, res) => {
  try {
    const { sport = 'football', page = 1, limit = 50, includePast = 'false' } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);
    
    // Build query
    const query = {
      isPublic: true,
      predictionType: 'banker',
      isVIP: false,
      sport,
    };

    // Only filter by future matches if includePast is false
    if (includePast === 'false') {
      query.matchStart = { $gte: new Date() };
    }
    
    const predictions = await Prediction.find(query)
      .sort({ matchStart: -1, confidence: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Prediction.countDocuments(query);

    // If no predictions found, check if any exist at all
    if (predictions.length === 0) {
      const totalBanker = await Prediction.countDocuments({
        predictionType: 'banker',
        sport,
      });
      const totalPublic = await Prediction.countDocuments({
        isPublic: true,
        sport,
      });
      
      return res.json({
        success: true,
        data: { predictions: [] },
        count: 0,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
        message: totalBanker === 0 
          ? 'No banker predictions found. Generate predictions using /api/predictions/generate (Admin only)'
          : totalPublic === 0
          ? 'No public predictions found. Check isPublic field.'
          : 'No upcoming banker predictions found. Try adding ?includePast=true to see past predictions.',
        diagnostic: {
          totalBankerPredictions: totalBanker,
          totalPublicPredictions: totalPublic,
          filter: includePast === 'true' ? 'all' : 'upcoming only',
        },
      });
    }

    res.json({
      success: true,
      data: { predictions },
      count: predictions.length,
      pagination: {
        page: parseInt(page) || 1,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[PredictionsController] Error fetching banker predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch banker predictions',
      data: { predictions: [] },
      count: 0,
    });
  }
};

// Get Surprise predictions (Public)
const getSurprise = async (req, res) => {
  try {
    const { sport = 'football', page = 1, limit = 50, includePast = 'false' } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);
    
    // Build query
    const query = {
      isPublic: true,
      predictionType: 'surprise',
      isVIP: false,
      sport,
    };

    // Only filter by future matches if includePast is false
    if (includePast === 'false') {
      query.matchStart = { $gte: new Date() };
    }
    
    const predictions = await Prediction.find(query)
      .sort({ matchStart: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Prediction.countDocuments(query);

    // If no predictions found, check if any exist at all
    if (predictions.length === 0) {
      const totalSurprise = await Prediction.countDocuments({
        predictionType: 'surprise',
        sport,
      });
      const totalPublic = await Prediction.countDocuments({
        isPublic: true,
        sport,
      });
      
      return res.json({
        success: true,
        data: { predictions: [] },
        count: 0,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
        message: totalSurprise === 0 
          ? 'No surprise predictions found. Generate predictions using /api/predictions/generate (Admin only)'
          : totalPublic === 0
          ? 'No public predictions found. Check isPublic field.'
          : 'No upcoming surprise predictions found. Try adding ?includePast=true to see past predictions.',
        diagnostic: {
          totalSurprisePredictions: totalSurprise,
          totalPublicPredictions: totalPublic,
          filter: includePast === 'true' ? 'all' : 'upcoming only',
        },
      });
    }

    res.json({
      success: true,
      data: { predictions },
      count: predictions.length,
      pagination: {
        page: parseInt(page) || 1,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[PredictionsController] Error fetching surprise predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch surprise predictions',
      data: { predictions: [] },
      count: 0,
    });
  }
};

// Get VIP predictions (VIP only)
const getVIP = async (req, res) => {
  try {
    const { sport = 'football', page = 1, limit = 50 } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);
    
    // Check if user is VIP - check token for isVIP status
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Decode token to check VIP status
    const { verifyToken } = require('../config/jwt');
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Check VIP status - verify with Membership model
    const Membership = require('../models/Membership');
    const membership = await Membership.findOne({ userId: decoded.userId });
    
    // Check if VIP is active
    let isVIPActive = false;
    if (membership && membership.isActive()) {
      isVIPActive = true;
    } else {
      // Fallback to User model for backward compatibility
      const User = require('../models/User');
      const user = await User.findById(decoded.userId);
      if (user && user.isVIPActive && user.isVIPActive()) {
        isVIPActive = true;
      }
    }
    
    if (!isVIPActive) {
      return res.status(403).json({
        success: false,
        message: 'VIP membership required',
      });
    }
    
    const { includePast = 'false' } = req.query;
    
    // Build query
    const query = {
      isPublic: true,
      $or: [
        { isVIP: true },
        { predictionType: 'vip' }
      ],
      sport,
    };

    // Only filter by future matches if includePast is false
    if (includePast === 'false') {
      query.matchStart = { $gte: new Date() };
    }
    
    const predictions = await Prediction.find(query)
      .sort({ matchStart: -1, confidence: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Prediction.countDocuments(query);

    // If no predictions found, check if any exist at all
    if (predictions.length === 0) {
      const totalVIP = await Prediction.countDocuments({
        $or: [
          { isVIP: true },
          { predictionType: 'vip' }
        ],
        sport,
      });
      const totalPublic = await Prediction.countDocuments({
        isPublic: true,
        sport,
      });
      
      return res.json({
        success: true,
        data: { predictions: [] },
        count: 0,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
        message: totalVIP === 0 
          ? 'No VIP predictions found. Generate predictions using /api/predictions/generate (Admin only)'
          : totalPublic === 0
          ? 'No public predictions found. Check isPublic field.'
          : 'No upcoming VIP predictions found. Try adding ?includePast=true to see past predictions.',
        diagnostic: {
          totalVIPPredictions: totalVIP,
          totalPublicPredictions: totalPublic,
          filter: includePast === 'true' ? 'all' : 'upcoming only',
        },
      });
    }

    res.json({
      success: true,
      data: { predictions },
      count: predictions.length,
      pagination: {
        page: parseInt(page) || 1,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[PredictionsController] Error fetching VIP predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch VIP predictions',
      data: { predictions: [] },
      count: 0,
    });
  }
};

// Get all predictions (legacy - for pagination)
const getPredictions = async (req, res) => {
  try {
    const { page, limit, predictionType, status, sport } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    const filter = { isPublic: true, isVIP: false };
    if (predictionType) filter.predictionType = predictionType;
    if (status) filter.status = status;
    if (sport) filter.sport = sport;

    const predictions = await Prediction.find(filter)
      .populate('createdBy', 'username')
      .skip(skip)
      .limit(limitNum)
      .sort({ matchStart: 1, createdAt: -1 });

    const total = await Prediction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch predictions',
    });
  }
};

// Get single prediction
const getPrediction = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Prediction ID is required',
      });
    }
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID format',
      });
    }
    
    const prediction = await Prediction.findById(id)
      .populate('createdBy', 'name username');

    if (!prediction) {
      return sendNotFound(res, 'Prediction not found');
    }

    // Check VIP access
    if (prediction.isVIP || prediction.predictionType === 'vip') {
      if (!req.user) {
        return sendUnauthorized(res, 'Authentication required for VIP predictions');
      }
      
      // Check Membership model first
      const Membership = require('../models/Membership');
      const membership = await Membership.findOne({ userId: req.user._id });
      
      let isVIPActive = false;
      if (membership && membership.isActive()) {
        isVIPActive = true;
      } else if (req.user && req.user.isVIPActive && req.user.isVIPActive()) {
        // Fallback to User model
        isVIPActive = true;
      }
      
      if (!isVIPActive) {
        return sendForbidden(res, 'VIP membership required to view this prediction');
      }
    }

    // Increment views
    prediction.views = (prediction.views || 0) + 1;
    await prediction.save();

    return sendSuccess(res, { prediction }, 'Prediction retrieved successfully');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch prediction',
    });
  }
};

// Get user's predictions (if needed for admin)
const getMyPredictions = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    const predictions = await Prediction.find({ createdBy: req.user._id })
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Prediction.countDocuments({ createdBy: req.user._id });

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch predictions',
    });
  }
};

// Update prediction (Admin only)
const updatePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    // Only admin can update
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    // Update fields
    const updateData = {};
    if (req.body.homeTeam) updateData.homeTeam = req.body.homeTeam;
    if (req.body.awayTeam) updateData.awayTeam = req.body.awayTeam;
    if (req.body.league) updateData.league = req.body.league;
    if (req.body.matchStart) updateData.matchStart = new Date(req.body.matchStart);
    if (req.body.predictionType) updateData.predictionType = req.body.predictionType;
    if (req.body.confidence !== undefined) updateData.confidence = req.body.confidence;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.isVIP !== undefined) updateData.isVIP = req.body.isVIP;
    if (req.body.prediction) updateData.prediction = req.body.prediction;
    if (req.body.sport) updateData.sport = req.body.sport;

    const updated = await Prediction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Prediction updated successfully',
      data: { prediction: updated },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update prediction',
    });
  }
};

// Delete prediction (Admin only)
const deletePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    // Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    await Prediction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Prediction deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete prediction',
    });
  }
};

// Generate predictions (Admin only)
const generatePredictionsEndpoint = async (req, res) => {
  try {
    const { date } = req.body;

    // Validate date if provided
    if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
        });
      }
    }

    console.log('[PredictionsController] Starting prediction generation...');
    const result = await generatePredictions(date);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to generate predictions',
        data: result,
      });
    }

    res.json({
      success: true,
      message: `Generated ${result.generated} predictions`,
      data: result,
    });
  } catch (error) {
    console.error('[PredictionsController] Error generating predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate predictions',
    });
  }
};

module.exports = {
  createPrediction,
  getAllPredictions,
  getBanker,
  getSurprise,
  getVIP,
  getPredictions,
  getPrediction,
  getMyPredictions,
  updatePrediction,
  deletePrediction,
  generatePredictionsEndpoint,
};
