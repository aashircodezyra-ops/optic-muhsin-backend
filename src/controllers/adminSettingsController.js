const mongoose = require('mongoose');
const Settings = require('../models/Settings');

/**
 * Get Settings
 * GET /api/admin/settings
 */
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return defaults on error
    res.json({
      success: true,
      data: {
        settings: {
          appName: 'OptikGoal',
          appLogo: '/assets/logo.png',
          supportEmail: 'support@optikgoal.com',
          languages: ['en', 'tr', 'ar'],
          maintenanceMode: false,
          maintenanceMessage: '',
        },
      },
    });
  }
};

/**
 * Update Settings
 * POST /api/admin/settings
 */
const updateSettings = async (req, res) => {
  try {
    const {
      // General Settings
      appName,
      appLogo,
      supportEmail,
      tagline,
      contactPhone,
      footerText,
      copyrightText,

      // Feature Toggles
      maintenanceMode,
      maintenanceMessage,
      registrationEnabled,
      commentsEnabled,
      vipEnabled,
      liveScoresEnabled,

      // Social Media
      socialMedia,

      // SEO
      seo,

      languages,
      vipPricing
    } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      // General Settings
      if (appName !== undefined) settings.appName = appName;
      if (appLogo !== undefined) settings.appLogo = appLogo;
      if (supportEmail !== undefined) settings.supportEmail = supportEmail;
      if (tagline !== undefined) settings.tagline = tagline;
      if (contactPhone !== undefined) settings.contactPhone = contactPhone;
      if (footerText !== undefined) settings.footerText = footerText;
      if (copyrightText !== undefined) settings.copyrightText = copyrightText;

      // Feature Toggles
      if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
      if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
      if (registrationEnabled !== undefined) settings.registrationEnabled = registrationEnabled;
      if (commentsEnabled !== undefined) settings.commentsEnabled = commentsEnabled;
      if (vipEnabled !== undefined) settings.vipEnabled = vipEnabled;
      if (liveScoresEnabled !== undefined) settings.liveScoresEnabled = liveScoresEnabled;

      // Social Media
      if (socialMedia !== undefined) {
        settings.socialMedia = { ...settings.socialMedia, ...socialMedia };
        settings.markModified('socialMedia');
      }

      // SEO
      if (seo !== undefined) {
        settings.seo = { ...settings.seo, ...seo };
        settings.markModified('seo');
      }

      if (languages !== undefined) settings.languages = languages;

      // VIP Pricing
      if (vipPricing !== undefined) {
        settings.vipPricing = vipPricing;
        settings.markModified('vipPricing');
      }

      await settings.save();
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings },
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update settings',
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
