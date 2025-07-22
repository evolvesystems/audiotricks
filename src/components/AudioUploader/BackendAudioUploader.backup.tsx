import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import UploadService, { ChunkUploadProgress } from '../../services/upload.service';
import ProcessingService from '../../services/processing.service';
import ApiKeyService from '../../services/apikey.service';
import { ApiError } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ProcessingOptions from './ProcessingOptions';
import ErrorDisplay from './ErrorDisplay';
import { logger } from '../../utils/logger';

interface BackendAudioUploaderProps {
  onProcessingComplete: (result: any) => void;
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

export const BackendAudioUploader: React.FC<BackendAudioUploaderProps> = ({
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
    jobType: 'transcription' as 'transcription' | 'summary' | 'analysis',
    language: defaultSettings.language || 'auto',
    model: defaultSettings.model || 'gpt-3.5-turbo',
    temperature: defaultSettings.temperature || 0.3,
    maxTokens: defaultSettings.maxTokens || 2000
  });

  const [apiKeysValid, setApiKeysValid] = useState(false);
  const [requiredKeys, setRequiredKeys] = useState<string[]>([]);

  // Check API keys when job type changes
  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        const validation = await ApiKeyService.validateRequiredKeys(processingOptions.jobType);
        setApiKeysValid(validation.valid);
        setRequiredKeys(validation.missing);
      } catch (error) {
        logger.warn('Failed to check API keys:', error);
        setApiKeysValid(false);
      }
    };

    if (isAuthenticated) {
      checkApiKeys();
    }
  }, [processingOptions.jobType, isAuthenticated]);

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
    const errorMessage = error instanceof ApiError ? error.message : error;
    
    setUploadState(prev => ({
      ...prev,
      status: 'error',
      error: errorMessage
    }));
    
    onError(errorMessage);
  }, [onError]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file
    const validation = UploadService.validateFile(file);
    if (!validation.valid) {
      handleError(validation.error || 'Invalid file');
      return;
    }

    // Check API keys before starting
    if (!apiKeysValid) {
      handleError(`Missing API keys: ${requiredKeys.join(', ')}. Please configure them in settings.`);
      return;
    }

    setUploadState({
      status: 'uploading',
      progress: 0,
      stage: 'Initializing upload...',
      file,
      uploadId: null,
      jobId: null,
      error: null
    });

    try {
      // Initialize upload
      const initResponse = await UploadService.initializeUpload({
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        workspaceId
      });

      setUploadState(prev => ({
        ...prev,
        uploadId: initResponse.uploadId,
        stage: 'Uploading file...'
      }));

      let uploadResult;

      if (initResponse.multipart) {
        // Large file multipart upload
        uploadResult = await UploadService.uploadLargeFile(
          initResponse.uploadId,
          file,
          initResponse.chunkSize,
          (progress: ChunkUploadProgress) => {
            setUploadState(prev => ({
              ...prev,
              progress: Math.round(progress.overallProgress),
              stage: `Uploading chunk ${progress.chunkIndex + 1}/${progress.totalChunks}...`
            }));
          }
        );
      } else {
        // Small file direct upload
        uploadResult = await UploadService.uploadFile(
          initResponse.uploadId,
          file,
          (progress: number) => {
            setUploadState(prev => ({
              ...prev,
              progress: Math.round(progress),
              stage: 'Uploading file...'
            }));
          }
        );
      }

      // Start processing
      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        progress: 0,
        stage: 'Starting processing...'
      }));

      const processingResponse = await ProcessingService.startProcessing({
        uploadId: initResponse.uploadId,
        jobType: processingOptions.jobType,
        options: {
          language: processingOptions.language === 'auto' ? undefined : processingOptions.language,
          model: processingOptions.model,
          temperature: processingOptions.temperature,
          maxTokens: processingOptions.maxTokens
        }
      });

      const jobId = processingResponse.job.jobId;
      setUploadState(prev => ({
        ...prev,
        jobId,
        stage: 'Processing audio...'
      }));

      // Poll for completion
      const result = await ProcessingService.pollJobStatus(
        jobId,
        (progress: number, status: string) => {
          setUploadState(prev => ({
            ...prev,
            progress: Math.round(progress),
            stage: `Processing: ${status}...`
          }));
        }
      );

      // Completed successfully
      setUploadState(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        stage: 'Completed!'
      }));

      onProcessingComplete(result);

    } catch (error) {
      handleError(error as ApiError);
    }
  }, [workspaceId, processingOptions, apiKeysValid, requiredKeys, handleError, onProcessingComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': UploadService.getSupportedExtensions(),
      'video/*': ['.mp4', '.webm', '.mov']
    },
    multiple: false,
    disabled: uploadState.status !== 'idle'
  });

  const cancelUpload = async () => {
    if (uploadState.uploadId) {
      try {
        await UploadService.cancelUpload(uploadState.uploadId);
      } catch (error) {
        logger.warn('Failed to cancel upload:', error);
      }
    }
    
    if (uploadState.jobId) {
      try {
        await ProcessingService.cancelJob(uploadState.jobId);
      } catch (error) {
        logger.warn('Failed to cancel job:', error);
      }
    }
    
    resetState();
  };

  const renderUploadArea = () => {
    if (uploadState.status === 'idle') {
      return (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop your audio file here' : 'Upload your audio file'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Drag & drop or click to select a file
          </p>
          <p className="text-xs text-gray-400">
            Supports: {UploadService.getSupportedExtensions().join(', ')} • Max size: 500MB
          </p>
        </div>
      );
    }

    return (
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {uploadState.status === 'uploading' && (
              <Clock className="h-5 w-5 text-blue-500 animate-spin" />
            )}
            {uploadState.status === 'processing' && (
              <Clock className="h-5 w-5 text-orange-500 animate-spin" />
            )}
            {uploadState.status === 'completed' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {uploadState.status === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-medium text-gray-900">{uploadState.file?.name}</p>
              <p className="text-sm text-gray-500">
                {uploadState.file && UploadService.formatFileSize(uploadState.file.size)}
              </p>
            </div>
          </div>
          
          {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
            <button
              onClick={cancelUpload}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{uploadState.stage}</span>
            <span className="text-gray-900 font-medium">{uploadState.progress}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                uploadState.status === 'error'
                  ? 'bg-red-500'
                  : uploadState.status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        </div>

        {uploadState.status === 'completed' && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={resetState}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              Upload Another
            </button>
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Please log in to upload files.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Processing Options */}
      <ProcessingOptions
        options={processingOptions}
        onChange={setProcessingOptions}
        disabled={uploadState.status !== 'idle'}
      />

      {/* API Key Status */}
      {!apiKeysValid && requiredKeys.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                Missing API keys: {requiredKeys.join(', ')}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Configure these in Settings before uploading.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {renderUploadArea()}

      {/* Error Display */}
      {uploadState.error && (
        <ErrorDisplay 
          error={uploadState.error}
          onRetry={resetState}
        />
      )}
    </div>
  );
};

export default BackendAudioUploader;