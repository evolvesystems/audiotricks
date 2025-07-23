import React, { useState, useCallback, useEffect } from 'react';
import { uploadService, UploadProgress } from '../../services/upload';
import { processingService } from '../../services/processing';
import { ApiError } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { UploadDropzone } from './UploadDropzone';
import { UploadProgress } from './UploadProgress';
import { ApiKeyValidator } from './ApiKeyValidator';
import ProcessingOptions from './ProcessingOptions';
import ErrorDisplay from './ErrorDisplay';

interface BackendAudioUploaderProps {
  onUploadComplete?: (upload: any) => void;
  onProcessingComplete?: (result: any) => void;
  onError: (error: string) => void;
  workspaceId: string;
  defaultSettings?: {
    language?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  stage: string;
  file: File | null;
  uploadId: string | null;
  jobId: string | null;
  error: string | null;
}

/**
 * Backend audio uploader component (refactored for CLAUDE.md compliance)
 * Orchestrates file upload, API key validation, and processing workflow
 */
export const BackendAudioUploader: React.FC<BackendAudioUploaderProps> = ({
  onUploadComplete,
  onProcessingComplete,
  onError,
  workspaceId,
  defaultSettings = {}
}) => {
  const { isAuthenticated } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    stage: 'Ready to upload',
    file: null,
    uploadId: null,
    jobId: null,
    error: null
  });

  const [processingOptions, setProcessingOptions] = useState({
    transcribe: true,
    summarize: true,
    analyze: false,
    language: defaultSettings.language || 'auto',
    model: defaultSettings.model || 'whisper-1',
    temperature: defaultSettings.temperature || 0.3,
    maxTokens: defaultSettings.maxTokens || 2000
  });

  const [apiKeysValid, setApiKeysValid] = useState(false);
  const [requiredKeys, setRequiredKeys] = useState<string[]>([]);

  // Determine required API keys based on processing options
  useEffect(() => {
    const keys = [];
    if (processingOptions.transcribe || processingOptions.summarize || processingOptions.analyze) {
      keys.push('openai');
    }
    setRequiredKeys(keys);
  }, [processingOptions]);

  const resetState = useCallback(() => {
    setUploadState({
      status: 'idle',
      progress: 0,
      stage: 'Ready to upload',
      file: null,
      uploadId: null,
      jobId: null,
      error: null
    });
  }, []);

  const handleError = useCallback((error: string | ApiError) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    setUploadState(prev => ({
      ...prev,
      status: 'error',
      error: errorMessage
    }));
    onError(errorMessage);
  }, [onError]);

  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
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

    // Validate file
    if (file.size > 25 * 1024 * 1024) { // 25MB
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

      // Upload file
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
        uploadId: uploadResult.id,
        stage: 'Upload complete!',
        status: 'completed',
        progress: 100
      }));

      // Call the upload complete callback if provided
      if (onUploadComplete) {
        onUploadComplete({
          id: uploadResult.id,
          filename: file.name,
          fileSize: file.size,
          storageUrl: uploadResult.storageUrl,
          cdnUrl: uploadResult.cdnUrl,
          duration: 0 // Will be calculated during processing
        });
      }

      // If processing is also requested, start it
      if (onProcessingComplete && (processingOptions.transcribe || processingOptions.summarize || processingOptions.analyze)) {
        setUploadState(prev => ({
          ...prev,
          stage: 'Starting processing...',
          status: 'processing',
          progress: 0
        }));

        // Start processing
        const operations = [];
        if (processingOptions.transcribe) operations.push('transcribe');
        if (processingOptions.summarize) operations.push('summarize');
        if (processingOptions.analyze) operations.push('analyze');

        const processingResult = await processingService.audio.startProcessing({
          audioUploadId: uploadResult.id,
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

        // Poll for completion
        await pollForCompletion(processingResult.job.jobId);
      }

    } catch (error) {
      handleError(error as Error);
    }
  }, [isAuthenticated, apiKeysValid, processingOptions, workspaceId, handleError]);

  const pollForCompletion = async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes max
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

        if (attempts < maxAttempts && (result.status === 'pending' || result.status === 'processing')) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else if (attempts >= maxAttempts) {
          throw new Error('Processing timeout - please try again');
        }
      } catch (error) {
        handleError(error as Error);
      }
    };

    await poll();
  };

  const cancelUpload = async () => {
    // Cancel logic would go here
    resetState();
  };

  const handleApiKeyValidation = (isValid: boolean, missingKeys: string[]) => {
    setApiKeysValid(isValid);
    if (!isValid && missingKeys.length > 0) {
      setUploadState(prev => ({
        ...prev,
        error: `Missing API keys: ${missingKeys.join(', ')}`
      }));
    } else if (isValid && uploadState.error?.includes('Missing API keys')) {
      setUploadState(prev => ({
        ...prev,
        error: null
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* API Key Validation */}
      {requiredKeys.length > 0 && (
        <ApiKeyValidator
          requiredKeys={requiredKeys}
          onValidationChange={handleApiKeyValidation}
        />
      )}

      {/* Processing Options */}
      <ProcessingOptions
        options={processingOptions}
        onChange={setProcessingOptions}
        disabled={uploadState.status !== 'idle'}
      />

      {/* Upload Area */}
      {uploadState.status === 'idle' ? (
        <UploadDropzone
          onFileDrop={handleFileDrop}
          disabled={!apiKeysValid || !isAuthenticated}
          isUploading={false}
        />
      ) : (
        <UploadProgress
          uploadState={uploadState}
          onCancel={cancelUpload}
          onReset={resetState}
        />
      )}

      {/* Error Display */}
      {uploadState.error && uploadState.status === 'error' && (
        <ErrorDisplay
          error={uploadState.error}
          onRetry={resetState}
        />
      )}
    </div>
  );
};

export default BackendAudioUploader;