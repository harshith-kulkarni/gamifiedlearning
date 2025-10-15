/**
 * API Request Caching and Deduplication
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
  expiry: number;
}

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

class APICache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes

  // Generate cache key from URL and headers
  private getCacheKey(url: string, options?: RequestInit): string {
    const headers = options?.headers || {};
    const method = options?.method || 'GET';
    return `${method}:${url}:${JSON.stringify(headers)}`;
  }

  // Check if cache entry is valid
  private isValid(entry: CacheEntry): boolean {
    return Date.now() < entry.expiry;
  }

  // Clean expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(key);
      }
    }
    
    // Clean old pending requests (older than 30 seconds)
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > 30000) {
        this.pendingRequests.delete(key);
      }
    }
  }

  // Cached fetch with deduplication
  async fetch(url: string, options?: RequestInit, ttl: number = this.DEFAULT_TTL): Promise<unknown> {
    const cacheKey = this.getCacheKey(url, options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValid(cached)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 Cache HIT: ${url}`);
      }
      return cached.data;
    }

    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏳ Deduplicating request: ${url}`);
      }
      return pending.promise;
    }

    // Make new request
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 Cache MISS: ${url}`);
    }
    const requestPromise = this.makeRequest(url, options);
    
    // Store pending request for deduplication
    this.pendingRequests.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    try {
      const result = await requestPromise;
      
      // Cache successful result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        expiry: Date.now() + ttl
      });

      return result;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
      
      // Periodic cleanup
      if (Math.random() < 0.1) { // 10% chance
        this.cleanup();
      }
    }
  }

  private async makeRequest(url: string, options?: RequestInit): Promise<unknown> {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Force refresh (bypass cache)
  async refresh(url: string, options?: RequestInit, ttl?: number): Promise<unknown> {
    const cacheKey = this.getCacheKey(url, options);
    this.cache.delete(cacheKey);
    return this.fetch(url, options, ttl);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache stats
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.expiry - Date.now()
      }))
    };
  }
}

// Global cache instance
export const apiCache = new APICache();

// Cached fetch function
export async function cachedFetch(
  url: string, 
  options?: RequestInit, 
  ttl?: number
): Promise<unknown> {
  return apiCache.fetch(url, options, ttl);
}

// Force refresh function
export async function refreshCache(
  url: string, 
  options?: RequestInit, 
  ttl?: number
): Promise<unknown> {
  return apiCache.refresh(url, options, ttl);
}