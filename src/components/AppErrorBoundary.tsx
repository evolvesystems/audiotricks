/**
 * Application-level Error Boundary
 * Wraps the entire application with error handling and performance monitoring
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  private performanceObserver: PerformanceObserver | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };

    // Initialize performance monitoring
    this.initializePerformanceMonitoring();
  }

  componentDidMount() {
    // Add global error listeners
    this.addGlobalErrorListeners();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  componentWillUnmount() {
    // Cleanup listeners
    this.removeGlobalErrorListeners();
    
    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `app-error-${Date.now()}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `app-error-${Date.now()}`;
    
    // Log comprehensive error information
    logger.error('Application Error Boundary caught error:', {
      errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      memoryUsage: this.getMemoryUsage(),
      performance: this.getPerformanceMetrics()
    });

    // Report to external error tracking service
    this.reportToErrorService(error, errorInfo, errorId);
  }

  private initializePerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.logNavigationTiming(entry as PerformanceNavigationTiming);
            } else if (entry.entryType === 'largest-contentful-paint') {
              this.logLCP(entry);
            } else if (entry.entryType === 'first-input') {
              this.logFID(entry);
            } else if (entry.entryType === 'layout-shift') {
              this.logCLS(entry);
            }
          }
        });

        // Observe different performance metrics
        this.performanceObserver.observe({ 
          entryTypes: ['navigation', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
        });
      } catch (error) {
        logger.warn('Performance Observer not supported:', error);
      }
    }
  }

  private addGlobalErrorListeners() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Handle resource loading errors
    window.addEventListener('error', this.handleResourceError, true);
  }

  private removeGlobalErrorListeners() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleResourceError, true);
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    logger.error('Unhandled Promise Rejection:', {
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString()
    });

    // Prevent the default browser console error
    event.preventDefault();
  };

  private handleResourceError = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target && target !== window) {
      logger.error('Resource loading error:', {
        tagName: target.tagName,
        src: (target as any).src || (target as any).href,
        message: event.type,
        timestamp: new Date().toISOString()
      });
    }
  };

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usagePercent > 80) {
          logger.warn('High memory usage detected:', {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            usagePercent: usagePercent.toFixed(2)
          });
        }
      };

      // Check memory usage every 30 seconds
      setInterval(checkMemory, 30000);
    }
  }

  private getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  private getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      };
    }
    return null;
  }

  private getFirstPaint(): number | null {
    const entry = performance.getEntriesByName('first-paint')[0];
    return entry ? entry.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const entry = performance.getEntriesByName('first-contentful-paint')[0];
    return entry ? entry.startTime : null;
  }

  private logNavigationTiming(entry: PerformanceNavigationTiming) {
    logger.info('Navigation timing:', {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
      loadComplete: entry.loadEventEnd - entry.navigationStart,
      firstByte: entry.responseStart - entry.navigationStart,
      domProcessing: entry.domComplete - entry.domLoading
    });
  }

  private logLCP(entry: PerformanceEntry) {
    logger.info('Largest Contentful Paint:', {
      value: entry.startTime,
      element: (entry as any).element?.tagName || 'unknown'
    });
  }

  private logFID(entry: PerformanceEntry) {
    logger.info('First Input Delay:', {
      value: (entry as any).processingStart - entry.startTime
    });
  }

  private logCLS(entry: PerformanceEntry) {
    if ((entry as any).hadRecentInput) return; // Ignore user-initiated shifts
    
    logger.info('Cumulative Layout Shift:', {
      value: (entry as any).value,
      sources: (entry as any).sources?.map((source: any) => ({
        element: source.node?.tagName || 'unknown',
        currentRect: source.currentRect,
        previousRect: source.previousRect
      }))
    });
  }

  private reportToErrorService(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // Report to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          errorBoundary: 'AppErrorBoundary',
          errorId
        },
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          },
          performance: this.getPerformanceMetrics(),
          memory: this.getMemoryUsage()
        }
      });
    }

    // You could also report to other services here
    // Example: LogRocket, Bugsnag, etc.
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundary
          fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  AudioTricks Encountered an Error
                </h1>
                
                <p className="text-gray-600 mb-6">
                  We've encountered an unexpected error and our team has been notified. 
                  Your session information has been preserved.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
                  >
                    Reload Application
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
                  >
                    Return to Homepage
                  </button>
                </div>

                {this.state.errorId && (
                  <p className="mt-6 text-xs text-gray-500">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
            </div>
          }
        >
          {this.props.children}
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        {this.props.children}
      </ErrorBoundary>
    );
  }
}