/**
 * API Status Endpoint
 * Provides diagnostic information about API connectivity
 */

const express = require('express');
const router = express.Router();
const {
  getFootballLiveMatches,
  getBasketballLiveMatches,
} = require('../services/apiFootball');
const { fetchAllNews } = require('../services/newsService');
const axios = require('axios');

/**
 * Get API status
 * GET /api/status
 */
router.get('/', async (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    apis: {},
    environment: {
      apiFootballKey: process.env.API_FOOTBALL_KEY ? '✅ Set' : '❌ Not Set',
      newsApiKey1: process.env.NEWS_API_KEY_1 ? '✅ Set' : '⚠️ Not Set',
      newsApiKey2: process.env.NEWS_API_KEY_2 ? '✅ Set' : '⚠️ Not Set',
      trtRssUrl: process.env.TRT_RSS_URL || 'https://www.trthaber.com/spor_articles.rss',
    },
  };

  // Test Football API
  try {
    const result = await getFootballLiveMatches();
    status.apis.football = {
      status: result.success ? '✅ Working' : '❌ Failed',
      message: result.message || 'OK',
      liveMatches: result.success ? (result.data?.length || 0) : 0,
      error: result.success ? null : result.message,
    };
  } catch (error) {
    status.apis.football = {
      status: '❌ Error',
      message: error.message,
      liveMatches: 0,
      error: error.message,
    };
  }

  // Test Basketball API
  try {
    const result = await getBasketballLiveMatches();
    status.apis.basketball = {
      status: result.success ? '✅ Working' : '❌ Failed',
      message: result.message || 'OK',
      liveMatches: result.success ? (result.data?.length || 0) : 0,
      error: result.success ? null : result.message,
    };
  } catch (error) {
    status.apis.basketball = {
      status: '❌ Error',
      message: error.message,
      liveMatches: 0,
      error: error.message,
    };
  }

  // Test News API (TRT RSS)
  try {
    const trtUrl = process.env.TRT_RSS_URL || 'https://www.trthaber.com/spor_articles.rss';
    const response = await axios.get(trtUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    status.apis.news = {
      status: response.status === 200 ? '✅ Working' : '⚠️ Warning',
      message: `HTTP ${response.status}`,
      trtRss: response.status === 200 ? '✅ Accessible' : '❌ Failed',
    };
  } catch (error) {
    status.apis.news = {
      status: '❌ Error',
      message: error.message,
      trtRss: '❌ Failed',
      error: error.code || error.message,
    };
  }

  // Test News Service
  try {
    const result = await fetchAllNews();
    if (result.success) {
      status.apis.newsService = {
        status: '✅ Working',
        api1: result.api1?.fetched || 0,
        api2: result.api2?.fetched || 0,
        trt: result.trt?.fetched || 0,
        inserted: result.inserted || 0,
      };
    } else {
      status.apis.newsService = {
        status: '⚠️ Partial',
        message: result.message,
      };
    }
  } catch (error) {
    status.apis.newsService = {
      status: '❌ Error',
      message: error.message,
    };
  }

  res.json({
    success: true,
    data: status,
  });
});

module.exports = router;
