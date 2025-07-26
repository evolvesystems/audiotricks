/**
 * Memory Management Types
 */

export interface CleanupFunction {
  (): void;
}

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
}

export interface MemoryThresholds {
  warning: number;
  critical: number;
}

export interface MemoryMonitorOptions {
  interval?: number;
  thresholds?: MemoryThresholds;
  onWarning?: (stats: MemoryStats) => void;
  onCritical?: (stats: MemoryStats) => void;
}