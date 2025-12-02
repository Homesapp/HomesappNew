import Redis from 'ioredis';

/**
 * Redis Cache Module
 * 
 * Provides caching layer for frequently accessed, semi-static data.
 * Uses Upstash Redis in production or local Redis in development.
 * 
 * Cache Tiers:
 * - Tier 1 (Static): 24h TTL - condominiums, colonies, amenities, property features
 * - Tier 2 (User Session): 15min TTL - user profiles, notifications
 * - Tier 3 (Query Results): 10min TTL - search results, reports
 */

class CacheService {
  private client: Redis | null = null;
  private enabled: boolean = false;
  private memoryCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private useMemoryCache: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Check if Redis URL is configured (Upstash or local Redis)
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
      
      if (!redisUrl) {
        console.log('[Cache] Redis not configured - using in-memory cache');
        this.useMemoryCache = true;
        this.enabled = true;
        return;
      }

      // Initialize Redis client
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        lazyConnect: true,
      });

      // Handle connection events
      this.client.on('connect', () => {
        console.log('[Cache] Redis connected successfully');
        this.enabled = true;
      });

      this.client.on('error', (err) => {
        console.error('[Cache] Redis error:', err.message);
        this.enabled = false;
      });

      this.client.on('close', () => {
        console.log('[Cache] Redis connection closed');
        this.enabled = false;
      });

      // Connect to Redis
      this.client.connect().catch((err) => {
        console.error('[Cache] Failed to connect to Redis:', err.message);
        this.enabled = false;
      });
    } catch (error: any) {
      console.error('[Cache] Failed to initialize Redis:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Get value from cache
   * Returns null if cache is disabled, key not found, or error occurred
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }

    // Use in-memory cache if Redis is not available
    if (this.useMemoryCache) {
      const cached = this.memoryCache.get(key);
      if (!cached) return null;
      if (Date.now() > cached.expiresAt) {
        this.memoryCache.delete(key);
        return null;
      }
      return cached.value as T;
    }

    if (!this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error: any) {
      console.error(`[Cache] Error getting key "${key}":`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (time to live in seconds)
   * Silently fails if cache is disabled
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Use in-memory cache if Redis is not available
    if (this.useMemoryCache) {
      this.memoryCache.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000)
      });
      return;
    }

    if (!this.client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error: any) {
      console.error(`[Cache] Error setting key "${key}":`, error.message);
    }
  }

  /**
   * Delete key(s) from cache
   * Supports pattern matching with wildcards (e.g., "user:*")
   */
  async invalidate(pattern: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Use in-memory cache if Redis is not available
    if (this.useMemoryCache) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      } else {
        this.memoryCache.delete(pattern);
      }
      return;
    }

    if (!this.client) {
      return;
    }

    try {
      // If pattern contains wildcard, scan and delete matching keys
      if (pattern.includes('*')) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
          console.log(`[Cache] Invalidated ${keys.length} keys matching "${pattern}"`);
        }
      } else {
        // Direct key deletion
        await this.client.del(pattern);
      }
    } catch (error: any) {
      console.error(`[Cache] Error invalidating pattern "${pattern}":`, error.message);
    }
  }

  /**
   * Clear all cache keys (use with caution)
   */
  async clear(): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      await this.client.flushdb();
      console.log('[Cache] Cache cleared');
    } catch (error: any) {
      console.error('[Cache] Error clearing cache:', error.message);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ enabled: boolean; keyCount?: number; memoryUsed?: string }> {
    if (!this.enabled || !this.client) {
      return { enabled: false };
    }

    try {
      const dbsize = await this.client.dbsize();
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      
      return {
        enabled: true,
        keyCount: dbsize,
        memoryUsed: memoryMatch ? memoryMatch[1] : 'unknown',
      };
    } catch (error: any) {
      console.error('[Cache] Error getting stats:', error.message);
      return { enabled: this.enabled };
    }
  }

  /**
   * Gracefully close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.enabled = false;
    }
  }
}

// Singleton instance
export const cache = new CacheService();

/**
 * Cache key builders for consistent naming
 */
export const CacheKeys = {
  // Tier 1: Static data (24h TTL)
  condominiumsApproved: () => 'condominiums:approved',
  coloniesApproved: () => 'colonies:approved',
  amenities: () => 'amenities:all',
  propertyFeatures: () => 'property-features:all',
  businessHours: () => 'business-hours',
  
  // Tier 2: User session data (15min TTL)
  userProfile: (userId: string) => `user:${userId}:profile`,
  userNotificationsUnread: (userId: string) => `user:${userId}:notifications:unread`,
  userFavorites: (userId: string) => `user:${userId}:favorites`,
  
  // Tier 3: Query results (10min TTL)
  propertySearch: (filtersHash: string) => `properties:search:${filtersHash}`,
  propertiesFeatured: () => 'properties:featured',
  appointmentsCalendar: (date: string) => `appointments:calendar:${date}`,
  
  // Dashboard caches (2min TTL for frequently changing data)
  externalDashboardSummary: (agencyId: string) => `external:dashboard:summary:${agencyId}`,
  externalSellerSummary: (userId: string, agencyId: string) => `external:seller:summary:${userId}:${agencyId}`,
  externalSellerMetrics: (userId: string, agencyId: string) => `external:seller:metrics:${userId}:${agencyId}`,
  publicProperties: (limit: number, offset: number, hasCoordinates?: boolean) => 
    `public:properties:${limit}:${offset}:${hasCoordinates || false}`,
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  STATIC: 24 * 60 * 60,      // 24 hours for nearly-static data
  USER_SESSION: 15 * 60,      // 15 minutes for user session data
  QUERY_RESULT: 10 * 60,      // 10 minutes for query results
  SHORT: 5 * 60,              // 5 minutes for frequently changing data
} as const;
