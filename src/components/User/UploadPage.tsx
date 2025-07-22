/**
 * Upload Page - Audio upload interface for user dashboard
 * Provides the same functionality as the main app upload
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { BackendAudioUploader } from '../AudioUploader/BackendAudioUploader';
import { AudioProcessingResponse } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useApiKeys } from '../../hooks/useApiKeys';
import { useHistory } from '../../hooks/useHistory';
import { useSettings } from '../../hooks/useSettings';
import ApiKeyManager from '../ApiKeyManager';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function UploadPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const { hasKeys, getApiKeys } = useApiKeys(token);
  const { addToHistory } = useHistory();
  const { settings } = useSettings();
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [lastResult, setLastResult] = useState<AudioProcessingResponse | null>(null);

  useEffect(() => {
    loadApiKey();
  }, [hasKeys]);

  const loadApiKey = async () => {
    if (hasKeys.hasOpenAI && token) {
      const keys = await getApiKeys();
      if (keys?.openai) {
        setApiKey(keys.openai);
      }
    } else {
      // Check localStorage for backward compatibility
      const localKey = localStorage.getItem('openai_api_key') || '';
      setApiKey(localKey);
    }
  };

  const handleProcessingComplete = (result: AudioProcessingResponse) => {
    setLastResult(result);
    addToHistory(result);
    
    // Navigate to the jobs page to see the new transcription
    navigate('/jobs');
  };

  const handleError = (error: string) => {
    logger.error('Processing error:', error);
  };

  const handleApiKeyUpdate = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('openai_api_key', newKey);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Upload Audio</h1>
        <p className="text-gray-600 mt-2">
          Upload audio files for transcription and summarization
        </p>
      </div>

      {/* API Key Warning */}
      {!apiKey && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">API Key Required</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You need to configure your OpenAI API key to upload and process audio files.
              </p>
            </div>
            <button
              onClick={() => setShowApiKeyManager(true)}
              className="ml-4 text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Configure
            </button>
          </div>
        </div>
      )}

      {/* Upload Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <BackendAudioUploader
          onUploadComplete={(upload) => {
            // Convert backend upload to processing complete format
            handleProcessingComplete({
              audioFile: null,
              audioUrl: upload.cdnUrl || upload.storageUrl,
              transcript: { text: '' },
              summary: { total_duration: upload.duration || 0 },
              uploadId: upload.id
            })
          }}
          onError={handleError}
          workspaceId="default" // TODO: Use actual workspace ID from context
        />
      </div>

      {/* Recent Upload Result */}
      {lastResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Upload Successful!</h3>
          <p className="mt-1 text-sm text-green-700">
            Your audio file has been processed. You can view it in your jobs list.
          </p>
        </div>
      )}

      {/* API Key Manager Modal */}
      {showApiKeyManager && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowApiKeyManager(false)} />
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-semibold mb-4">API Key Configuration</h2>
              
              <ApiKeyManager
                openAIKey={apiKey}
                elevenLabsKey=""
                onOpenAIKeyChange={handleApiKeyUpdate}
                onElevenLabsKeyChange={() => {}}
                isGuest={!token}
                token={token}
                hasSecureKeys={hasKeys}
              />
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowApiKeyManager(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}