/**
 * News Cron Job
 * Fetches news articles from RSS feeds every 5 minutes
 * Also handles VIP expiry checks daily at midnight
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const { fetchAllNews } = require('../services/newsService');

// Flag to prevent concurrent runs
let isRunning = false;

/**
 * News fetch cron job
 * Runs every 5 minutes
 * Wrapped in try/catch to prevent server crashes
 */
const newsCronJob = cron.schedule('*/5 * * * *', async () => {
  // Prevent concurrent runs
  if (isRunning) {
    console.log('[News Cron] Previous job still running, skipping...');
    return;
  }

  // Check DB connection before starting
  if (mongoose.connection.readyState !== 1) {
    console.warn('[News Cron] DB not connected, skipping job');
    return;
  }

  isRunning = true;

  try {
    const result = await fetchAllNews();
    
    if (result.success) {
      // Success is already logged in fetchAllNews
    } else {
      console.error('[News Cron] Fetch failed:', result.message);
    }
  } catch (error) {
    // Log error but don't throw - prevent server crash
    console.error('[News Cron] Fatal error (non-crashing):', error.message);
    if (error.stack) {
      console.error('[News Cron] Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  } finally {
    isRunning = false;
  }
}, {
  scheduled: false, // Don't start automatically
});

/**
 * VIP Expiry Cron Job
 * Checks and disables expired VIP memberships daily at midnight
 */
const vipExpiryCron = cron.schedule('0 0 * * *', async () => {
  try {
    // Check DB connection
    if (mongoose.connection.readyState !== 1) {
      console.warn('[VIP Expiry Cron] DB not connected, skipping job');
      return;
    }

    const { checkAndDisableExpiredVIP } = require('../controllers/vipController');
    const result = await checkAndDisableExpiredVIP();
    
    if (result.success && result.expiredCount > 0) {
      console.log(`[VIP Expiry Cron] Disabled ${result.expiredCount} expired VIP memberships`);
    }
  } catch (error) {
    console.error('[VIP Expiry Cron] Error:', error.message);
  }
}, {
  scheduled: true, // Start automatically
});

// Initialize sports data cron jobs (with error handling)
try {
  require('../services/sportsCron');
} catch (error) {
  console.error('⚠️  Sports cron initialization error (non-fatal):', error.message);
  // Continue even if sports cron fails
}

/**
 * Start the news cron job
 * Called after database connection is established
 */
function startNewsCron() {
  try {
    newsCronJob.start();
    console.log('[News Cron] Scheduled job started (every 5 minutes)');
  } catch (error) {
    console.error('[News Cron] Error starting cron:', error.message);
  }
}

module.exports = {
  startNewsCron,
};

