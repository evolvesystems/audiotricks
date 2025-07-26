/**
 * Resource Manager - Manages audio, blob, and media resources
 */

import { logger } from '../logger';

export class ResourceManager {
  private blobUrls = new Set<string>();
  private audioContexts = new Set<AudioContext>();
  private mediaStreams = new Set<MediaStream>();
  private audioBuffers = new WeakSet<AudioBuffer>();

  /**
   * Create a blob URL that will be automatically revoked
   */
  createBlobUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.blobUrls.add(url);
    return url;
  }

  /**
   * Revoke a blob URL
   */
  revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url);
    this.blobUrls.delete(url);
  }

  /**
   * Create an AudioContext that will be automatically closed
   */
  createAudioContext(contextOptions?: AudioContextOptions): AudioContext {
    const context = new AudioContext(contextOptions);
    this.audioContexts.add(context);
    return context;
  }

  /**
   * Close and remove an AudioContext
   */
  async closeAudioContext(context: AudioContext): Promise<void> {
    try {
      await context.close();
      this.audioContexts.delete(context);
    } catch (error) {
      logger.error('Failed to close AudioContext:', error);
    }
  }

  /**
   * Register a MediaStream for cleanup
   */
  registerMediaStream(stream: MediaStream): void {
    this.mediaStreams.add(stream);
  }

  /**
   * Stop and remove a MediaStream
   */
  stopMediaStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
    this.mediaStreams.delete(stream);
  }

  /**
   * Register an AudioBuffer for tracking
   */
  registerAudioBuffer(buffer: AudioBuffer): void {
    this.audioBuffers.add(buffer);
  }

  /**
   * Clean up audio-related resources
   */
  async cleanupAudioResources(): Promise<void> {
    // Close all audio contexts
    const contextPromises = Array.from(this.audioContexts).map(context => 
      this.closeAudioContext(context)
    );
    await Promise.all(contextPromises);

    // Stop all media streams
    this.mediaStreams.forEach(stream => this.stopMediaStream(stream));
    
    logger.debug('Audio resources cleaned up');
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    // Revoke all blob URLs
    this.blobUrls.forEach(url => URL.revokeObjectURL(url));
    this.blobUrls.clear();

    // Clean up audio resources
    await this.cleanupAudioResources();

    logger.debug('All resources cleaned up');
  }

  /**
   * Get resource statistics
   */
  getResourceStats() {
    return {
      blobUrls: this.blobUrls.size,
      audioContexts: this.audioContexts.size,
      mediaStreams: this.mediaStreams.size
    };
  }
}