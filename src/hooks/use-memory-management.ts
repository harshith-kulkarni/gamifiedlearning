'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EventListenerManager, logMemoryUsage } from '@/lib/utils/performance';

interface UseMemoryManagementOptions {
  enableLogging?: boolean;
  cleanupInterval?: number;
  maxCacheSize?: number;
}

export function useMemoryManagement(options: UseMemoryManagementOptions = {}) {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    cleanupInterval: cleanupIntervalMs = 30000, // 30 seconds
    maxCacheSize = 100,
  } = options;

  const eventManager = useRef(new EventListenerManager());
  const cache = useRef(new Map<string, any>());
  const timers = useRef(new Set<NodeJS.Timeout>());
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add event listener with automatic cleanup
  const addEventListenerWithCleanup = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    eventManager.current.add(element, event, handler, options);
  }, []);

  // Cache management with size limits
  const setCache = useCallback((key: string, value: any) => {
    if (cache.current.size >= maxCacheSize) {
      // Remove oldest entry
      const firstKey = cache.current.keys().next().value;
      if (firstKey) {
        cache.current.delete(firstKey);
      }
    }
    cache.current.set(key, value);
  }, [maxCacheSize]);

  const getCache = useCallback((key: string) => {
    return cache.current.get(key);
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, [enableLogging]);

  // Timer management
  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    timers.current.add(timer);
    return timer;
  }, []);

  const clearTimer = useCallback((timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    timers.current.delete(timer);
  }, []);

  const clearAllTimers = useCallback(() => {
    timers.current.forEach(timer => clearTimeout(timer));
    timers.current.clear();
  }, []);

  // Memory cleanup function
  const performCleanup = useCallback(() => {
    // Clear expired cache entries
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    cache.current.forEach((value, key) => {
      if (value && typeof value === 'object' && value.expiry && now > value.expiry) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => cache.current.delete(key));

    // Log memory usage if enabled
    if (enableLogging) {
      logMemoryUsage('Memory cleanup performed');
    }

    // Force garbage collection in development (if available)
    if (enableLogging && typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }, [enableLogging]);

  // Set up periodic cleanup
  useEffect(() => {
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
    }

    cleanupIntervalRef.current = setInterval(performCleanup, cleanupIntervalMs);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [performCleanup, cleanupIntervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove all event listeners
      eventManager.current.removeAll();
      
      // Clear all timers
      clearAllTimers();
      
      // Clear cache
      clearCache();
      
      // Clear cleanup interval
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }

      if (enableLogging) {
        logMemoryUsage('Component unmounted - cleanup performed');
      }
    };
  }, [clearAllTimers, clearCache, enableLogging]);

  return {
    addEventListenerWithCleanup,
    setCache,
    getCache,
    clearCache,
    addTimer,
    clearTimer,
    clearAllTimers,
    performCleanup,
  };
}

// Hook for managing component lifecycle and preventing memory leaks
export function useComponentLifecycle(componentName: string) {
  const mounted = useRef(true);
  const { performCleanup } = useMemoryManagement({ enableLogging: true });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logMemoryUsage(`${componentName} mount`);
    }

    return () => {
      mounted.current = false;
      performCleanup();
      
      if (process.env.NODE_ENV === 'development') {
        logMemoryUsage(`${componentName} unmount`);
      }
    };
  }, [componentName, performCleanup]);

  const isMounted = useCallback(() => mounted.current, []);

  return { isMounted };
}

// Hook for managing large datasets (like flashcards)
export function useDatasetManagement<T>(
  data: T[],
  options: {
    pageSize?: number;
    enableVirtualization?: boolean;
    cacheKey?: string;
  } = {}
) {
  const {
    pageSize = 50,
    enableVirtualization = true,
    cacheKey = 'dataset',
  } = options;

  const { setCache } = useMemoryManagement();
  const currentPage = useRef(0);
  const virtualizedData = useRef<T[]>([]);

  // Get current page of data
  const getCurrentPageData = useCallback(() => {
    if (!enableVirtualization) {
      return data;
    }

    const start = currentPage.current * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, pageSize, enableVirtualization]);

  // Load next page
  const loadNextPage = useCallback(() => {
    if (!enableVirtualization) return;

    const maxPage = Math.ceil(data.length / pageSize) - 1;
    if (currentPage.current < maxPage) {
      currentPage.current += 1;
      const newData = getCurrentPageData();
      virtualizedData.current = [...virtualizedData.current, ...newData];
      
      // Cache the current state
      setCache(`${cacheKey}_page_${currentPage.current}`, newData);
    }
  }, [data.length, pageSize, enableVirtualization, getCurrentPageData, setCache, cacheKey]);

  // Reset pagination
  const resetPagination = useCallback(() => {
    currentPage.current = 0;
    virtualizedData.current = getCurrentPageData();
  }, [getCurrentPageData]);

  // Initialize
  useEffect(() => {
    resetPagination();
  }, [resetPagination]);

  return {
    currentData: enableVirtualization ? virtualizedData.current : data,
    loadNextPage,
    resetPagination,
    hasNextPage: enableVirtualization ? currentPage.current < Math.ceil(data.length / pageSize) - 1 : false,
    currentPage: currentPage.current,
    totalPages: Math.ceil(data.length / pageSize),
  };
}