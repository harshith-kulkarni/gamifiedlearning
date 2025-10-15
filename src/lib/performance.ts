/**
 * Performance monitoring utilities
 */
import React, { Suspense } from 'react';

// Performance timing utility
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now();
    
    try {
      const result = await fn();
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
      }
      
      resolve(result);
    } catch (error) {
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
      }
      
      reject(error);
    }
  });
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn);
  
  return function WrappedComponent(props: any) {
    return React.createElement(
      Suspense,
      { fallback: fallback ? React.createElement(fallback) : null },
      React.createElement(LazyComponent, props)
    );
  };
}

// Memory usage monitoring (development only)
export function logMemoryUsage(label: string) {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // @ts-ignore - performance.memory is not in all browsers
    const memory = (performance as any).memory;
    if (memory) {
      console.log(`🧠 ${label} Memory:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Log loaded scripts for bundle analysis
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const totalSize = scripts.reduce((acc, script) => {
      const src = script.getAttribute('src');
      if (src && src.includes('/_next/')) {
        // Estimate size based on script length (rough approximation)
        return acc + (script.innerHTML?.length || 0);
      }
      return acc;
    }, 0);
    
    console.log(`📦 Estimated bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
  }
}