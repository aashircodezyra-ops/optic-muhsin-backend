const mongoose = require('mongoose');

// Settings Schema
const settingsSchema = new mongoose.Schema({
    // General Settings
    appName: { type: String, default: 'OptikGoal' },
    appLogo: { type: String, default: '/assets/logo.png' },
    supportEmail: { type: String, default: 'support@optikgoal.com' },
    tagline: { type: String, default: 'Your Ultimate Sports Prediction Platform' },
    contactPhone: { type: String, default: '' },
    footerText: { type: String, default: 'Professional sports predictions and analysis' },
    copyrightText: { type: String, default: '© 2024 OptikGoal. All rights reserved.' },

    // Feature Toggles
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'We are currently under maintenance. Please check back soon.' },
    registrationEnabled: { type: Boolean, default: true },
    commentsEnabled: { type: Boolean, default: true },
    vipEnabled: { type: Boolean, default: true },
    liveScoresEnabled: { type: Boolean, default: true },

    // Social Media Links
    socialMedia: {
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        youtube: { type: String, default: '' },
        telegram: { type: String, default: '' },
        whatsapp: { type: String, default: '' }
    },

    // SEO Settings
    seo: {
        metaDescription: { type: String, default: 'Get accurate sports predictions and expert analysis on OptikGoal' },
        metaKeywords: { type: String, default: 'sports predictions, betting tips, football predictions, live scores' },
        googleAnalyticsId: { type: String, default: '' },
        facebookPixelId: { type: String, default: '' },
        faviconUrl: { type: String, default: '/favicon.ico' }
    },

    languages: { type: [String], default: ['en', 'tr', 'ar'] },

    // VIP Pricing (existing)
    vipPricing: { type: Object },
}, {
    timestamps: true,
});

// Use a singleton pattern - only one settings document
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

module.exports = Settings;
