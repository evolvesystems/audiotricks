/**
 * Memory Monitor - Tracks memory usage and provides warnings
 */

import { logger } from '../logger';
import { MemoryStats, MemoryMonitorOptions } from './types';

export class MemoryMonitor {
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private readonly DEFAULT_INTERVAL = 30000; // 30 seconds
  private readonly DEFAULT_THRESHOLDS = {
    warning: 70,
    critical: 90
  };

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats | null {
    if (!performance.memory) {
      return null;
    }

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const usagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;

    return {
      usedJSHeapSize,
      totalJSHeapSize,
      jsHeapSizeLimit,
      usagePercent
    };
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(options: MemoryMonitorOptions = {}): void {
    if (this.isMonitoring) {
      return;
    }

    const {
      interval = this.DEFAULT_INTERVAL,
      thresholds = this.DEFAULT_THRESHOLDS,
      onWarning,
      onCritical
    } = options;

    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats();
      if (!stats) return;

      if (stats.usagePercent >= thresholds.critical) {
        logger.error('Critical memory usage detected', {
          usagePercent: stats.usagePercent.toFixed(2),
          usedMB: (stats.usedJSHeapSize / 1024 / 1024).toFixed(2),
          limitMB: (stats.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
        });
        onCritical?.(stats);
      } else if (stats.usagePercent >= thresholds.warning) {
        logger.warn('High memory usage detected', {
          usagePercent: stats.usagePercent.toFixed(2),
          usedMB: (stats.usedJSHeapSize / 1024 / 1024).toFixed(2)
        });
        onWarning?.(stats);
      }
    }, interval);
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): void {
    if ('gc' in globalThis && typeof (globalThis as any).gc === 'function') {
      try {
        (globalThis as any).gc();
        logger.debug('Forced garbage collection');
      } catch (error) {
        logger.error('Failed to force garbage collection:', error);
      }
    }
  }

  /**
   * Log current memory usage
   */
  logMemoryUsage(label?: string): void {
    const stats = this.getMemoryStats();
    if (!stats) {
      logger.debug('Memory API not available');
      return;
    }

    const prefix = label ? `[${label}] ` : '';
    logger.debug(`${prefix}Memory usage:`, {
      usedMB: (stats.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (stats.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limitMB: (stats.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      usagePercent: stats.usagePercent.toFixed(2)
    });
  }
}