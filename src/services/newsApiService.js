/**
 * NewsAPI.org Sports News Service
 * Fetches sports news from NewsAPI.org
 * Implements caching with 10-15 minute TTL
 * Handles rate limits and errors gracefully
 */

const axios = require('axios');

// Configuration from environment
const NEWSAPI_KEY = process.env.NEWSAPI_KEY || 'c9c9168f747e47af8b72472d9ce3faf8';
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';
const CACHE_TTL = 12 * 60 * 1000; // 12 minutes (between 10-15 min requirement)

// In-memory cache
let sportsNewsCache = {
  data: [],
  timestamp: null,
  ttl: CACHE_TTL,
};

/**
 * Check if cache is valid
 */
function isCacheValid() {
  if (!sportsNewsCache.timestamp || !sportsNewsCache.data.length) {
    return false;
  }
  const now = Date.now();
  return (now - sportsNewsCache.timestamp) < sportsNewsCache.ttl;
}

/**
 * Get cached sports news
 */
function getCachedNews() {
  if (isCacheValid()) {
    return {
      success: true,
      data: [...sportsNewsCache.data],
      cached: true,
    };
  }
  return null;
}

/**
 * Set cache
 */
function setCache(data) {
  sportsNewsCache = {
    data: Array.isArray(data) ? data : [],
    timestamp: Date.now(),
    ttl: CACHE_TTL,
  };
}

/**
 * Normalize article data to consistent format
 */
function normalizeArticle(article) {
  return {
    title: article.title || '',
    description: article.description || article.content || '',
    imageUrl: article.urlToImage || null,
    source: article.source?.name || 'Unknown',
    publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
    articleUrl: article.url || '#',
    // Additional fields for compatibility
    author: article.author || null,
    content: article.content || article.description || '',
  };
}

/**
 * Fetch sports news from NewsAPI.org
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 20, max: 100)
 * @param {string} options.query - Search query (optional)
 * @returns {Promise<Object>} Normalized news data
 */
async function fetchSportsNews(options = {}) {
  const { page = 1, pageSize = 20, query = null } = options;

  // Check cache first
  const cached = getCachedNews();
  if (cached) {
    console.log('[NewsAPI Service] Returning cached sports news');
    
    // Apply pagination to cached data
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = cached.data.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedData,
      total: cached.data.length,
      page,
      pageSize,
      cached: true,
    };
  }

  // Validate API key
  if (!NEWSAPI_KEY) {
    console.error('[NewsAPI Service] API key not configured');
    return {
      success: false,
      message: 'NewsAPI key not configured',
      data: [],
      total: 0,
    };
  }

  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('apiKey', NEWSAPI_KEY);
    params.append('category', 'sports');
    params.append('page', page.toString());
    params.append('pageSize', Math.min(pageSize, 100).toString()); // Max 100 per API limit
    params.append('sortBy', 'publishedAt');
    params.append('language', 'en');

    // Add search query if provided (for keywords like cricket, football)
    if (query) {
      params.append('q', query);
    } else {
      // Default: search for sports keywords
      params.append('q', 'sports OR football OR cricket OR basketball');
    }

    const url = `${NEWSAPI_BASE_URL}/everything?${params.toString()}`;
    
    console.log('[NewsAPI Service] Fetching sports news from NewsAPI.org...');
    
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'OptikGoal/1.0',
      },
    });

    // Handle API response
    if (response.data.status === 'ok' && Array.isArray(response.data.articles)) {
      const articles = response.data.articles
        .filter(article => {
          // Filter out articles without title or URL
          return article.title && article.url;
        })
        .map(normalizeArticle);

      // Update cache with all fetched articles (not just current page)
      // This allows pagination to work from cache
      if (page === 1) {
        // Only update cache on first page to avoid overwriting with partial data
        setCache(articles);
      }

      console.log(`[NewsAPI Service] Fetched ${articles.length} sports articles`);

      return {
        success: true,
        data: articles,
        total: response.data.totalResults || articles.length,
        page,
        pageSize,
        cached: false,
      };
    } else {
      // Empty response or unexpected format
      console.warn('[NewsAPI Service] Empty or unexpected response from NewsAPI');
      return {
        success: true,
        data: [],
        total: 0,
        page,
        pageSize,
        cached: false,
        message: 'No sports news available',
      };
    }
  } catch (error) {
    // Handle different error types
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Rate limit exceeded
      if (status === 429) {
        console.error('[NewsAPI Service] Rate limit exceeded');
        return {
          success: false,
          message: 'API rate limit exceeded. Please try again later.',
          data: [],
          total: 0,
          error: 'RATE_LIMIT',
        };
      }

      // Unauthorized (invalid API key)
      if (status === 401) {
        console.error('[NewsAPI Service] Unauthorized - Invalid API key');
        return {
          success: false,
          message: 'Invalid API key',
          data: [],
          total: 0,
          error: 'UNAUTHORIZED',
        };
      }

      // Other API errors
      console.error(`[NewsAPI Service] API error ${status}:`, data?.message || error.message);
      return {
        success: false,
        message: data?.message || `API error: ${status}`,
        data: [],
        total: 0,
        error: 'API_ERROR',
      };
    }

    // Network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.error('[NewsAPI Service] Request timeout');
      return {
        success: false,
        message: 'Request timeout. Please try again later.',
        data: [],
        total: 0,
        error: 'TIMEOUT',
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('[NewsAPI Service] Network error:', error.message);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        data: [],
        total: 0,
        error: 'NETWORK_ERROR',
      };
    }

    // Unknown error
    console.error('[NewsAPI Service] Unknown error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch sports news',
      data: [],
      total: 0,
      error: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
function clearCache() {
  sportsNewsCache = {
    data: [],
    timestamp: null,
    ttl: CACHE_TTL,
  };
  console.log('[NewsAPI Service] Cache cleared');
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    cached: isCacheValid(),
    itemCount: sportsNewsCache.data.length,
    age: sportsNewsCache.timestamp 
      ? Math.floor((Date.now() - sportsNewsCache.timestamp) / 1000 / 60) 
      : null, // Age in minutes
    ttl: Math.floor(CACHE_TTL / 1000 / 60), // TTL in minutes
  };
}

module.exports = {
  fetchSportsNews,
  clearCache,
  getCacheStats,
  isCacheValid,
};
