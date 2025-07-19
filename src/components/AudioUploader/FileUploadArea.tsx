import React from 'react'
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline'

interface FileUploadAreaProps {
  uploadedFile: File | null
  isDragActive: boolean
  isProcessing: boolean
  hasApiKey: boolean
  onStartProcessing: () => void
  getRootProps: () => any
  getInputProps: () => any
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  uploadedFile,
  isDragActive,
  isProcessing,
  hasApiKey,
  onStartProcessing,
  getRootProps,
  getInputProps
}) => {
  return (
    <div
      {...(isProcessing ? {} : getRootProps())}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
        ${isProcessing || !hasApiKey ? 'opacity-50' : 'cursor-pointer'}
      `}
    >
      <input {...getInputProps()} disabled={isProcessing || !hasApiKey} />
      
      {uploadedFile ? (
        <div className="space-y-4">
          <DocumentIcon className="mx-auto h-12 w-12 text-green-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          {hasApiKey && !isProcessing && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartProcessing()
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              Start Processing
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop the audio file here' : 'Upload your audio file'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Drag & drop or click to select
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports MP3, WAV, M4A, FLAC, OGG, OPUS (max 150MB)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploadArea