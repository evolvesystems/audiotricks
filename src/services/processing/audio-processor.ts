/**
 * Audio processing functionality
 */

import { apiClient } from '../api';
import { ProcessAudioRequest, StartProcessingResponse, JobResult } from './types';

export class AudioProcessor {
  /**
   * Start audio processing job
   */
  async startProcessing(request: ProcessAudioRequest): Promise<StartProcessingResponse> {
    try {
      const response = await apiClient.post<StartProcessingResponse>('/processing/audio/start', request);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to start audio processing: ${error}`);
    }
  }

  /**
   * Start transcription only
   */
  async transcribe(
    audioUploadId: string, 
    workspaceId: string, 
    options: {
      language?: string;
      model?: string;
      format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    } = {}
  ): Promise<StartProcessingResponse> {
    return this.startProcessing({
      audioUploadId,
      workspaceId,
      operations: ['transcription'],
      config: options
    });
  }

  /**
   * Start summarization (requires transcription first)
   */
  async summarize(
    audioUploadId: string,
    workspaceId: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<StartProcessingResponse> {
    return this.startProcessing({
      audioUploadId,
      workspaceId,
      operations: ['transcription', 'summary'],
      config: options
    });
  }

  /**
   * Start full analysis (transcription + summary + sentiment)
   */
  async analyzeAudio(
    audioUploadId: string,
    workspaceId: string,
    options: {
      language?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    } = {}
  ): Promise<StartProcessingResponse> {
    return this.startProcessing({
      audioUploadId,
      workspaceId,
      operations: ['transcription', 'summary', 'sentiment', 'keywords'],
      config: options
    });
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<Array<{ code: string; name: string; native: string }>> {
    try {
      const response = await apiClient.get('/processing/languages');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get supported languages: ${error}`);
    }
  }

  /**
   * Get supported models
   */
  async getSupportedModels(): Promise<Array<{ id: string; name: string; description: string; pricing?: number }>> {
    try {
      const response = await apiClient.get('/processing/models');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get supported models: ${error}`);
    }
  }

  /**
   * Validate audio file before processing
   */
  async validateAudioFile(
    audioUploadId: string
  ): Promise<{ 
    valid: boolean; 
    duration?: number; 
    format?: string; 
    size?: number;
    errors?: string[];
  }> {
    try {
      const response = await apiClient.get(`/processing/validate/${audioUploadId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate audio file: ${error}`);
    }
  }

  /**
   * Estimate processing cost
   */
  async estimateCost(request: ProcessAudioRequest): Promise<{
    estimatedCost: number;
    currency: string;
    breakdown: Array<{
      operation: string;
      cost: number;
      units: number;
      unitPrice: number;
    }>;
  }> {
    try {
      const response = await apiClient.post('/processing/estimate-cost', request);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to estimate processing cost: ${error}`);
    }
  }

  /**
   * Get processing queue status
   */
  async getQueueStatus(workspaceId?: string): Promise<{
    queuedJobs: number;
    processingJobs: number;
    estimatedWaitTime: number; // in minutes
    position?: number; // user's position in queue if workspaceId provided
  }> {
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
      const response = await apiClient.get(`/processing/queue${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get queue status: ${error}`);
    }
  }
}