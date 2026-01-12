const AdConfiguration = require('../models/AdConfiguration');
const { translate } = require('../utils/translations');

// Configure ads (Create or Update)
const configureAds = async (req, res) => {
  try {
    const {
      provider,
      providerName,
      adType,
      adUnitId,
      position,
      size,
      sizeLabel,
      settings,
      displayRules,
      isActive,
    } = req.body;

    // Validate required fields
    if (!provider || !providerName || !adUnitId || !position) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: provider, providerName, adUnitId, position',
      });
    }

    // Validate provider
    const validProviders = ['google-adsense', 'taboola', 'ezoic', 'media-net'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
      });
    }

    // Validate provider name matches provider
    const providerNameMap = {
      'google-adsense': 'Google AdSense',
      'taboola': 'Taboola',
      'ezoic': 'Ezoic',
      'media-net': 'Media.net',
    };

    if (providerNameMap[provider] !== providerName) {
      return res.status(400).json({
        success: false,
        message: `Provider name must match provider. Expected: ${providerNameMap[provider]}`,
      });
    }

    // Validate size
    if (!size || !size.width || !size.height) {
      return res.status(400).json({
        success: false,
        message: 'Size must have width and height',
      });
    }

    // Provider-specific validation
    if (provider === 'google-adsense') {
      if (!adUnitId.startsWith('ca-')) {
        return res.status(400).json({
          success: false,
          message: 'Google AdSense ad unit ID should start with "ca-"',
        });
      }
    }

    if (provider === 'taboola' && settings) {
      if (!settings.publisherId) {
        return res.status(400).json({
          success: false,
          message: 'Taboola requires publisherId in settings',
        });
      }
    }

    if (provider === 'media-net' && settings) {
      if (!settings.customerId) {
        return res.status(400).json({
          success: false,
          message: 'Media.net requires customerId in settings',
        });
      }
    }

    // Check if configuration already exists for this provider and position
    const existingConfig = await AdConfiguration.findOne({
      provider,
      position,
    });

    let adConfig;

    if (existingConfig) {
      // Update existing configuration
      existingConfig.providerName = providerName;
      existingConfig.adType = adType || existingConfig.adType;
      existingConfig.adUnitId = adUnitId;
      existingConfig.size = size;
      existingConfig.sizeLabel = sizeLabel || existingConfig.sizeLabel;
      existingConfig.settings = { ...existingConfig.settings, ...settings };
      existingConfig.displayRules = { ...existingConfig.displayRules, ...displayRules };
      existingConfig.isActive = isActive !== undefined ? isActive : existingConfig.isActive;
      existingConfig.lastUpdatedBy = req.user._id;

      await existingConfig.save();
      adConfig = existingConfig;
    } else {
      // Create new configuration
      adConfig = await AdConfiguration.create({
        provider,
        providerName,
        adType: adType || 'banner',
        adUnitId,
        position,
        size,
        sizeLabel: sizeLabel || 'responsive',
        settings: settings || {},
        displayRules: displayRules || {
          showOnPages: ['all'],
          hideForVIP: false,
          hideForAdBlockers: true,
          maxPerPage: 3,
        },
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id,
      });
    }

    res.json({
      success: true,
      message: 'Ad configuration saved successfully',
      data: {
        configuration: adConfig.getDisplayConfig(),
      },
    });
  } catch (error) {
    console.error('Error configuring ads:', error);
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get active ad configuration
const getAdConfiguration = async (req, res) => {
  try {
    const { position, provider, activeOnly = 'true' } = req.query;

    let query = {};

    // Filter by active status
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    // Filter by position if provided
    if (position) {
      query.position = position;
    }

    // Filter by provider if provided
    if (provider) {
      query.provider = provider;
    }

    const configurations = await AdConfiguration.find(query)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ position: 1, createdAt: -1 });

    // Group by position for easier frontend consumption
    const groupedByPosition = configurations.reduce((acc, config) => {
      if (!acc[config.position]) {
        acc[config.position] = [];
      }
      acc[config.position].push(config.getDisplayConfig());
      return acc;
    }, {});

    // Group by provider
    const groupedByProvider = configurations.reduce((acc, config) => {
      if (!acc[config.provider]) {
        acc[config.provider] = [];
      }
      acc[config.provider].push(config.getDisplayConfig());
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        configurations: configurations.map(config => ({
          id: config._id,
          ...config.getDisplayConfig(),
          impressions: config.impressions,
          clicks: config.clicks,
          revenue: config.revenue,
          isActive: config.isActive,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        })),
        groupedByPosition,
        groupedByProvider,
        total: configurations.length,
        active: configurations.filter(c => c.isActive).length,
      },
    });
  } catch (error) {
    console.error('Error fetching ad configuration:', error);
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get configuration for specific position (for frontend)
const getConfigurationByPosition = async (req, res) => {
  try {
    const { position } = req.params;

    const configurations = await AdConfiguration.getActiveByPosition(position);

    if (configurations.length === 0) {
      return res.json({
        success: true,
        data: {
          position,
          configurations: [],
          message: 'No active ads configured for this position',
        },
      });
    }

    res.json({
      success: true,
      data: {
        position,
        configurations: configurations.map(config => config.getDisplayConfig()),
      },
    });
  } catch (error) {
    console.error('Error fetching configuration by position:', error);
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Delete ad configuration
const deleteAdConfiguration = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await AdConfiguration.findByIdAndDelete(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Ad configuration not found',
      });
    }

    res.json({
      success: true,
      message: 'Ad configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting ad configuration:', error);
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Toggle active status
const toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await AdConfiguration.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Ad configuration not found',
      });
    }

    config.isActive = !config.isActive;
    config.lastUpdatedBy = req.user._id;
    await config.save();

    res.json({
      success: true,
      message: `Ad configuration ${config.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        configuration: config.getDisplayConfig(),
        isActive: config.isActive,
      },
    });
  } catch (error) {
    console.error('Error toggling ad configuration status:', error);
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Track ad impression
const trackImpression = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await AdConfiguration.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Ad configuration not found',
      });
    }

    config.impressions += 1;
    await config.save();

    res.json({
      success: true,
      data: {
        impressions: config.impressions,
      },
    });
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Track ad click
const trackClick = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await AdConfiguration.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Ad configuration not found',
      });
    }

    config.clicks += 1;
    await config.save();

    res.json({
      success: true,
      data: {
        clicks: config.clicks,
      },
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

module.exports = {
  configureAds,
  getAdConfiguration,
  getConfigurationByPosition,
  deleteAdConfiguration,
  toggleActiveStatus,
  trackImpression,
  trackClick,
};

