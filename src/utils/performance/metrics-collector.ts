/**
 * Performance Metrics Collector
 * Collects and manages performance metrics
 */

import { logger } from '../logger';
import { PerformanceMetrics } from './types';

export class MetricsCollector {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 metrics

  /**
   * Collect current performance metrics
   */
  collectMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now()
    };

    // Collect navigation timing
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.navigation = navigationEntry;
    }

    // Collect memory info if available
    if (performance.memory) {
      metrics.memory = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }

    this.addMetric(metrics);
    return metrics;
  }

  /**
   * Add a metric to the collection
   */
  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics within a time range
   */
  getMetricsInRange(startTime: number, endTime: number): PerformanceMetrics[] {
    return this.metrics.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Get the latest metric
   */
  getLatestMetric(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Calculate average memory usage
   */
  getAverageMemoryUsage(): number | null {
    const metricsWithMemory = this.metrics.filter(m => m.memory);
    if (metricsWithMemory.length === 0) return null;

    const totalUsed = metricsWithMemory.reduce((sum, m) => 
      sum + (m.memory?.usedJSHeapSize || 0), 0
    );
    
    return totalUsed / metricsWithMemory.length;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}