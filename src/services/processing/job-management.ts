/**
 * Job management functionality for processing service
 */

import { apiClient, ProcessingJob, PaginatedResponse } from '../api';
import { JobResult, JobListParams, ProcessingStats, JobStatusUpdate } from './types';

export class JobManager {
  /**
   * Get job status and result
   */
  async getJob(jobId: string): Promise<JobResult> {
    try {
      const response = await apiClient.get<JobResult>(`/processing/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get job status: ${error}`);
    }
  }

  /**
   * List processing jobs with pagination and filtering
   */
  async listJobs(params: JobListParams = {}): Promise<PaginatedResponse<ProcessingJob>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.workspaceId) queryParams.append('workspaceId', params.workspaceId);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await apiClient.get<PaginatedResponse<ProcessingJob>>(
        `/processing/jobs?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list jobs: ${error}`);
    }
  }

  /**
   * Cancel a processing job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      await apiClient.delete(`/processing/jobs/${jobId}`);
    } catch (error) {
      throw new Error(`Failed to cancel job: ${error}`);
    }
  }

  /**
   * Restart a failed job
   */
  async restartJob(jobId: string): Promise<JobResult> {
    try {
      const response = await apiClient.post<JobResult>(`/processing/jobs/${jobId}/restart`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to restart job: ${error}`);
    }
  }

  /**
   * Get processing statistics
   */
  async getStats(workspaceId?: string): Promise<ProcessingStats> {
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
      const response = await apiClient.get<ProcessingStats>(`/processing/stats${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get processing stats: ${error}`);
    }
  }

  /**
   * Subscribe to job status updates (WebSocket)
   */
  subscribeToJobUpdates(
    jobId: string, 
    onUpdate: (update: JobStatusUpdate) => void,
    onError?: (error: Error) => void
  ): () => void {
    // WebSocket connection for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/processing/jobs/${jobId}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const update: JobStatusUpdate = JSON.parse(event.data);
        onUpdate(update);
      } catch (error) {
        onError?.(new Error('Failed to parse job update'));
      }
    };
    
    ws.onerror = () => {
      onError?.(new Error('WebSocket connection error'));
    };
    
    // Return cleanup function
    return () => {
      ws.close();
    };
  }

  /**
   * Download job result in specific format
   */
  async downloadJobResult(jobId: string, format: 'json' | 'txt' | 'srt' | 'vtt' = 'json'): Promise<Blob> {
    try {
      const response = await apiClient.get(`/processing/jobs/${jobId}/download`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download job result: ${error}`);
    }
  }

  /**
   * Bulk cancel multiple jobs
   */
  async cancelJobs(jobIds: string[]): Promise<{ succeeded: string[]; failed: string[] }> {
    try {
      const response = await apiClient.post('/processing/jobs/bulk-cancel', { jobIds });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to bulk cancel jobs: ${error}`);
    }
  }
}