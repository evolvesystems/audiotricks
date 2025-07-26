/**
 * Cleanup Registry - Manages cleanup functions and resources
 */

import { CleanupFunction } from './types';

export class CleanupRegistry {
  private cleanupFunctions = new Set<CleanupFunction>();
  private timers = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timeout>();
  private eventListeners = new Map<EventTarget, Map<string, EventListener>>();
  private observers = new Set<IntersectionObserver | MutationObserver | ResizeObserver>();
  private abortControllers = new Set<AbortController>();

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
   * Clear a managed timeout
   */
  clearTimeout(timerId: NodeJS.Timeout): void {
    clearTimeout(timerId);
    this.timers.delete(timerId);
  }

  /**
   * Clear a managed interval
   */
  clearInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }

  /**
   * Add an event listener that will be automatically cleaned up
   */
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): () => void {
    target.addEventListener(type, listener, options);
    
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map());
    }
    
    this.eventListeners.get(target)!.set(type, listener);
    
    return () => this.removeEventListener(target, type, listener);
  }

  /**
   * Remove a managed event listener
   */
  removeEventListener(target: EventTarget, type: string, listener: EventListener): void {
    target.removeEventListener(type, listener);
    
    const targetListeners = this.eventListeners.get(target);
    if (targetListeners) {
      targetListeners.delete(type);
      if (targetListeners.size === 0) {
        this.eventListeners.delete(target);
      }
    }
  }

  /**
   * Create an AbortController that will be automatically cleaned up
   */
  createAbortController(): AbortController {
    const controller = new AbortController();
    this.abortControllers.add(controller);
    return controller;
  }

  /**
   * Register an observer that will be automatically cleaned up
   */
  registerObserver<T extends IntersectionObserver | MutationObserver | ResizeObserver>(observer: T): T {
    this.observers.add(observer);
    return observer;
  }

  /**
   * Clean up all registered resources
   */
  cleanup(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Remove all event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, type) => {
        target.removeEventListener(type, listener);
      });
    });
    this.eventListeners.clear();
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Abort all controllers
    this.abortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.abortControllers.clear();
    
    // Call all cleanup functions
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    this.cleanupFunctions.clear();
  }
}