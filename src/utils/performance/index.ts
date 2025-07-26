/**
 * Performance Monitoring System
 * Provides comprehensive performance tracking and optimization
 */

import { logger } from '../logger';
import { WebVitalsMonitor } from './web-vitals';
import { ResourceMonitor } from './resource-monitor';
import { MetricsCollector } from './metrics-collector';
import { PerformanceReport, PerformanceThresholds } from './types';

export * from './types';

class PerformanceMonitor {
  private webVitals = new WebVitalsMonitor();
  private resourceMonitor = new ResourceMonitor();
  private metricsCollector = new MetricsCollector();
  private isInitialized = false;
  private metricsInterval?: NodeJS.Timeout;

  // Default thresholds for performance metrics (in ms)
  private readonly DEFAULT_THRESHOLDS: PerformanceThresholds = {
    fcp: 1800, // First Contentful Paint
    lcp: 2500, // Largest Contentful Paint
    fid: 100,  // First Input Delay
    cls: 0.1,  // Cumulative Layout Shift
    ttfb: 800  // Time to First Byte
  };

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    this.webVitals.init();
    this.resourceMonitor.startMonitoring();
    this.trackInitialMetrics();
    
    // Collect metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.metricsCollector.collectMetrics();
    }, 30000);
    
    logger.info('Performance monitoring initialized');
  }

  /**
   * Track initial page load metrics
   */
  private trackInitialMetrics() {
    if (document.readyState === 'complete') {
      this.onPageLoad();
    } else {
      window.addEventListener('load', () => this.onPageLoad());
    }
  }

  /**
   * Handle page load event
   */
  private onPageLoad() {
    setTimeout(() => {
      const metrics = this.metricsCollector.collectMetrics();
      const report = this.generateReport();
      
      logger.info('Initial performance metrics:', {
        vitals: report.metrics.vitals,
        resources: report.summary
      });
    }, 0);
  }

  /**
   * Generate a comprehensive performance report
   */
  generateReport(): PerformanceReport {
    const metrics = this.metricsCollector.collectMetrics();
    const vitals = this.webVitals.getVitals();
    const resourceStats = this.resourceMonitor.getResourceStats();

    // Add vitals to metrics
    metrics.vitals = vitals;

    return {
      metrics,
      resources: resourceStats.resources,
      summary: {
        totalResources: resourceStats.totalResources,
        totalTransferSize: resourceStats.totalTransferSize,
        averageResourceDuration: resourceStats.averageResourceDuration,
        slowestResource: resourceStats.slowestResource
      }
    };
  }

  /**
   * Check if performance meets thresholds
   */
  checkPerformance(thresholds: PerformanceThresholds = this.DEFAULT_THRESHOLDS): {
    passed: boolean;
    violations: string[];
  } {
    const vitals = this.webVitals.getVitals();
    const violations: string[] = [];

    if (vitals.fcp > thresholds.fcp) {
      violations.push(`FCP (${vitals.fcp.toFixed(2)}ms) exceeds threshold (${thresholds.fcp}ms)`);
    }
    if (vitals.lcp > thresholds.lcp) {
      violations.push(`LCP (${vitals.lcp.toFixed(2)}ms) exceeds threshold (${thresholds.lcp}ms)`);
    }
    if (vitals.fid > thresholds.fid) {
      violations.push(`FID (${vitals.fid.toFixed(2)}ms) exceeds threshold (${thresholds.fid}ms)`);
    }
    if (vitals.cls > thresholds.cls) {
      violations.push(`CLS (${vitals.cls.toFixed(3)}) exceeds threshold (${thresholds.cls})`);
    }
    if (vitals.ttfb > thresholds.ttfb) {
      violations.push(`TTFB (${vitals.ttfb.toFixed(2)}ms) exceeds threshold (${thresholds.ttfb}ms)`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Mark a custom timing event
   */
  mark(name: string) {
    performance.mark(name);
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const measures = performance.getEntriesByName(name, 'measure');
      const lastMeasure = measures[measures.length - 1];
      
      if (lastMeasure) {
        logger.debug(`Performance measure "${name}": ${lastMeasure.duration.toFixed(2)}ms`);
        return lastMeasure.duration;
      }
    } catch (error) {
      logger.error(`Failed to measure "${name}":`, error);
    }
    return null;
  }

  /**
   * Get slow resources
   */
  getSlowResources(thresholdMs: number = 1000) {
    return this.resourceMonitor.getSlowResources(thresholdMs);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return this.metricsCollector.getMetrics();
  }

  /**
   * Export performance data
   */
  exportData() {
    return {
      metrics: this.metricsCollector.exportMetrics(),
      report: this.generateReport()
    };
  }

  /**
   * Cleanup and stop monitoring
   */
  cleanup() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
    
    this.webVitals.cleanup();
    this.resourceMonitor.stopMonitoring();
    this.isInitialized = false;
    
    logger.info('Performance monitoring stopped');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export convenience methods
export const {
  init: initPerformanceMonitoring,
  generateReport: generatePerformanceReport,
  checkPerformance,
  mark: perfMark,
  measure: perfMeasure,
  getSlowResources,
  getAllMetrics: getAllPerformanceMetrics,
  exportData: exportPerformanceData,
  cleanup: cleanupPerformanceMonitoring
} = performanceMonitor;