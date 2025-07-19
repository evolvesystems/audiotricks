import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { processAudioWithOpenAI, processAudioFromUrl } from '../utils/openai'
import { AudioProcessingResponse } from '../types'
import { SummaryStyle } from './SummaryStyleSelector'
import ProcessingProgressEnhanced from './ProcessingProgressEnhanced'
import { UserSettings } from './Settings'
import ProcessingOptions from './AudioUploader/ProcessingOptions'
import ErrorDisplay from './AudioUploader/ErrorDisplay'
import InputModeSelector from './AudioUploader/InputModeSelector'
import ContentArea from './AudioUploader/ContentArea'

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
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [inlineError, setInlineError] = useState<string>('')
  const [currentFileSize, setCurrentFileSize] = useState<number | undefined>(undefined)
  const [chunkProgress, setChunkProgress] = useState<{ current: number; total: number } | undefined>(undefined)

  // Update local state when default settings change
  useEffect(() => {
    if (defaultSettings) {
      setSummaryStyle(defaultSettings.summaryStyle)
      setOutputLanguage(defaultSettings.outputLanguage)
      setTemperature(defaultSettings.temperature)
      setMaxTokens(defaultSettings.maxTokens)
    }
  }, [defaultSettings])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!apiKey) {
      setInlineError('Please enter your OpenAI API key first')
      return
    }

    setUploadedFile(file)
    setInlineError('') // Clear any previous errors
    // Don't start processing immediately - wait for user to click button
  }, [apiKey])

  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      setIsProcessing(false)
      setAbortController(null)
      setInlineError('Processing cancelled by user')
    }
  }

  const processUploadedFile = async () => {
    if (!uploadedFile || !apiKey) return

    const controller = new AbortController()
    setAbortController(controller)
    setIsProcessing(true)
    setProcessingStage('uploading')
    setInlineError('') // Clear any previous errors
    setChunkProgress(undefined) // Clear any previous chunk progress

    try {
      const result = await processAudioWithOpenAI(
        uploadedFile, 
        apiKey, 
        summaryStyle,
        outputLanguage,
        (stage, chunkProgressData) => {
          setProcessingStage(stage)
          setChunkProgress(chunkProgressData)
        },
        { temperature, maxTokens },
        controller.signal
      )
      setProcessingStage('complete')
      onProcessingComplete(result)
    } catch (error: any) {
      // Check if it was cancelled
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        setInlineError('Processing cancelled by user')
      } else {
        // More helpful error messages
        let errorMessage = error.message || 'Processing failed. Please try again.'
        
        if (error.message?.includes('large')) {
          errorMessage = `${error.message}\n\nTips for large files:\n• Use MP3 format for better compression\n• Remove silence from start/end\n• Try splitting manually into smaller segments`
        }
        
        setInlineError(errorMessage)
      }
    } finally {
      setIsProcessing(false)
      setUploadedFile(null)
      setAbortController(null)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.opus', '.mp4', '.mpeg', '.mpga', '.webm']
    },
    multiple: false,
    maxSize: 150 * 1024 * 1024, // 150MB max upload (files over 25MB will be automatically split)
  })

  const handleUrlSubmit = async () => {
    if (!audioUrl.trim()) {
      setInlineError('Please enter a valid URL')
      return
    }

    if (!apiKey) {
      setInlineError('Please enter your OpenAI API key first')
      return
    }

    const controller = new AbortController()
    setAbortController(controller)
    setIsProcessing(true)
    setProcessingStage('uploading')
    setInlineError('') // Clear any previous errors

    // Try to get file size first - add debug logging
    try {
      const headResponse = await fetch(audioUrl, { 
        method: 'HEAD',
        signal: controller.signal 
      })
      if (headResponse.ok) {
        const contentLength = headResponse.headers.get('content-length')
        if (contentLength) {
          const size = parseInt(contentLength)
          setCurrentFileSize(size)
        }
      }
    } catch (headError) {
      // Ignore HEAD request errors, continue with processing
    }

    try {
      const result = await processAudioFromUrl(
        audioUrl, 
        apiKey, 
        summaryStyle,
        outputLanguage,
        (stage, chunkProgressData) => {
          setProcessingStage(stage)
          setChunkProgress(chunkProgressData)
        },
        { temperature, maxTokens },
        controller.signal,
        (size) => setCurrentFileSize(size)
      )
      setProcessingStage('complete')
      // Update file size from result
      if (result.fileSize) {
        setCurrentFileSize(result.fileSize)
      }
      onProcessingComplete(result)
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        setInlineError('Processing cancelled by user')
      } else {
        setInlineError(error.message || 'Processing failed. Please try again.')
      }
    } finally {
      setIsProcessing(false)
      setAbortController(null)
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

      <ProcessingOptions
        summaryStyle={summaryStyle}
        onSummaryStyleChange={setSummaryStyle}
        outputLanguage={outputLanguage}
        onLanguageChange={setOutputLanguage}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        maxTokens={maxTokens}
        onMaxTokensChange={setMaxTokens}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        disabled={isProcessing}
      />

      <ErrorDisplay error={inlineError} onDismiss={() => setInlineError('')} />

      <InputModeSelector
        inputMode={inputMode}
        onModeChange={setInputMode}
        onClearError={() => setInlineError('')}
      />
      
      <ContentArea
        inputMode={inputMode}
        isProcessing={isProcessing}
        uploadedFile={uploadedFile}
        isDragActive={isDragActive}
        hasApiKey={!!apiKey}
        processingStage={processingStage}
        audioUrl={audioUrl}
        currentFileSize={currentFileSize}
        chunkProgress={chunkProgress}
        onStartProcessing={processUploadedFile}
        onUrlChange={setAudioUrl}
        onUrlSubmit={handleUrlSubmit}
        onCancel={handleCancel}
        onClearError={() => setInlineError('')}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
      />

    </div>
  )
}

export default AudioUploader