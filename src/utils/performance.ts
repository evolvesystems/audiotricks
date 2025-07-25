/**
 * Performance Monitoring Utilities
 * Provides comprehensive performance tracking and optimization helpers
 */

import { logger } from './logger';

interface PerformanceMetrics {
  timestamp: number;
  navigation?: PerformanceNavigationTiming;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  vitals?: {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    this.setupObservers();
    this.monitorResourceLoading();
    this.trackInitialMetrics();
    
    logger.info('Performance monitoring initialized');
  }

  /**
   * Set up performance observers for Core Web Vitals
   */
  private setupObservers() {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not supported');
      return;
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordVital('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      logger.warn('LCP observer setup failed:', error);
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.recordVital('fid', fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      logger.warn('FID observer setup failed:', error);
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordVital('cls', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      logger.warn('CLS observer setup failed:', error);
    }

    // Navigation timing
    try {
      const navigationObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          this.recordNavigationTiming(entry as PerformanceNavigationTiming);
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      logger.warn('Navigation observer setup failed:', error);
    }
  }

  /**
   * Track initial page load metrics
   */
  private trackInitialMetrics() {
    // Wait for page load to complete
    if (document.readyState === 'complete') {
      this.recordInitialMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.recordInitialMetrics(), 100);
      });
    }
  }

  /**
   * Record initial page load metrics
   */
  private recordInitialMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      // Time to First Byte
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.recordVital('ttfb', ttfb);

      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        this.recordVital('fcp', fcpEntry.startTime);
      }
    }

    // Record memory usage
    this.recordMemoryUsage();
  }

  /**
   * Monitor resource loading performance
   */
  private monitorResourceLoading() {
    // Track slow resources
    const resourceObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        if (entry.duration > 1000) { // Resources taking > 1s
          logger.warn(`Slow resource detected: ${entry.name}`, {
            duration: entry.duration,
            size: (entry as any).transferSize,
            type: (entry as any).initiatorType
          });
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      logger.warn('Resource observer setup failed:', error);
    }
  }

  /**
   * Record a Core Web Vital metric
   */
  private recordVital(name: keyof PerformanceMetrics['vitals'], value: number) {
    const currentMetrics = this.getCurrentMetrics();
    currentMetrics.vitals = currentMetrics.vitals || {};
    currentMetrics.vitals[name] = value;

    // Log significant metrics
    if (name === 'lcp' && value > 2500) {
      logger.warn(`Poor LCP detected: ${value}ms`);
    } else if (name === 'fid' && value > 100) {
      logger.warn(`Poor FID detected: ${value}ms`);
    } else if (name === 'cls' && value > 0.1) {
      logger.warn(`Poor CLS detected: ${value}`);
    }

    logger.info(`Performance vital - ${name.toUpperCase()}: ${value}`);
  }

  /**
   * Record navigation timing metrics
   */
  private recordNavigationTiming(entry: PerformanceNavigationTiming) {
    const currentMetrics = this.getCurrentMetrics();
    currentMetrics.navigation = entry;

    // Log key timing metrics
    logger.info('Page load timing:', {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domProcessing: entry.domComplete - entry.domLoading,
      networkTime: entry.responseEnd - entry.requestStart
    });
  }

  /**
   * Record current memory usage
   */
  private recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const currentMetrics = this.getCurrentMetrics();
      currentMetrics.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };

      // Warn about high memory usage
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        logger.warn(`High memory usage: ${usagePercent.toFixed(1)}%`, currentMetrics.memory);
      }
    }
  }

  /**
   * Get current metrics object
   */
  private getCurrentMetrics(): PerformanceMetrics {
    let current = this.metrics[this.metrics.length - 1];
    if (!current || Date.now() - current.timestamp > 10000) {
      current = { timestamp: Date.now() };
      this.metrics.push(current);
    }
    return current;
  }

  /**
   * Measure the execution time of a function
   */
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return fn().then(
      (result) => {
        const duration = performance.now() - start;
        logger.info(`${name} completed in ${duration.toFixed(2)}ms`);
        return result;
      },
      (error) => {
        const duration = performance.now() - start;
        logger.error(`${name} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      }
    );
  }

  /**
   * Measure synchronous function execution
   */
  measureSync<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      logger.info(`${name} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Create a performance mark
   */
  mark(name: string) {
    try {
      performance.mark(name);
      logger.debug(`Performance mark: ${name}`);
    } catch (error) {
      logger.warn(`Failed to create performance mark: ${name}`, error);
    }
  }

  /**
   * Measure between two performance marks
   */
  measure(name: string, startMark: string, endMark?: string) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      logger.info(`Performance measure - ${name}: ${measure.duration.toFixed(2)}ms`);
      return measure.duration;
    } catch (error) {
      logger.warn(`Failed to create performance measure: ${name}`, error);
      return 0;
    }
  }

  /**
   * Get summary of all recorded metrics
   */
  getSummary(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get latest Core Web Vitals
   */
  getVitals() {
    const latest = this.metrics[this.metrics.length - 1];
    return latest?.vitals || {};
  }

  /**
   * Clean up observers and resources
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
    logger.info('Performance monitoring cleaned up');
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance decorator for measuring method execution time
 */
export function measurePerformance(name?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measureName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function(...args: any[]) {
      const start = performance.now();
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle async methods
        if (result && typeof result.then === 'function') {
          return result.then(
            (value: any) => {
              const duration = performance.now() - start;
              logger.info(`${measureName} completed in ${duration.toFixed(2)}ms`);
              return value;
            },
            (error: any) => {
              const duration = performance.now() - start;
              logger.error(`${measureName} failed after ${duration.toFixed(2)}ms:`, error);
              throw error;
            }
          );
        }
        
        // Handle sync methods
        const duration = performance.now() - start;
        logger.info(`${measureName} completed in ${duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        logger.error(`${measureName} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Hook for measuring React component render performance
 */
export function useMeasureRender(componentName: string) {
  React.useEffect(() => {
    performanceMonitor.mark(`${componentName}-render-start`);
    return () => {
      performanceMonitor.mark(`${componentName}-render-end`);
      performanceMonitor.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
    };
  });
}

// Auto-initialize when in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceMonitor.init();
    });
  } else {
    performanceMonitor.init();
  }
}