import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentIcon, LinkIcon } from '@heroicons/react/24/outline'
import { processAudioWithOpenAI, processAudioFromUrl } from '../utils/openai'
import { AudioProcessingResponse } from '../types'
import SummaryStyleSelector, { SummaryStyle } from './SummaryStyleSelector'
import LanguageSelector from './LanguageSelector'
import ProcessingProgress from './ProcessingProgress'
import AdvancedSettings from './AdvancedSettings'
import { UserSettings } from './Settings'

interface AudioUploaderProps {
  apiKey: string
  onProcessingComplete: (result: AudioProcessingResponse) => void
  onError: (error: string) => void
  defaultSettings?: UserSettings
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ apiKey, onProcessingComplete, onError, defaultSettings }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload')
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>(defaultSettings?.summaryStyle || 'formal')
  const [outputLanguage, setOutputLanguage] = useState(defaultSettings?.outputLanguage || 'en')
  const [processingStage, setProcessingStage] = useState<'uploading' | 'transcribing' | 'summarizing' | 'complete'>('uploading')
  const [temperature, setTemperature] = useState(defaultSettings?.temperature || 0.3)
  const [maxTokens, setMaxTokens] = useState(defaultSettings?.maxTokens || 2000)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Update local state when default settings change
  useEffect(() => {
    if (defaultSettings) {
      setSummaryStyle(defaultSettings.summaryStyle)
      setOutputLanguage(defaultSettings.outputLanguage)
      setTemperature(defaultSettings.temperature)
      setMaxTokens(defaultSettings.maxTokens)
    }
  }, [defaultSettings])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!apiKey) {
      onError('Please enter your OpenAI API key first')
      return
    }

    setUploadedFile(file)
    setIsProcessing(true)
    setProcessingStage('uploading')

    try {
      const result = await processAudioWithOpenAI(
        file, 
        apiKey, 
        summaryStyle,
        outputLanguage,
        (stage) => setProcessingStage(stage),
        { temperature, maxTokens }
      )
      setProcessingStage('complete')
      onProcessingComplete(result)
    } catch (error: any) {
      onError(error.message || 'Processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [apiKey, onProcessingComplete, onError, summaryStyle, outputLanguage, temperature, maxTokens])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.mp4', '.mpeg', '.mpga', '.webm']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const handleUrlSubmit = async () => {
    if (!audioUrl.trim()) {
      onError('Please enter a valid URL')
      return
    }

    if (!apiKey) {
      onError('Please enter your OpenAI API key first')
      return
    }

    setIsProcessing(true)
    setProcessingStage('uploading')

    try {
      const result = await processAudioFromUrl(
        audioUrl, 
        apiKey, 
        summaryStyle,
        outputLanguage,
        (stage) => setProcessingStage(stage),
        { temperature, maxTokens }
      )
      setProcessingStage('complete')
      onProcessingComplete(result)
    } catch (error: any) {
      onError(error.message || 'Processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Audio</h3>
      
      {!apiKey && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Please enter your OpenAI API key in the header to start processing audio files.
          </p>
        </div>
      )}

      {/* Processing Options */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700">Processing Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryStyleSelector
            selectedStyle={summaryStyle}
            onStyleChange={setSummaryStyle}
            disabled={isProcessing}
          />
          <LanguageSelector
            selectedLanguage={outputLanguage}
            onLanguageChange={setOutputLanguage}
            disabled={isProcessing}
          />
        </div>
        
        {/* Advanced Settings Toggle */}
        <div className="mt-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>
          
          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded-md">
              <AdvancedSettings
                temperature={temperature}
                onTemperatureChange={setTemperature}
                maxTokens={maxTokens}
                onMaxTokensChange={setMaxTokens}
                disabled={isProcessing}
              />
            </div>
          )}
        </div>
      </div>

      {/* Input Mode Selector */}
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setInputMode('upload')}
          className={`px-4 py-2 text-sm font-medium ${
            inputMode === 'upload'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setInputMode('url')}
          className={`px-4 py-2 text-sm font-medium ${
            inputMode === 'url'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          From URL
        </button>
      </div>
      
      {inputMode === 'upload' ? (
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
          <ProcessingProgress 
            stage={processingStage}
            fileName={uploadedFile?.name}
          />
        ) : (
          <div className="space-y-4">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop the audio file here' : 'Drop audio file here, or click to select'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports MP3, WAV, M4A, FLAC, OGG (max 100MB)
              </p>
            </div>
          </div>
        )}
      </div>
      ) : (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="Enter audio file URL (e.g., https://example.com/audio.mp3)"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing || !apiKey}
              />
            </div>
            <button
              onClick={handleUrlSubmit}
              disabled={isProcessing || !apiKey || !audioUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Process'}
            </button>
          </div>
          
          {isProcessing && (
            <ProcessingProgress 
              stage={processingStage}
              fileName={audioUrl.split('/').pop()}
            />
          )}
          
          <p className="text-sm text-gray-500">
            Supports direct links to MP3, WAV, M4A, FLAC, OGG files (max 100MB)
          </p>
          
          {/* CORS Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>How it works:</strong> We'll try to fetch the audio directly. If blocked by CORS, 
              we'll automatically use a proxy service to access the file. This may take a bit longer.
            </p>
          </div>
        </div>
      )}

      {uploadedFile && !isProcessing && inputMode === 'upload' && (
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