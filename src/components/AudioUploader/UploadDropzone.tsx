import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle } from 'lucide-react';

interface UploadDropzoneProps {
  onFileDrop: (files: File[]) => void;
  disabled?: boolean;
  isUploading?: boolean;
}

/**
 * Drag-and-drop file upload zone component
 */
export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileDrop,
  disabled = false,
  isUploading = false
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!disabled && !isUploading) {
      onFileDrop(acceptedFiles);
    }
  }, [onFileDrop, disabled, isUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.mp4', '.webm', '.ogg', '.flac']
    },
    multiple: false,
    disabled: disabled || isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : disabled || isUploading
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : 'border-gray-300 hover:border-gray-400 cursor-pointer'
      }`}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-4">
        <div className={`p-3 rounded-full ${
          isDragActive ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <Upload className={`h-6 w-6 ${
            isDragActive ? 'text-blue-600' : 'text-gray-500'
          }`} />
        </div>
        
        <div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive 
              ? 'Drop your audio file here'
              : disabled || isUploading
              ? 'Upload in progress...'
              : 'Drop your audio file here, or click to select'
            }
          </p>
          
          <p className="text-sm text-gray-600">
            Supports MP3, WAV, M4A, MP4, WebM, OGG, FLAC (max 25MB)
          </p>
        </div>
        
        {!disabled && !isUploading && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span>Your file will be processed securely and never shared</span>
          </div>
        )}
      </div>
    </div>
  );
};