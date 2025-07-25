import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UploadDropzone } from './UploadDropzone';
import { UploadProgress } from './UploadProgress';
import { ApiKeyValidator } from './ApiKeyValidator';
import ProcessingOptions from './ProcessingOptions';
import ErrorDisplay from './ErrorDisplay';
import { useUploadOrchestrator } from './UploadOrchestrator';
import { useProcessingStatus } from './ProcessingStatus';

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

  const { startProcessingPolling } = useProcessingStatus({
    setUploadState,
    onProcessingComplete,
    onError
  });

  const { handleFileDrop } = useUploadOrchestrator({
    isAuthenticated,
    apiKeysValid,
    processingOptions,
    workspaceId,
    setUploadState,
    onUploadComplete,
    onProcessingComplete,
    onError,
    startProcessingPolling
  });

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
        summaryStyle="formal" // Default summary style
        onSummaryStyleChange={() => {}} // TODO: Implement summary style handling
        outputLanguage={processingOptions.language}
        onLanguageChange={(language) => setProcessingOptions(prev => ({ ...prev, language }))}
        temperature={processingOptions.temperature}
        onTemperatureChange={(temperature) => setProcessingOptions(prev => ({ ...prev, temperature }))}
        maxTokens={processingOptions.maxTokens}
        onMaxTokensChange={(maxTokens) => setProcessingOptions(prev => ({ ...prev, maxTokens }))}
        showAdvanced={false} // Default to not showing advanced options
        onToggleAdvanced={() => {}} // TODO: Implement advanced toggle
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
          onDismiss={resetState}
        />
      )}
    </div>
  );
};

export default BackendAudioUploader;