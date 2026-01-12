const Prediction = require('../models/Prediction');

/**
 * Get All Predictions
 * GET /api/admin/predictions
 */
const getAllPredictions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sport, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (sport) filter.sport = sport;
    if (type) filter.predictionType = type;

    const predictions = await Prediction.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Prediction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch predictions',
      data: {
        predictions: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      },
    });
  }
};

/**
 * Create Prediction
 * POST /api/admin/predictions
 */
const createPrediction = async (req, res) => {
  try {
    const {
      predictionType,
      sport,
      league,
      homeTeam,
      awayTeam,
      matchStart,
      prediction,
      confidence,
      notes,
      isVIP,
    } = req.body;

    // Validate required fields
    if (!league || !homeTeam || !awayTeam || !matchStart || !prediction) {
      return res.status(400).json({
        success: false,
        message: 'League, teams, match start, and prediction are required',
      });
    }

    const newPrediction = await Prediction.create({
      predictionType: predictionType || 'all',
      sport: sport || 'football',
      league,
      homeTeam,
      awayTeam,
      matchStart: new Date(matchStart),
      prediction,
      confidence: confidence || 50,
      notes: notes || '',
      isVIP: isVIP || false,
      status: 'pending',
    });

    const predictionObj = await Prediction.findById(newPrediction._id)
      .populate('createdBy', 'username email')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Prediction created successfully',
      data: { prediction: predictionObj },
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create prediction',
    });
  }
};

/**
 * Update Prediction
 * PUT /api/admin/predictions/:id
 */
const updatePrediction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const prediction = await Prediction.findById(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    // Update fields
    if (updateData.league !== undefined) prediction.league = updateData.league;
    if (updateData.homeTeam !== undefined) prediction.homeTeam = updateData.homeTeam;
    if (updateData.awayTeam !== undefined) prediction.awayTeam = updateData.awayTeam;
    if (updateData.matchStart !== undefined) prediction.matchStart = new Date(updateData.matchStart);
    if (updateData.prediction !== undefined) prediction.prediction = updateData.prediction;
    if (updateData.confidence !== undefined) prediction.confidence = updateData.confidence;
    if (updateData.notes !== undefined) prediction.notes = updateData.notes;
    if (updateData.status !== undefined) prediction.status = updateData.status;
    if (updateData.isVIP !== undefined) prediction.isVIP = updateData.isVIP;
    if (updateData.sport !== undefined) prediction.sport = updateData.sport;
    if (updateData.predictionType !== undefined) prediction.predictionType = updateData.predictionType;

    if (updateData.result) {
      if (updateData.result.homeScore !== undefined) prediction.result.homeScore = updateData.result.homeScore;
      if (updateData.result.awayScore !== undefined) prediction.result.awayScore = updateData.result.awayScore;
    }

    await prediction.save();

    const predictionObj = await Prediction.findById(id)
      .populate('createdBy', 'username email')
      .lean();

    res.json({
      success: true,
      message: 'Prediction updated successfully',
      data: { prediction: predictionObj },
    });
  } catch (error) {
    console.error('Error updating prediction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update prediction',
    });
  }
};

/**
 * Delete Prediction
 * DELETE /api/admin/predictions/:id
 */
const deletePrediction = async (req, res) => {
  try {
    const { id } = req.params;

    const prediction = await Prediction.findById(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    await Prediction.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Prediction deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete prediction',
    });
  }
};

module.exports = {
  getAllPredictions,
  createPrediction,
  updatePrediction,
  deletePrediction,
};

