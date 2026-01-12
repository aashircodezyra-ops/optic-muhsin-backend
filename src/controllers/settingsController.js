const Settings = require('../models/Settings');

/**
 * Get Public Settings
 * GET /api/settings
 */
const getPublicSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();

        // Return all safe public info (exclude sensitive data like SMTP passwords if added later)
        const publicSettings = {
            // General
            appName: settings.appName,
            appLogo: settings.appLogo,
            supportEmail: settings.supportEmail,
            tagline: settings.tagline,
            contactPhone: settings.contactPhone,
            footerText: settings.footerText,
            copyrightText: settings.copyrightText,

            // Feature Toggles
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            registrationEnabled: settings.registrationEnabled,
            commentsEnabled: settings.commentsEnabled,
            vipEnabled: settings.vipEnabled,
            liveScoresEnabled: settings.liveScoresEnabled,

            // Social Media
            socialMedia: settings.socialMedia || {},

            // SEO (safe to expose)
            seo: settings.seo || {},

            languages: settings.languages,
            vipPricing: settings.vipPricing || {},
        };

        res.json({
            success: true,
            data: { settings: publicSettings },
        });
    } catch (error) {
        console.error('Error fetching public settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings',
            data: {
                settings: {
                    appName: 'OptikGoal',
                    tagline: 'Your Ultimate Sports Prediction Platform',
                    vipPricing: {},
                    socialMedia: {},
                    seo: {}
                }
            }
        });
    }
};

module.exports = {
    getPublicSettings,
};
