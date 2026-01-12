const News = require('../models/News');
const { getCachedNews, refreshCache } = require('../services/newsService');
const { paginate } = require('../utils/helpers');

/**
 * Get all news articles
 * GET /api/news?limit=20&page=1&source=api1|api2|trt&tag=sport
 */
const getNews = async (req, res) => {
  try {
    const { limit = 20, page = 1, source, tag } = req.query;

    // Try to get from cache first
    try {
      const cached = getCachedNews({
        limit: parseInt(limit),
        page: parseInt(page),
        source,
        tag,
      });

      if (cached.articles.length > 0 || cached.total === 0) {
        return res.json({
          success: true,
          total: cached.total,
          page: parseInt(page),
          limit: parseInt(limit),
          articles: cached.articles,
        });
      }
    } catch (cacheError) {
      // Fall through to DB query if cache fails
      console.warn('[News Controller] Cache error, falling back to DB:', cacheError.message);
    }

    // Fallback to database query
    const { skip, limit: limitNum } = paginate(page, limit);
    const filter = { isActive: true };

    if (source) {
      filter.source = source;
    }

    if (tag) {
      filter.tags = tag;
    }

    const [articles, total] = await Promise.all([
      News.find(filter)
        .select('-raw') // Don't send raw data to frontend
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      News.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: limitNum,
      articles,
    });
  } catch (error) {
    console.error('[News Controller] Error in getNews:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching news',
      articles: [],
      total: 0,
    });
  }
};

/**
 * Get sports news from NewsAPI.org
 * GET /api/news/sports?page=1&pageSize=20&query=cricket
 */
const getSportsNews = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, query = null } = req.query;

    const { fetchSportsNews } = require('../services/newsApiService');
    const result = await fetchSportsNews({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      query: query || null,
    });

    if (result.success) {
      return res.json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        cached: result.cached || false,
      });
    } else {
      // Handle different error types
      const statusCode = result.error === 'RATE_LIMIT' ? 429 
        : result.error === 'UNAUTHORIZED' ? 401 
        : result.error === 'NETWORK_ERROR' || result.error === 'TIMEOUT' ? 503
        : 500;

      return res.status(statusCode).json({
        success: false,
        message: result.message || 'Failed to fetch sports news',
        data: [],
        total: 0,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[News Controller] Error in getSportsNews:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching sports news',
      data: [],
      total: 0,
    });
  }
};

/**
 * Get news bulletin (minimal fields)
 * GET /api/news/bulletin?limit=50
 */
const getBulletin = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const limitNum = parseInt(limit);

    // Try cache first
    try {
      const cached = getCachedNews({
        limit: limitNum,
        page: 1,
      });

      if (cached.articles.length > 0) {
        const bulletin = cached.articles.map(article => ({
          title: article.title,
          link: article.link,
          publishedAt: article.publishedAt,
          source: article.source,
          image: article.image,
        }));

        return res.json({
          success: true,
          articles: bulletin,
          total: bulletin.length,
        });
      }
    } catch (cacheError) {
      // Fall through to DB
    }

    // Fallback to database
    const articles = await News.find({ isActive: true })
      .select('title link publishedAt source image')
      .sort({ publishedAt: -1 })
      .limit(limitNum)
      .lean();

    const bulletin = articles.map(article => ({
      title: article.title,
      link: article.link,
      publishedAt: article.publishedAt,
      source: article.source,
      image: article.image,
    }));

    res.json({
      success: true,
      articles: bulletin,
      total: bulletin.length,
    });
  } catch (error) {
    console.error('[News Controller] Error in getBulletin:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching bulletin',
      articles: [],
      total: 0,
    });
  }
};

/**
 * Get single news article
 * GET /api/news/:id
 */
const getSingleNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).select('-raw');

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found',
      });
    }

    // Increment views
    news.views = (news.views || 0) + 1;
    await news.save();

    res.json({
      success: true,
      article: news,
    });
  } catch (error) {
    console.error('[News Controller] Error in getSingleNews:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching news article',
    });
  }
};

/**
 * Refresh news (Admin only)
 * POST /api/news/refresh
 */
const refreshNews = async (req, res) => {
  try {
    const { fetchAllNews } = require('../services/newsService');
    const result = await fetchAllNews();

    res.json({
      success: result.success,
      message: result.success
        ? `Fetched ${result.inserted} new articles`
        : result.message,
      data: {
        inserted: result.inserted,
        skipped: result.skipped,
        api1: result.api1,
        api2: result.api2,
        trt: result.trt,
      },
    });
  } catch (error) {
    console.error('[News Controller] Error in refreshNews:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error refreshing news',
    });
  }
};

module.exports = {
  getNews,
  getSportsNews,
  getBulletin,
  getSingleNews,
  refreshNews,
};
