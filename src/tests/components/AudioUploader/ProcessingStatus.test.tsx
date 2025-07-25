/**
 * ProcessingStatus Component Tests
 * Tests for the processing status polling hook and functionality
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { setupMocks, cleanupMocks } from '../../utils/testUtils';
import { useProcessingStatus } from '../../../components/AudioUploader/ProcessingStatus';

// Mock the processing service
const mockProcessingService = {
  jobs: {
    getJob: vi.fn()
  }
};

vi.mock('../../../services/processing', () => ({
  processingService: mockProcessingService
}));

describe('useProcessingStatus Hook', () => {
  const mockSetUploadState = vi.fn();
  const mockOnProcessingComplete = vi.fn();
  const mockOnError = vi.fn();

  const hookProps = {
    setUploadState: mockSetUploadState,
    onProcessingComplete: mockOnProcessingComplete,
    onError: mockOnError
  };

  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanupMocks();
    vi.useRealTimers();
  });

  describe('Error Handling', () => {
    it('should handle error correctly', () => {
      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      act(() => {
        result.current.handleError('Test error message');
      });

      expect(mockSetUploadState).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockOnError).toHaveBeenCalledWith('Test error message');
    });

    it('should set error state when handling error', () => {
      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      act(() => {
        result.current.handleError('Test error');
      });

      const setStateCall = mockSetUploadState.mock.calls[0][0];
      const newState = setStateCall({
        status: 'processing',
        progress: 50,
        stage: 'Processing...',
        file: null,
        uploadId: null,
        jobId: null,
        error: null
      });

      expect(newState).toEqual({
        status: 'error',
        progress: 50,
        stage: 'Processing...',
        file: null,
        uploadId: null,
        jobId: null,
        error: 'Test error'
      });
    });
  });

  describe('Processing Polling', () => {
    it('should start polling when job ID provided', async () => {
      mockProcessingService.jobs.getJob.mockResolvedValue({
        id: 'job-123',
        status: 'processing',
        progress: 25
      });

      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      await act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      expect(mockProcessingService.jobs.getJob).toHaveBeenCalledWith('job-123');
      expect(mockSetUploadState).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update progress during polling', async () => {
      mockProcessingService.jobs.getJob.mockResolvedValue({
        id: 'job-123',
        status: 'processing',
        progress: 75
      });

      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      await act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      const setStateCall = mockSetUploadState.mock.calls[0][0];
      const newState = setStateCall({
        status: 'processing',
        progress: 0,
        stage: 'Starting...',
        file: null,
        uploadId: null,
        jobId: 'job-123',
        error: null
      });

      expect(newState.progress).toBe(75);
      expect(newState.stage).toBe('Processing... 75%');
    });

    it('should handle completed processing', async () => {
      const completedResult = {
        id: 'job-123',
        status: 'completed',
        progress: 100,
        result: {
          transcription: 'Test transcription',
          summary: 'Test summary'
        }
      };

      mockProcessingService.jobs.getJob.mockResolvedValue(completedResult);

      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      await act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      expect(mockSetUploadState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockOnProcessingComplete).toHaveBeenCalledWith(completedResult);
    });

    it('should handle failed processing', async () => {
      mockProcessingService.jobs.getJob.mockResolvedValue({
        id: 'job-123',
        status: 'failed',
        progress: 50,
        error: 'Processing failed'
      });

      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      await act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      expect(mockSetUploadState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockOnError).toHaveBeenCalledWith('Processing failed');
    });

    it('should handle API errors during polling', async () => {
      mockProcessingService.jobs.getJob.mockRejectedValue(
        new Error('API request failed')
      );

      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      await act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get job status')
      );
    });

    it('should timeout after max attempts', async () => {
      // Mock a job that stays in processing state
      mockProcessingService.jobs.getJob.mockResolvedValue({
        id: 'job-123',
        status: 'processing',
        progress: 50
      });

      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      // Start polling
      const pollingPromise = act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      // Fast-forward time to trigger timeout
      for (let i = 0; i < 61; i++) {
        await act(async () => {
          vi.advanceTimersByTime(5000); // 5 second intervals
        });
      }

      await pollingPromise;

      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Processing timeout')
      );
    });

    it('should poll at regular intervals', async () => {
      let callCount = 0;
      mockProcessingService.jobs.getJob.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            id: 'job-123',
            status: 'processing',
            progress: callCount * 25
          });
        } else {
          return Promise.resolve({
            id: 'job-123',
            status: 'completed',
            progress: 100,
            result: { transcription: 'Done' }
          });
        }
      });

      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      const pollingPromise = act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      // Advance timers to trigger multiple polls
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await pollingPromise;

      expect(mockProcessingService.jobs.getJob).toHaveBeenCalledTimes(3);
      expect(mockOnProcessingComplete).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should not call onProcessingComplete if not provided', async () => {
      const propsWithoutCallback = {
        ...hookProps,
        onProcessingComplete: undefined
      };

      mockProcessingService.jobs.getJob.mockResolvedValue({
        id: 'job-123',
        status: 'completed',
        progress: 100,
        result: { transcription: 'Test' }
      });

      const { result } = renderHook(() => useProcessingStatus(propsWithoutCallback));
      
      await act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      // Should not throw error when callback is undefined
      expect(mockSetUploadState).toHaveBeenCalled();
    });

    it('should handle progress values correctly', async () => {
      const testCases = [
        { progress: null, expected: 0 },
        { progress: undefined, expected: 0 },
        { progress: 0, expected: 0 },
        { progress: 50, expected: 50 },
        { progress: 100, expected: 100 }
      ];

      for (const testCase of testCases) {
        mockProcessingService.jobs.getJob.mockResolvedValue({
          id: 'job-123',
          status: 'processing',
          progress: testCase.progress
        });

        const { result } = renderHook(() => useProcessingStatus(hookProps));
        
        await act(async () => {
          await result.current.startProcessingPolling('job-123');
        });

        const setStateCall = mockSetUploadState.mock.calls[0][0];
        const newState = setStateCall({
          status: 'processing',
          progress: 0,
          stage: 'Starting...',
          file: null,
          uploadId: null,
          jobId: 'job-123',
          error: null
        });

        expect(newState.progress).toBe(testCase.expected);
        expect(newState.stage).toBe(`Processing... ${testCase.expected}%`);

        vi.clearAllMocks();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty job ID', async () => {
      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      await act(async () => {
        await result.current.startProcessingPolling('');
      });

      expect(mockProcessingService.jobs.getJob).toHaveBeenCalledWith('');
    });

    it('should handle malformed job response', async () => {
      mockProcessingService.jobs.getJob.mockResolvedValue(null);

      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      await act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid response')
      );
    });

    it('should handle network errors gracefully', async () => {
      mockProcessingService.jobs.getJob.mockRejectedValue(
        new TypeError('Network error')
      );

      const { result } = renderHook(() => useProcessingStatus(hookProps));
      
      await act(async () => {
        await result.current.startProcessingPolling('job-123');
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
    });
  });
});