const cron = require('node-cron');
const mongoose = require('mongoose');
const { generatePredictions } = require('../services/predictionEngine');

/**
 * Predictions Cron Job
 * Runs every 6 hours to auto-generate predictions for today's fixtures
 */

let isRunning = false;

const runPredictionsCron = async () => {
  // Prevent concurrent runs
  if (isRunning) {
    console.log('[PredictionsCron] Previous job still running, skipping...');
    return;
  }

  // Check MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    console.warn('[PredictionsCron] MongoDB not connected, skipping prediction generation');
    return;
  }

  isRunning = true;
  const startTime = new Date();

  try {
    console.log('[PredictionsCron] Starting prediction generation...');
    
    // Generate predictions for today
    const result = await generatePredictions();

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (result.success) {
      console.log(`[PredictionsCron] ✅ Completed in ${duration}s`);
      console.log(`[PredictionsCron] Generated: ${result.generated}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
    } else {
      console.error(`[PredictionsCron] ❌ Failed: ${result.error}`);
    }
  } catch (error) {
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error(`[PredictionsCron] ❌ Fatal error after ${duration}s:`, error.message);
  } finally {
    isRunning = false;
  }
};

// Schedule cron job: every 6 hours
// Format: minute hour day month dayOfWeek
// Runs at: 00:00, 06:00, 12:00, 18:00
const schedule = cron.schedule('0 */6 * * *', runPredictionsCron, {
  scheduled: false, // Don't start automatically
  timezone: 'UTC',
});

/**
 * Start the predictions cron job
 */
const startPredictionsCron = () => {
  try {
    schedule.start();
    console.log('[PredictionsCron] ✅ Scheduled to run every 6 hours');
    
    // Run immediately on startup to populate predictions
    console.log('[PredictionsCron] Running initial prediction generation...');
    runPredictionsCron();
  } catch (error) {
    console.error('[PredictionsCron] ❌ Failed to start cron job:', error.message);
  }
};

/**
 * Stop the predictions cron job
 */
const stopPredictionsCron = () => {
  try {
    schedule.stop();
    console.log('[PredictionsCron] Stopped');
  } catch (error) {
    console.error('[PredictionsCron] Error stopping cron job:', error.message);
  }
};

module.exports = {
  startPredictionsCron,
  stopPredictionsCron,
  runPredictionsCron, // Export for manual triggering
};

