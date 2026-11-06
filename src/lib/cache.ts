/**
 * Lightweight, in-memory TTL (Time-To-Live) cache for server-side responses.
 * Zero external dependencies, minimal memory footprint.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get an entry or return null if expired or missing
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set an entry with a specific TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Helper that fetches data with caching
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    // Only cache valid data
    if (fresh !== null && fresh !== undefined) {
      this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }

  /**
   * Clear cache or specific key
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Singleton global cache instance across server requests
export const serverCache = new MemoryCache();
