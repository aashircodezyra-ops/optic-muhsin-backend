/**
 * Unified News Service
 * Fetches from 2 API sources + TRT RSS feed
 * Handles parsing, normalization, deduplication, and caching
 */

const axios = require('axios');
const xml2js = require('xml2js');
const News = require('../models/News');
const mongoose = require('mongoose');

// Configuration from environment
const NEWS_API_KEY_1 = process.env.NEWS_API_KEY_1 || '';
const NEWS_API_KEY_2 = process.env.NEWS_API_KEY_2 || '';
const TRT_RSS_URL = process.env.TRT_RSS_URL || 'https://www.trthaber.com/spor_articles.rss';
const NEWS_CACHE_TTL = parseInt(process.env.NEWS_CACHE_TTL || '300', 10); // seconds

// In-memory cache
let newsCache = {
  data: [],
  timestamp: null,
  ttl: NEWS_CACHE_TTL * 1000, // Convert to milliseconds
};

// Source priority for deduplication (higher = better)
const SOURCE_PRIORITY = {
  api1: 3,
  api2: 2,
  trt: 1,
};

/**
 * Safe text cleaning - avoids .trim() errors
 * Converts arrays/objects/null/strings -> trimmed string
 */
function cleanText(value) {
  // If value is null or undefined → return ""
  if (value === null || value === undefined) {
    return '';
  }

  // If value is a string → return trimmed
  if (typeof value === 'string') {
    return value.trim();
  }

  // If value is an array → join all values into one string, then trim
  if (Array.isArray(value)) {
    return value.map(v => cleanText(v)).join(' ').trim();
  }

  // If value is an object → join Object.values into one string, then trim
  if (typeof value === 'object') {
    try {
      return Object.values(value)
        .map(v => cleanText(v))
        .join(' ')
        .trim();
    } catch (error) {
      return '';
    }
  }

  // Otherwise → convert to string and trim
  try {
    return String(value).trim();
  } catch (error) {
    return '';
  }
}

/**
 * Safe object property access
 * Avoids undefined crashes
 */
function safeGet(obj, path, defaultValue = null) {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    return result !== undefined && result !== null ? result : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Parse date string to Date object
 * Returns null if parsing fails
 */
function parseDate(value) {
  if (!value) return new Date(); // Default to now if missing

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return new Date(); // Invalid date, return now
    }
    return date;
  } catch (error) {
    return new Date(); // Return now on error
  }
}

/**
 * Extract image URL from HTML content
 */
function extractImageFromHtml(html) {
  if (!html || typeof html !== 'string') return null;

  try {
    // Try to find <img> tag
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return cleanText(imgMatch[1]);
    }

    // Try to find background-image in style
    const bgMatch = html.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
    if (bgMatch && bgMatch[1]) {
      return cleanText(bgMatch[1]);
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Normalize title for deduplication
 */
function normalizeTitle(title) {
  if (!title) return '';
  return cleanText(title)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Axios request with retry logic
 */
async function fetchWithRetry(url, options = {}, retries = 2) {
  const timeout = options.timeout || 8000;
  const config = {
    ...options,
    timeout,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...options.headers,
    },
  };

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      if (i === retries) {
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

/**
 * Fetch from NewsAPI (API Key 1)
 */
async function fetchFromAPI1() {
  if (!NEWS_API_KEY_1) {
    console.warn('[News Service] NEWS_API_KEY_1 not configured');
    return [];
  }

  try {
    // NewsAPI.org endpoint for sports news
    const url = `https://newsapi.org/v2/top-headlines`;
    const response = await fetchWithRetry(url, {
      params: {
        apiKey: NEWS_API_KEY_1,
        category: 'sports',
        country: 'us',
        pageSize: 50,
      },
    });

    if (!response || !response.articles) {
      return [];
    }

    const articles = [];
    for (const item of response.articles || []) {
      try {
        const article = {
          title: cleanText(safeGet(item, 'title')),
          description: cleanText(safeGet(item, 'description')),
          content: cleanText(safeGet(item, 'content')),
          link: cleanText(safeGet(item, 'url')),
          image: cleanText(safeGet(item, 'urlToImage')),
          source: 'api1',
          author: cleanText(safeGet(item, 'author')),
          publishedAt: parseDate(safeGet(item, 'publishedAt')),
          tags: ['sport'],
          raw: item,
        };

        // Validate required fields
        if (article.title && article.link) {
          articles.push(article);
        }
      } catch (error) {
        console.error('[News Service] Error processing API1 item:', error.message);
        continue;
      }
    }

    return articles;
  } catch (error) {
    console.error('[News Service] API1 fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch from NewsAPI (API Key 2)
 */
async function fetchFromAPI2() {
  if (!NEWS_API_KEY_2) {
    console.warn('[News Service] NEWS_API_KEY_2 not configured');
    return [];
  }

  try {
    // NewsAPI.org endpoint for sports news
    const url = `https://newsapi.org/v2/top-headlines`;
    const response = await fetchWithRetry(url, {
      params: {
        apiKey: NEWS_API_KEY_2,
        category: 'sports',
        country: 'us',
        pageSize: 50,
      },
    });

    if (!response || !response.articles) {
      return [];
    }

    const articles = [];
    for (const item of response.articles || []) {
      try {
        const article = {
          title: cleanText(safeGet(item, 'title')),
          description: cleanText(safeGet(item, 'description')),
          content: cleanText(safeGet(item, 'content')),
          link: cleanText(safeGet(item, 'url')),
          image: cleanText(safeGet(item, 'urlToImage')),
          source: 'api2',
          author: cleanText(safeGet(item, 'author')),
          publishedAt: parseDate(safeGet(item, 'publishedAt')),
          tags: ['sport'],
          raw: item,
        };

        // Validate required fields
        if (article.title && article.link) {
          articles.push(article);
        }
      } catch (error) {
        console.error('[News Service] Error processing API2 item:', error.message);
        continue;
      }
    }

    return articles;
  } catch (error) {
    console.error('[News Service] API2 fetch error:', error.message);
    return [];
  }
}

/**
 * Parse RSS XML
 */
function parseXML(xml) {
  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true,
    });

    parser.parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Fetch and parse TRT RSS feed
 */
async function fetchFromTRT() {
  try {
    const xml = await fetchWithRetry(TRT_RSS_URL);
    const parsed = await parseXML(xml);

    // Handle different RSS structures
    let items = [];
    if (parsed.rss && parsed.rss.channel) {
      const channel = Array.isArray(parsed.rss.channel) ? parsed.rss.channel[0] : parsed.rss.channel;
      items = channel.item || (Array.isArray(channel.item) ? channel.item : []);
    } else if (parsed.feed && parsed.feed.entry) {
      items = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
    }

    if (!Array.isArray(items)) {
      items = [];
    }

    const articles = [];
    for (const item of items) {
      try {
        // Extract fields with safe access
        const rawTitle = safeGet(item, 'title', '') || safeGet(item, 'title._', '');
        const rawDescription = safeGet(item, 'description', '') ||
                              safeGet(item, 'content', '') ||
                              safeGet(item, 'summary', '') ||
                              safeGet(item, 'content._', '');
        const rawLink = safeGet(item, 'link', '') ||
                       safeGet(item, 'link.href', '') ||
                       safeGet(item, 'guid', '') ||
                       safeGet(item, 'id', '');
        const rawPubDate = safeGet(item, 'pubDate', '') ||
                          safeGet(item, 'published', '') ||
                          safeGet(item, 'dc:date', '') ||
                          safeGet(item, 'updated', '');

        // Extract image
        let image = safeGet(item, 'media:content.$.url', '') ||
                   safeGet(item, 'enclosure.$.url', '') ||
                   safeGet(item, 'media:thumbnail.$.url', '') ||
                   safeGet(item, 'media:content.url', '');

        // If no image found, try to extract from description
        if (!image && rawDescription) {
          image = extractImageFromHtml(rawDescription);
        }

        const title = cleanText(rawTitle);
        const description = cleanText(rawDescription);
        const link = cleanText(rawLink);
        const content = cleanText(rawDescription); // Use description as content if no separate content

        // Validate required fields
        if (!title || !link) {
          continue;
        }

        articles.push({
          title,
          description,
          content,
          link,
          image: cleanText(image),
          source: 'trt',
          author: null,
          publishedAt: parseDate(rawPubDate),
          tags: ['sport'],
          raw: item,
        });
      } catch (error) {
        console.error('[News Service] Error processing TRT RSS item:', error.message);
        continue;
      }
    }

    return articles;
  } catch (error) {
    console.error('[News Service] TRT RSS fetch error:', error.message);
    return [];
  }
}

/**
 * Deduplicate articles
 * Priority: api1 > api2 > trt
 * Dedupe by link if present, else by normalized title + same day
 */
function deduplicateArticles(articles) {
  const seen = new Map();
  const result = [];

  for (const article of articles) {
    let key = null;
    let isDuplicate = false;

    // Try to dedupe by link first
    if (article.link) {
      key = `link:${article.link.toLowerCase().trim()}`;
      if (seen.has(key)) {
        const existing = seen.get(key);
        // Keep the one with higher priority or longer content
        if (SOURCE_PRIORITY[article.source] > SOURCE_PRIORITY[existing.source] ||
            (SOURCE_PRIORITY[article.source] === SOURCE_PRIORITY[existing.source] &&
             article.content.length > existing.content.length)) {
          // Replace existing
          const index = result.findIndex(a => a === existing);
          if (index !== -1) {
            result[index] = article;
            seen.set(key, article);
          }
        }
        isDuplicate = true;
      }
    }

    // If no link or link-based dedupe didn't match, try title + date
    if (!isDuplicate && article.title) {
      const normalizedTitle = normalizeTitle(article.title);
      const pubDate = article.publishedAt;
      
      // Check if we have a similar article from the same day
      for (const existing of result) {
        if (normalizeTitle(existing.title) === normalizedTitle &&
            isSameDay(existing.publishedAt, pubDate)) {
          // Keep the one with higher priority or longer content
          if (SOURCE_PRIORITY[article.source] > SOURCE_PRIORITY[existing.source] ||
              (SOURCE_PRIORITY[article.source] === SOURCE_PRIORITY[existing.source] &&
               article.content.length > existing.content.length)) {
            const index = result.findIndex(a => a === existing);
            if (index !== -1) {
              result[index] = article;
              if (key) seen.set(key, article);
            }
          }
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) {
      result.push(article);
      if (key) seen.set(key, article);
    }
  }

  return result;
}

/**
 * Fetch all news from all sources
 */
async function fetchAllNews() {
  const results = {
    api1: { count: 0, fetched: 0 },
    api2: { count: 0, fetched: 0 },
    trt: { count: 0, fetched: 0 },
    inserted: 0,
    skipped: 0,
  };

  try {
    // Fetch from all sources in parallel
    const [api1Articles, api2Articles, trtArticles] = await Promise.allSettled([
      fetchFromAPI1(),
      fetchFromAPI2(),
      fetchFromTRT(),
    ]);

    // Process results
    const allArticles = [];
    
    if (api1Articles.status === 'fulfilled') {
      results.api1.fetched = api1Articles.value.length;
      allArticles.push(...api1Articles.value);
    } else {
      console.error('[News Service] API1 failed:', api1Articles.reason?.message);
    }

    if (api2Articles.status === 'fulfilled') {
      results.api2.fetched = api2Articles.value.length;
      allArticles.push(...api2Articles.value);
    } else {
      console.error('[News Service] API2 failed:', api2Articles.reason?.message);
    }

    if (trtArticles.status === 'fulfilled') {
      results.trt.fetched = trtArticles.value.length;
      allArticles.push(...trtArticles.value);
    } else {
      console.error('[News Service] TRT RSS failed:', trtArticles.reason?.message);
    }

    // Deduplicate
    const uniqueArticles = deduplicateArticles(allArticles);
    results.api1.count = uniqueArticles.filter(a => a.source === 'api1').length;
    results.api2.count = uniqueArticles.filter(a => a.source === 'api2').length;
    results.trt.count = uniqueArticles.filter(a => a.source === 'trt').length;

    // Sort by publishedAt descending
    uniqueArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    // Insert into database (skip duplicates)
    for (const article of uniqueArticles) {
      try {
        // Check if article already exists
        const existing = await News.findOne({
          $or: [
            { link: article.link },
            { 
              title: article.title,
              publishedAt: {
                $gte: new Date(new Date(article.publishedAt).setHours(0, 0, 0, 0)),
                $lt: new Date(new Date(article.publishedAt).setHours(23, 59, 59, 999)),
              },
            },
          ],
        });

        if (!existing) {
          await News.create({
            ...article,
            isActive: true,
          });
          results.inserted++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        // Handle duplicate key errors silently
        if (error.code === 11000) {
          results.skipped++;
        } else {
          console.error('[News Service] Error inserting article:', error.message);
          results.skipped++;
        }
      }
    }

    // Refresh cache
    await refreshCache();

    // Log results
    console.log(
      `[News Cron] Fetched ${results.api1.fetched} items from api1, ` +
      `${results.api2.fetched} from api2, ${results.trt.fetched} from trt; ` +
      `inserted ${results.inserted} new articles; skipped ${results.skipped} duplicates.`
    );

    return {
      success: true,
      ...results,
      total: results.inserted,
    };
  } catch (error) {
    console.error('[News Service] Fatal error in fetchAllNews:', error.message);
    return {
      success: false,
      message: error.message,
      ...results,
    };
  }
}

/**
 * Refresh in-memory cache
 */
async function refreshCache() {
  try {
    const articles = await News.find({ isActive: true })
      .sort({ publishedAt: -1 })
      .limit(500)
      .lean();

    newsCache.data = articles;
    newsCache.timestamp = Date.now();
  } catch (error) {
    console.error('[News Service] Error refreshing cache:', error.message);
  }
}

/**
 * Get cached news
 */
function getCachedNews(options = {}) {
  const { limit = 20, page = 1, source, tag } = options;

  // Check if cache is valid
  const now = Date.now();
  if (!newsCache.timestamp || (now - newsCache.timestamp) > newsCache.ttl) {
    // Cache expired, but return what we have (don't block)
    console.warn('[News Service] Cache expired, returning stale data');
  }

  let articles = [...newsCache.data];

  // Filter by source
  if (source) {
    articles = articles.filter(a => a.source === source);
  }

  // Filter by tag
  if (tag) {
    articles = articles.filter(a => a.tags && a.tags.includes(tag));
  }

  // Paginate
  const skip = (page - 1) * limit;
  const paginated = articles.slice(skip, skip + limit);

  return {
    articles: paginated,
    total: articles.length,
    page,
    limit,
  };
}

/**
 * Initialize cache on startup
 */
async function initializeCache() {
  try {
    // Check DB connection
    if (mongoose.connection.readyState !== 1) {
      console.warn('[News Service] DB not connected, skipping cache initialization');
      return;
    }

    await refreshCache();
    console.log(`[News] cache initialized with ${newsCache.data.length} articles`);
  } catch (error) {
    console.error('[News Service] Error initializing cache:', error.message);
  }
}

module.exports = {
  fetchAllNews,
  getCachedNews,
  refreshCache,
  initializeCache,
  cleanText,
  parseDate,
  extractImageFromHtml,
  safeGet,
};

