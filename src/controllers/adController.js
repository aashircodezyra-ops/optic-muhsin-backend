const Ad = require('../models/Ad');
const { translate } = require('../utils/translations');

// Get all ads
const getAds = async (req, res) => {
  try {
    const ads = await Ad.find({ isActive: true }).sort({ slot: 1 });

    res.json({
      success: true,
      data: { ads },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get ad by slot
const getAdBySlot = async (req, res) => {
  try {
    const { slot } = req.params;
    const ad = await Ad.findOne({ slot, isActive: true });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found for this slot',
      });
    }

    // Increment display count
    ad.displayCount += 1;
    await ad.save();

    res.json({
      success: true,
      data: { ad },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Create ad (Admin only)
const createAd = async (req, res) => {
  try {
    const ad = await Ad.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: { ad },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ad slot already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Update ad (Admin only)
const updateAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: { ad },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Delete ad (Admin only)
const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    res.json({
      success: true,
      message: 'Ad deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Track ad click
const trackClick = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    ad.clickCount += 1;
    await ad.save();

    res.json({
      success: true,
      data: { ad },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

module.exports = {
  getAds,
  getAdBySlot,
  createAd,
  updateAd,
  deleteAd,
  trackClick,
};

