/**
 * Upload Orchestrator - Handles file upload workflow and validation
 */

import React from 'react';
import { uploadService } from '../../services/upload';
import { processingService } from '../../services/processing';
import { ApiError } from '../../services/api';

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  stage: string;
  file: File | null;
  uploadId: string | null;
  jobId: string | null;
  error: string | null;
}

interface ProcessingOptions {
  transcribe: boolean;
  summarize: boolean;
  analyze: boolean;
  language: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface UploadOrchestratorProps {
  isAuthenticated: boolean;
  apiKeysValid: boolean;
  processingOptions: ProcessingOptions;
  workspaceId: string;
  setUploadState: React.Dispatch<React.SetStateAction<UploadState>>;
  onUploadComplete?: (upload: any) => void;
  onProcessingComplete?: (result: any) => void;
  onError: (error: string) => void;
  startProcessingPolling: (jobId: string) => Promise<void>;
}

export const useUploadOrchestrator = ({
  isAuthenticated,
  apiKeysValid,
  processingOptions,
  workspaceId,
  setUploadState,
  onUploadComplete,
  onProcessingComplete,
  onError,
  startProcessingPolling
}: UploadOrchestratorProps) => {
  const handleError = (error: string | ApiError) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    setUploadState(prev => ({
      ...prev,
      status: 'error',
      error: errorMessage
    }));
    onError(errorMessage);
  };

  const handleFileDrop = async (acceptedFiles: File[]) => {
    if (!isAuthenticated) {
      handleError('Authentication required for uploads');
      return;
    }

    if (!apiKeysValid) {
      handleError('Please configure required API keys before uploading');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      handleError('File size must be less than 25MB');
      return;
    }

    try {
      setUploadState({
        status: 'uploading',
        progress: 0,
        stage: 'Starting upload...',
        file,
        uploadId: null,
        jobId: null,
        error: null
      });

      const uploadResult = await uploadService.uploadFile(
        file,
        workspaceId,
        (progress: number) => {
          setUploadState(prev => ({
            ...prev,
            progress: progress,
            stage: `Uploading... ${Math.round(progress)}%`
          }));
        }
      );

      setUploadState(prev => ({
        ...prev,
        uploadId: uploadResult,
        stage: 'Upload complete!',
        status: 'completed',
        progress: 100
      }));

      if (onUploadComplete) {
        onUploadComplete({
          id: uploadResult,
          filename: file.name,
          fileSize: file.size,
          storageUrl: '',
          cdnUrl: '',
          duration: 0
        });
      }

      if (onProcessingComplete && (processingOptions.transcribe || processingOptions.summarize || processingOptions.analyze)) {
        setUploadState(prev => ({
          ...prev,
          stage: 'Starting processing...',
          status: 'processing',
          progress: 0
        }));

        const operations = [];
        if (processingOptions.transcribe) operations.push('transcribe');
        if (processingOptions.summarize) operations.push('summarize');
        if (processingOptions.analyze) operations.push('analyze');

        const processingResult = await processingService.audio.startProcessing({
          audioUploadId: uploadResult,
          workspaceId,
          operations,
          config: {
            language: processingOptions.language,
            model: processingOptions.model,
            temperature: processingOptions.temperature,
            maxTokens: processingOptions.maxTokens
          }
        });

        setUploadState(prev => ({
          ...prev,
          jobId: processingResult.job.jobId,
          stage: 'Processing audio...'
        }));

        await startProcessingPolling(processingResult.job.jobId);
      }

    } catch (error) {
      handleError(error instanceof Error ? error.message : String(error));
    }
  };

  return { handleFileDrop };
};