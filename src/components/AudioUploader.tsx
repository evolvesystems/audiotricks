import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { processAudioWithOpenAI } from '../utils/openai'
import { AudioProcessingResponse } from '../types'

interface AudioUploaderProps {
  apiKey: string
  onProcessingComplete: (result: AudioProcessingResponse) => void
  onError: (error: string) => void
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ apiKey, onProcessingComplete, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!apiKey) {
      onError('Please enter your OpenAI API key first')
      return
    }

    setUploadedFile(file)
    setIsProcessing(true)

    try {
      const result = await processAudioWithOpenAI(file, apiKey)
      onProcessingComplete(result)
    } catch (error: any) {
      onError(error.message || 'Processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [apiKey, onProcessingComplete, onError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.mp4', '.mpeg', '.mpga', '.webm']
    },
    multiple: false,
    maxSize: 25 * 1024 * 1024, // 25MB
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!apiKey && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Please enter your OpenAI API key in the header to start processing audio files.
          </p>
        </div>
      )}
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isProcessing || !apiKey ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <p className="text-lg font-medium text-gray-900">Processing audio...</p>
              <p className="text-sm text-gray-500">
                {uploadedFile?.name && `Processing ${uploadedFile.name}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop the audio file here' : 'Drop audio file here, or click to select'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports MP3, WAV, M4A, FLAC, OGG (max 25MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadedFile && !isProcessing && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
          <DocumentIcon className="h-6 w-6 text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {uploadedFile.name}
            </p>
            <p className="text-sm text-gray-500">
              {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioUploader