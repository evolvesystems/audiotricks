import React from 'react';
import { CheckCircle, Clock, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  stage: string;
  file: File | null;
  error: string | null;
}

interface UploadProgressProps {
  uploadState: UploadState;
  onCancel: () => void;
  onReset: () => void;
}

/**
 * Upload progress display component with status indicators
 */
export const UploadProgress: React.FC<UploadProgressProps> = ({
  uploadState,
  onCancel,
  onReset
}) => {
  const { status, progress, stage, file, error } = uploadState;

  if (status === 'idle') {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <p className="font-medium text-gray-900">
              {file?.name || 'Processing...'}
            </p>
            <p className="text-sm text-gray-600">{stage}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {status === 'error' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
            >
              Try Again
            </Button>
          )}
          
          {(status === 'uploading' || status === 'processing') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
      
      {(status === 'uploading' || status === 'processing') && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {status === 'completed' && (
        <div className="text-sm text-green-700 font-medium">
          Processing completed successfully!
        </div>
      )}
    </div>
  );
};