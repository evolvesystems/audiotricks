/**
 * Memory Management Utilities
 * Provides memory leak prevention and cleanup helpers
 */

import { logger } from './logger';

interface CleanupFunction {
  (): void;
}

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
}

class MemoryManager {
  private cleanupFunctions = new Set<CleanupFunction>();
  private timers = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timeout>();
  private eventListeners = new Map<EventTarget, Map<string, EventListener>>();
  private observers = new Set<IntersectionObserver | MutationObserver | ResizeObserver>();
  private abortControllers = new Set<AbortController>();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  /**
   * Register a cleanup function to be called when cleaning up
   */
  registerCleanup(cleanupFn: CleanupFunction): () => void {
    this.cleanupFunctions.add(cleanupFn);
    return () => this.cleanupFunctions.delete(cleanupFn);
  }

  /**
   * Create a timeout that will be automatically cleaned up
   */
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);
    
    this.timers.add(timerId);
    return timerId;
  }

  /**
   * Create an interval that will be automatically cleaned up
   */
  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const intervalId = setInterval(callback, delay);
    this.intervals.add(intervalId);
    return intervalId;
  }

  /**
   * Add event listener that will be automatically cleaned up
   */
  addEventListener<K extends keyof WindowEventMap>(
    target: Window,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener<K extends keyof DocumentEventMap>(
    target: Document,
    type: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);

    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map());
    }
    this.eventListeners.get(target)!.set(type, listener);
  }

  /**
   * Create an AbortController that will be automatically cleaned up
   */
  createAbortController(): AbortController {
    const controller = new AbortController();
    this.abortControllers.add(controller);
    
    // Remove from set when aborted
    controller.signal.addEventListener('abort', () => {
      this.abortControllers.delete(controller);
    });
    
    return controller;
  }

  /**
   * Register an observer that will be automatically cleaned up
   */
  registerObserver(observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    this.observers.add(observer);
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryStats(): MemoryStats | null {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }

  /**
   * Start monitoring memory usage
   */
  startMemoryMonitoring(options: {
    interval?: number;
    threshold?: number;
    onThresholdExceeded?: (stats: MemoryStats) => void;
  } = {}) {
    if (this.isMonitoring) return;

    const { interval = 30000, threshold = 80, onThresholdExceeded } = options;
    this.isMonitoring = true;

    this.monitoringInterval = this.setInterval(() => {
      const stats = this.getMemoryStats();
      if (stats) {
        if (stats.usagePercent > threshold) {
          logger.warn('High memory usage detected:', {
            usagePercent: stats.usagePercent.toFixed(2),
            usedMB: (stats.usedJSHeapSize / 1024 / 1024).toFixed(2),
            limitMB: (stats.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
          });

          if (onThresholdExceeded) {
            onThresholdExceeded(stats);
          }
        }

        // Log memory stats periodically
        if (stats.usagePercent > 50) {
          logger.info('Memory usage:', {
            usagePercent: stats.usagePercent.toFixed(2),
            usedMB: (stats.usedJSHeapSize / 1024 / 1024).toFixed(2)
          });
        }
      }
    }, interval);
  }

  /**
   * Stop memory monitoring
   */
  stopMemoryMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      logger.info('Forcing garbage collection');
      (window as any).gc();
    } else {
      logger.warn('Garbage collection not available');
    }
  }

  /**
   * Clean up all registered resources
   */
  cleanup(): void {
    logger.info('Starting memory cleanup', {
      cleanupFunctions: this.cleanupFunctions.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
      eventListeners: this.eventListeners.size,
      observers: this.observers.size,
      abortControllers: this.abortControllers.size
    });

    // Call all registered cleanup functions
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.error('Error in cleanup function:', error);
      }
    });
    this.cleanupFunctions.clear();

    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Remove all event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, type) => {
        try {
          target.removeEventListener(type, listener);
        } catch (error) {
          logger.error('Error removing event listener:', error);
        }
      });
    });
    this.eventListeners.clear();

    // Disconnect all observers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        logger.error('Error disconnecting observer:', error);
      }
    });
    this.observers.clear();

    // Abort all controllers
    this.abortControllers.forEach(controller => {
      try {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      } catch (error) {
        logger.error('Error aborting controller:', error);
      }
    });
    this.abortControllers.clear();

    // Stop memory monitoring
    this.stopMemoryMonitoring();

    logger.info('Memory cleanup completed');
  }

  /**
   * Clear specific timer
   */
  clearTimeout(timerId: NodeJS.Timeout): void {
    clearTimeout(timerId);
    this.timers.delete(timerId);
  }

  /**
   * Clear specific interval
   */
  clearInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }
}

// Create singleton instance
export const memoryManager = new MemoryManager();

/**
 * React hook for automatic cleanup
 */
export function useMemoryCleanup(cleanupFn: CleanupFunction) {
  React.useEffect(() => {
    return memoryManager.registerCleanup(cleanupFn);
  }, [cleanupFn]);
}

/**
 * React hook for managed timers
 */
export function useManagedTimeout(callback: () => void, delay: number | null) {
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (delay === null) return;

    const id = memoryManager.setTimeout(() => savedCallback.current(), delay);
    return () => memoryManager.clearTimeout(id);
  }, [delay]);
}

/**
 * React hook for managed intervals
 */
export function useManagedInterval(callback: () => void, delay: number | null) {
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (delay === null) return;

    const id = memoryManager.setInterval(() => savedCallback.current(), delay);
    return () => memoryManager.clearInterval(id);
  }, [delay]);
}

/**
 * React hook for managed event listeners
 */
export function useManagedEventListener<K extends keyof WindowEventMap>(
  target: Window | null,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void;
export function useManagedEventListener<K extends keyof DocumentEventMap>(
  target: Document | null,
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void;
export function useManagedEventListener(
  target: EventTarget | null,
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
): void;
export function useManagedEventListener(
  target: EventTarget | null,
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
): void {
  React.useEffect(() => {
    if (!target) return;

    memoryManager.addEventListener(target, type, listener, options);

    return () => {
      target.removeEventListener(type, listener, options);
    };
  }, [target, type, listener, options]);
}

/**
 * React hook for managed AbortController
 */
export function useManagedAbortController(): AbortController {
  const [controller] = React.useState(() => memoryManager.createAbortController());

  React.useEffect(() => {
    return () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    };
  }, [controller]);

  return controller;
}

/**
 * Higher-order component that provides automatic cleanup
 */
export function withMemoryCleanup<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function MemoryCleanupWrapper(props: P) {
    React.useEffect(() => {
      return () => {
        // Cleanup when component unmounts
        memoryManager.cleanup();
      };
    }, []);

    return <WrappedComponent {...props} />;
  };
}

// Auto-start memory monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  memoryManager.startMemoryMonitoring({
    threshold: 70,
    onThresholdExceeded: (stats) => {
      console.warn('High memory usage detected:', stats);
    }
  });
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryManager.cleanup();
  });
}