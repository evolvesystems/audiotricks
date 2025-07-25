/**
 * Processing Status - Handles processing status polling and completion
 */

import React from 'react';
import { processingService } from '../../services/processing';

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  stage: string;
  file: File | null;
  uploadId: string | null;
  jobId: string | null;
  error: string | null;
}

interface ProcessingStatusProps {
  setUploadState: React.Dispatch<React.SetStateAction<UploadState>>;
  onProcessingComplete?: (result: any) => void;
  onError: (error: string) => void;
}

export const useProcessingStatus = ({
  setUploadState,
  onProcessingComplete,
  onError
}: ProcessingStatusProps) => {
  const handleError = (error: string) => {
    setUploadState(prev => ({
      ...prev,
      status: 'error',
      error: error
    }));
    onError(error);
  };

  const startProcessingPolling = async (jobId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const result = await processingService.jobs.getJob(jobId);
        
        setUploadState(prev => ({
          ...prev,
          progress: result.progress || 0,
          stage: `Processing... ${Math.round(result.progress || 0)}%`
        }));

        if (result.status === 'completed') {
          setUploadState(prev => ({
            ...prev,
            status: 'completed',
            progress: 100,
            stage: 'Processing complete!'
          }));
          if (onProcessingComplete) {
            onProcessingComplete(result.result);
          }
          return;
        }

        if (result.status === 'failed') {
          throw new Error(result.error || 'Processing failed');
        }

        if (attempts < maxAttempts && (result.status === 'queued' || result.status === 'processing')) {
          attempts++;
          setTimeout(poll, 5000);
        } else if (attempts >= maxAttempts) {
          throw new Error('Processing timeout - please try again');
        }
      } catch (error) {
        handleError(error instanceof Error ? error.message : String(error));
      }
    };

    await poll();
  };

  return { startProcessingPolling };
};