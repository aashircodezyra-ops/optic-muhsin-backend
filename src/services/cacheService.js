/**
 * Cache Service for Match Data
 * 
 * Provides in-memory caching with TTL (Time To Live) support.
 * This service caches match data, statistics, lineups, and events to reduce
 * API calls and improve performance.
 * 
 * Features:
 * - Automatic expiration of cached data
 * - Configurable TTL per cache entry
 * - Automatic cleanup of expired entries
 * - Can be easily replaced with Redis for production
 * 
 * @class CacheService
 * @example
 * const cache = require('./services/cacheService');
 * const data = await cache.getMatchDetails('football', matchId, fetchFn, 60000);
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Generate cache key
   */
  generateKey(prefix, id, type = '') {
    return `${prefix}:${id}${type ? `:${type}` : ''}`;
  }

  /**
   * Get cached data
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set cached data
   */
  set(key, data, ttl = null) {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  /**
   * Delete cached data
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get or set cached data (with callback)
   */
  async getOrSet(key, fetchFn, ttl = null) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    if (data !== null && data !== undefined) {
      this.set(key, data, ttl);
    }
    return data;
  }

  /**
   * Cache match details
   */
  async getMatchDetails(sport, matchId, fetchFn, ttl = null) {
    const key = this.generateKey(`${sport}:match`, matchId);
    return this.getOrSet(key, fetchFn, ttl || this.defaultTTL);
  }

  /**
   * Cache match stats
   */
  async getMatchStats(sport, matchId, fetchFn, ttl = null) {
    const key = this.generateKey(`${sport}:stats`, matchId);
    // Stats cache for shorter time (1-2 minutes for live matches)
    return this.getOrSet(key, fetchFn, ttl || 2 * 60 * 1000);
  }

  /**
   * Cache match lineups
   */
  async getMatchLineups(sport, matchId, fetchFn, ttl = null) {
    const key = this.generateKey(`${sport}:lineups`, matchId);
    return this.getOrSet(key, fetchFn, ttl || this.defaultTTL);
  }

  /**
   * Cache match events/timeline
   */
  async getMatchEvents(sport, matchId, fetchFn, ttl = null) {
    const key = this.generateKey(`${sport}:events`, matchId);
    // Events cache for shorter time (1 minute for live matches)
    return this.getOrSet(key, fetchFn, ttl || 1 * 60 * 1000);
  }

  /**
   * Invalidate match cache
   */
  invalidateMatch(sport, matchId) {
    const patterns = [
      this.generateKey(`${sport}:match`, matchId),
      this.generateKey(`${sport}:stats`, matchId),
      this.generateKey(`${sport}:lineups`, matchId),
      this.generateKey(`${sport}:events`, matchId),
    ];

    patterns.forEach(key => this.delete(key));
  }

  /**
   * Clean expired entries (run periodically)
   */
  cleanExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
    };
  }
}

// Singleton instance
const cacheService = new CacheService();

// Clean expired entries every 5 minutes
setInterval(() => {
  cacheService.cleanExpired();
}, 5 * 60 * 1000);

module.exports = cacheService;

