/**
 * Performance Monitoring Types
 */

export interface PerformanceMetrics {
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

export interface ResourceTiming {
  name: string;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  type: string;
}

export interface PerformanceThresholds {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

export interface PerformanceReport {
  metrics: PerformanceMetrics;
  resources: ResourceTiming[];
  summary: {
    totalResources: number;
    totalTransferSize: number;
    averageResourceDuration: number;
    slowestResource: ResourceTiming | null;
  };
}