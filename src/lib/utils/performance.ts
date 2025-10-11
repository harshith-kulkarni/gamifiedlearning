/**
 * Performance optimization utilities for flashcard system
 */

// Debounce function to prevent excessive API calls
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

// Throttle function for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Request animation frame wrapper for smooth animations
export function requestAnimationFramePromise(): Promise<number> {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

// Batch DOM updates to prevent layout thrashing
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

// Memory cleanup utility for event listeners
export class EventListenerManager {
  private listeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }> = [];

  add(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }

  removeAll(): void {
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.listeners = [];
  }
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// Preload images for smooth transitions
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// CSS animation utilities
export const animationClasses = {
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-300',
  slideInLeft: 'animate-in slide-in-from-left duration-300',
  slideInRight: 'animate-in slide-in-from-right duration-300',
  slideOutLeft: 'animate-out slide-out-to-left duration-300',
  slideOutRight: 'animate-out slide-out-to-right duration-300',
  scaleIn: 'animate-in zoom-in duration-300',
  scaleOut: 'animate-out zoom-out duration-300',
  flipIn: 'animate-in flip-in duration-700',
  flipOut: 'animate-out flip-out duration-700',
} as const;

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}

// Memory usage monitoring (development only)
export function logMemoryUsage(label: string): void {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`${label} - Memory Usage:`, {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
    });
  }
}

// React performance utilities
export function shouldComponentUpdate<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  keys?: (keyof T)[]
): boolean {
  const keysToCheck = keys || Object.keys(nextProps);
  
  return keysToCheck.some(key => {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];
    
    // Handle arrays and objects
    if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
      return prevValue.length !== nextValue.length || 
             prevValue.some((item: any, index: number) => item !== nextValue[index]);
    }
    
    if (typeof prevValue === 'object' && typeof nextValue === 'object') {
      return JSON.stringify(prevValue) !== JSON.stringify(nextValue);
    }
    
    return prevValue !== nextValue;
  });
}