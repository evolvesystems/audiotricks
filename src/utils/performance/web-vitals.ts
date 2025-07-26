/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals metrics
 */

import { logger } from '../logger';

export class WebVitalsMonitor {
  private observers: PerformanceObserver[] = [];
  private vitals = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0
  };

  /**
   * Initialize Web Vitals monitoring
   */
  init() {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not supported');
      return;
    }

    this.observeFCP();
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeTTFB();
  }

  /**
   * Observe First Contentful Paint
   */
  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.vitals.fcp = entry.startTime;
            logger.debug('FCP:', entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Failed to observe FCP:', error);
    }
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.vitals.lcp = lastEntry.startTime;
        logger.debug('LCP:', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Failed to observe LCP:', error);
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const eventEntry = entry as PerformanceEventTiming;
          this.vitals.fid = eventEntry.processingStart - eventEntry.startTime;
          logger.debug('FID:', this.vitals.fid);
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Failed to observe FID:', error);
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
            this.vitals.cls = clsValue;
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Failed to observe CLS:', error);
    }
  }

  /**
   * Observe Time to First Byte
   */
  private observeTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        this.vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        logger.debug('TTFB:', this.vitals.ttfb);
      }
    } catch (error) {
      logger.error('Failed to observe TTFB:', error);
    }
  }

  /**
   * Get current Web Vitals
   */
  getVitals() {
    return { ...this.vitals };
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}