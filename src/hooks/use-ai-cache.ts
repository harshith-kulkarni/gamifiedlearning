'use client';

import { useCallback, useRef } from 'react';

// Simple in-memory cache for AI responses
const aiCache = new Map<string, any>();

interface UseAICacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
}

export function useAICache<T>(options: UseAICacheOptions = {}) {
  const { ttl = 5 * 60 * 1000 } = options; // Default 5 minutes
  const cacheRef = useRef(aiCache);

  const get = useCallback((key: string): T | undefined => {
    const cached = cacheRef.current.get(key);
    if (!cached) return undefined;
    
    const { data, timestamp } = cached;
    if (Date.now() - timestamp > ttl) {
      // Expired, remove from cache
      cacheRef.current.delete(key);
      return undefined;
    }
    
    return data;
  }, [ttl]);

  const set = useCallback((key: string, data: T) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const clear = useCallback((key?: string) => {
    if (key) {
      cacheRef.current.delete(key);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  return { get, set, clear };
}