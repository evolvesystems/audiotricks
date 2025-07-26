/**
 * Resource Loading Monitor
 * Tracks and analyzes resource loading performance
 */

import { logger } from '../logger';
import { ResourceTiming } from './types';

export class ResourceMonitor {
  private resourceTimings: ResourceTiming[] = [];
  private observer?: PerformanceObserver;

  /**
   * Start monitoring resource loading
   */
  startMonitoring() {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.resourceTimings.push({
            name: resourceEntry.name,
            duration: resourceEntry.duration,
            transferSize: resourceEntry.transferSize,
            encodedBodySize: resourceEntry.encodedBodySize,
            decodedBodySize: resourceEntry.decodedBodySize,
            type: resourceEntry.initiatorType
          });
        }
      });
      this.observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      logger.error('Failed to start resource monitoring:', error);
    }
  }

  /**
   * Get resource statistics
   */
  getResourceStats() {
    const totalResources = this.resourceTimings.length;
    const totalTransferSize = this.resourceTimings.reduce((sum, r) => sum + r.transferSize, 0);
    const averageResourceDuration = totalResources > 0
      ? this.resourceTimings.reduce((sum, r) => sum + r.duration, 0) / totalResources
      : 0;
    
    const slowestResource = this.resourceTimings.length > 0
      ? this.resourceTimings.reduce((slowest, current) => 
          current.duration > slowest.duration ? current : slowest
        )
      : null;

    return {
      totalResources,
      totalTransferSize,
      averageResourceDuration,
      slowestResource,
      resources: [...this.resourceTimings]
    };
  }

  /**
   * Get resources by type
   */
  getResourcesByType(type: string): ResourceTiming[] {
    return this.resourceTimings.filter(r => r.type === type);
  }

  /**
   * Get slow resources (above threshold)
   */
  getSlowResources(thresholdMs: number = 1000): ResourceTiming[] {
    return this.resourceTimings.filter(r => r.duration > thresholdMs);
  }

  /**
   * Clear collected data
   */
  clear() {
    this.resourceTimings = [];
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.observer?.disconnect();
    this.observer = undefined;
  }
}