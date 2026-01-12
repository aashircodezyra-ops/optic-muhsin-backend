/**
 * Legacy RSS Service - Now uses unified newsService
 * Kept for backwards compatibility
 */
const newsService = require('./newsService');

// Legacy functions - delegate to new newsService
const fetchRSSFeed = async () => {
  // Deprecated - use newsService.fetchAllNews() instead
  return { success: false, message: 'Use newsService.fetchAllNews() instead' };
};

const parseXML = async () => {
  // Deprecated - use newsService instead
  return null;
};

const fetchESPNNews = async () => {
  // Deprecated - use newsService.fetchAllNews() instead
  return { success: false, count: 0 };
};

const fetchSkySportsNews = async () => {
  // Deprecated - use newsService.fetchAllNews() instead
  return { success: false, count: 0 };
};

// Main function - delegates to new service
const fetchAllNews = async () => {
  try {
    const result = await newsService.fetchAllNews();
    // Transform to old format for backwards compatibility
    return {
      success: result.success,
      espn: { success: result.success, count: result.api1?.count || 0 },
      skysports: { success: result.success, count: result.api2?.count || 0 },
      total: result.total || 0,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      total: 0,
    };
  }
};

module.exports = {
  fetchRSSFeed,
  parseXML,
  fetchESPNNews,
  fetchSkySportsNews,
  fetchAllNews,
};

