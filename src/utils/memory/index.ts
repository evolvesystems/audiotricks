/**
 * Memory Management System
 * Provides memory leak prevention and resource cleanup
 */

import { CleanupRegistry } from './cleanup-registry';
import { MemoryMonitor } from './memory-monitor';
import { ResourceManager } from './resource-manager';
import { MemoryMonitorOptions } from './types';

export * from './types';

class MemoryManager {
  private cleanupRegistry = new CleanupRegistry();
  private memoryMonitor = new MemoryMonitor();
  private resourceManager = new ResourceManager();

  // Delegate cleanup registry methods
  registerCleanup = this.cleanupRegistry.registerCleanup.bind(this.cleanupRegistry);
  setTimeout = this.cleanupRegistry.setTimeout.bind(this.cleanupRegistry);
  setInterval = this.cleanupRegistry.setInterval.bind(this.cleanupRegistry);
  clearTimeout = this.cleanupRegistry.clearTimeout.bind(this.cleanupRegistry);
  clearInterval = this.cleanupRegistry.clearInterval.bind(this.cleanupRegistry);
  addEventListener = this.cleanupRegistry.addEventListener.bind(this.cleanupRegistry);
  removeEventListener = this.cleanupRegistry.removeEventListener.bind(this.cleanupRegistry);
  createAbortController = this.cleanupRegistry.createAbortController.bind(this.cleanupRegistry);
  registerObserver = this.cleanupRegistry.registerObserver.bind(this.cleanupRegistry);

  // Delegate memory monitor methods
  getMemoryStats = this.memoryMonitor.getMemoryStats.bind(this.memoryMonitor);
  startMonitoring = this.memoryMonitor.startMonitoring.bind(this.memoryMonitor);
  stopMonitoring = this.memoryMonitor.stopMonitoring.bind(this.memoryMonitor);
  forceGarbageCollection = this.memoryMonitor.forceGarbageCollection.bind(this.memoryMonitor);
  logMemoryUsage = this.memoryMonitor.logMemoryUsage.bind(this.memoryMonitor);

  // Delegate resource manager methods
  createBlobUrl = this.resourceManager.createBlobUrl.bind(this.resourceManager);
  revokeBlobUrl = this.resourceManager.revokeBlobUrl.bind(this.resourceManager);
  createAudioContext = this.resourceManager.createAudioContext.bind(this.resourceManager);
  closeAudioContext = this.resourceManager.closeAudioContext.bind(this.resourceManager);
  registerMediaStream = this.resourceManager.registerMediaStream.bind(this.resourceManager);
  stopMediaStream = this.resourceManager.stopMediaStream.bind(this.resourceManager);
  registerAudioBuffer = this.resourceManager.registerAudioBuffer.bind(this.resourceManager);

  /**
   * Clean up all resources and stop monitoring
   */
  async cleanup(): Promise<void> {
    this.stopMonitoring();
    this.cleanupRegistry.cleanup();
    await this.resourceManager.cleanup();
  }

  /**
   * Get overall system statistics
   */
  getStats() {
    return {
      memory: this.getMemoryStats(),
      resources: this.resourceManager.getResourceStats()
    };
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager();

// Export convenience methods
export const {
  registerCleanup,
  setTimeout: managedSetTimeout,
  setInterval: managedSetInterval,
  clearTimeout: managedClearTimeout,
  clearInterval: managedClearInterval,
  addEventListener: managedAddEventListener,
  removeEventListener: managedRemoveEventListener,
  createAbortController,
  registerObserver,
  getMemoryStats,
  startMonitoring,
  stopMonitoring,
  forceGarbageCollection,
  logMemoryUsage,
  createBlobUrl,
  revokeBlobUrl,
  createAudioContext,
  closeAudioContext,
  registerMediaStream,
  stopMediaStream,
  registerAudioBuffer,
  cleanup,
  getStats
} = memoryManager;