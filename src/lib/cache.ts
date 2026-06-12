/**
 * Offline caching layer using AsyncStorage
 * Provides TTL-based caching for critical app data
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache TTL configuration (in milliseconds)
const CACHE_TTL = {
  accounts: 5 * 60 * 1000,          // 5 minutes - changes frequently
  balance: 2 * 60 * 1000,           // 2 minutes - real-time data
  user: 30 * 60 * 1000,             // 30 minutes - relatively stable
  categories: 24 * 60 * 60 * 1000,  // 24 hours - rarely changes
  budgets: 10 * 60 * 1000,          // 10 minutes - moderate changes
  plans: 60 * 60 * 1000,            // 1 hour - rarely changes
  settings: 15 * 60 * 1000,         // 15 minutes - moderate changes
  // Note: Don't cache transactions, insights, alerts (always fetch fresh)
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string; // For cache invalidation on app updates
}

const CACHE_VERSION = '1.0.0'; // Increment to invalidate all cache

export const cacheManager = {
  /**
   * Get cached data if still valid
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache:${key}`);
      if (!cached) return null;

      const { data, timestamp, version } = JSON.parse(cached) as CacheEntry<T>;
      
      // Invalidate if version mismatch
      if (version !== CACHE_VERSION) {
        await this.clear(key);
        return null;
      }

      const ttl = CACHE_TTL[key as keyof typeof CACHE_TTL] ?? Infinity;
      const age = Date.now() - timestamp;

      if (ttl === Infinity || age < ttl) {
        console.log(`Cache HIT: ${key} (age: ${Math.round(age / 1000)}s)`);
        return data;
      }

      // Expired, remove it
      console.log(`Cache EXPIRED: ${key} (age: ${Math.round(age / 1000)}s, ttl: ${Math.round(ttl / 1000)}s)`);
      await this.clear(key);
      return null;
    } catch (err) {
      console.warn(`Cache get failed for ${key}:`, err);
      return null;
    }
  },

  /**
   * Store data in cache with timestamp and version
   */
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };

      await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(entry));
      console.log(`Cache SET: ${key}`);
    } catch (err) {
      console.warn(`Cache set failed for ${key}:`, err);
    }
  },

  /**
   * Clear specific key or all cache entries
   */
  async clear(key?: string): Promise<void> {
    try {
      if (key) {
        await AsyncStorage.removeItem(`cache:${key}`);
        console.log(`Cache CLEARED: ${key}`);
      } else {
        // Clear all cache entries
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith('cache:'));
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`Cache CLEARED: ${cacheKeys.length} entries`);
      }
    } catch (err) {
      console.warn('Cache clear failed:', err);
    }
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ totalEntries: number; totalSize: number; entries: Array<{ key: string; age: number; size: number }> }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('cache:'));
      
      const entries = await Promise.all(
        cacheKeys.map(async (key) => {
          try {
            const value = await AsyncStorage.getItem(key);
            if (!value) return null;
            
            const { timestamp } = JSON.parse(value) as CacheEntry<any>;
            return {
              key: key.replace('cache:', ''),
              age: Date.now() - timestamp,
              size: new Blob([value]).size,
            };
          } catch {
            return null;
          }
        })
      );

      const validEntries = entries.filter(Boolean) as Array<{ key: string; age: number; size: number }>;
      const totalSize = validEntries.reduce((sum, entry) => sum + entry.size, 0);

      return {
        totalEntries: validEntries.length,
        totalSize,
        entries: validEntries,
      };
    } catch (err) {
      console.warn('Cache stats failed:', err);
      return { totalEntries: 0, totalSize: 0, entries: [] };
    }
  },

  /**
   * Check if data exists in cache (regardless of expiry)
   */
  async has(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(`cache:${key}`);
      return cached !== null;
    } catch {
      return false;
    }
  },

  /**
   * Refresh cache for a specific key (clear and force reload)
   */
  async refresh(key: string): Promise<void> {
    await this.clear(key);
  },
};

/**
 * Higher-order function to add caching to API calls
 */
export const withCache = <T extends any[], R>(
  apiCall: (...args: T) => Promise<{ data: R }>,
  cacheKey: string,
  generateKey?: (...args: T) => string
) => {
  return async (...args: T): Promise<{ data: R; fromCache?: boolean }> => {
    const key = generateKey ? generateKey(...args) : cacheKey;
    
    // Try cache first
    const cached = await cacheManager.get<R>(key);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    // If not cached, fetch from API
    const result = await apiCall(...args);
    
    // Cache the result
    await cacheManager.set(key, result.data);
    
    return { data: result.data, fromCache: false };
  };
};