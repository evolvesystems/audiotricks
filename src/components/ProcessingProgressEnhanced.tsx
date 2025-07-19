import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid'
import StageProgress from './ProcessingProgress/StageProgress'
import ProcessingStats from './ProcessingProgress/ProcessingStats'
import { calculateProgress, formatTime, formatBytes } from '../utils/progressUtils'

// Add CSS for indeterminate progress animation
const progressStyles = `
  @keyframes indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }
`

interface ProcessingProgressEnhancedProps {
  stage: 'uploading' | 'transcribing' | 'summarizing' | 'complete'
  fileName?: string
  fileSize?: number
  chunkProgress?: { current: number; total: number }
  estimatedTime?: number
  currentDuration?: number
  wordCount?: number
  onCancel?: () => void
  audioUrl?: string
}

const ProcessingProgressEnhanced: React.FC<ProcessingProgressEnhancedProps> = ({ 
  stage, 
  fileName, 
  fileSize,
  chunkProgress,
  estimatedTime,
  currentDuration,
  wordCount,
  onCancel,
  audioUrl
}) => {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime] = useState(Date.now())
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [detectedFileSize, setDetectedFileSize] = useState<number | undefined>(fileSize)

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(elapsed)
      
      // Show warning if stuck on transcribing for more than 60 seconds
      if (stage === 'transcribing' && elapsed > 60 && !chunkProgress) {
        setShowTimeoutWarning(true)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [startTime, stage, chunkProgress])

  // Try to get file size from URL if not provided
  useEffect(() => {
    if (!detectedFileSize && audioUrl && stage === 'uploading') {
      const tryGetFileSize = async () => {
        try {
          const response = await fetch(audioUrl, { method: 'HEAD' })
          if (response.ok) {
            const contentLength = response.headers.get('content-length')
            if (contentLength) {
              const size = parseInt(contentLength)
              setDetectedFileSize(size)
            }
          }
        } catch (error) {
          // HEAD request failed due to CORS - this is expected
        }
      }
      tryGetFileSize()
    }
  }, [audioUrl, detectedFileSize, stage])

  // Update detected file size when fileSize prop changes
  useEffect(() => {
    if (fileSize && fileSize !== detectedFileSize) {
      setDetectedFileSize(fileSize)
    }
  }, [fileSize, detectedFileSize])

  const stages = [
    { 
      id: 'uploading', 
      label: 'Uploading Audio', 
      icon: SpeakerWaveIcon,
      time: '~5s',
      description: 'Preparing your audio file for processing'
    },
    { 
      id: 'transcribing', 
      label: 'Transcribing with Whisper', 
      icon: DocumentTextIcon,
      time: '~30s',
      description: 'Converting speech to text using OpenAI Whisper'
    },
    { 
      id: 'summarizing', 
      label: 'Generating Summary', 
      icon: ClockIcon,
      time: '~15s',
      description: 'Creating AI-powered insights and key moments'
    },
    { 
      id: 'complete', 
      label: 'Complete', 
      icon: CheckCircleIcon,
      time: '',
      description: 'Processing finished successfully'
    }
  ]

  const currentIndex = stages.findIndex(s => s.id === stage)
  
  const progress = calculateProgress(stage, chunkProgress)

  return (
    <>
      <style>{progressStyles}</style>
      <div className="space-y-6">
      {/* Main Progress Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Processing Audio
            </h3>
            {fileName && (
              <p className="text-sm text-gray-600 mt-1">
                {fileName} {detectedFileSize && `(${formatBytes(detectedFileSize)})`}
              </p>
            )}
            {/* Always show file size if we have it */}
            {detectedFileSize && (
              <p className="text-sm text-blue-600 mt-1 font-medium">
                File Size: {formatBytes(detectedFileSize)}
              </p>
            )}
          </div>
          <div className="flex items-start space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Elapsed Time</p>
              <p className="text-lg font-mono font-medium text-gray-900">{formatTime(elapsedTime)}</p>
            </div>
            {onCancel && stage !== 'complete' && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <StageProgress stages={stages} currentStage={stage} chunkProgress={chunkProgress} />

        <ProcessingStats 
          fileSize={detectedFileSize}
          currentDuration={currentDuration}
          wordCount={wordCount}
        />
      </div>

      {/* Tips Card */}
      {stage === 'transcribing' && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Processing Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Larger files take more time to process</li>
            <li>• Processing speed depends on audio quality and clarity</li>
            <li>• Files over 25MB are automatically split into chunks</li>
            {detectedFileSize && detectedFileSize > 25 * 1024 * 1024 && (
              <li>• Your file ({formatBytes(detectedFileSize)}) exceeds 25MB and will be processed in chunks</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Timeout Warning */}
      {showTimeoutWarning && (
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Processing Taking Longer Than Expected</h4>
          <p className="text-sm text-yellow-800 mb-2">
            This file is taking longer to process than usual. This can happen with:
          </p>
          <ul className="text-sm text-yellow-800 space-y-1 ml-4">
            <li>• Very long audio files (over 30 minutes)</li>
            <li>• Files with poor audio quality</li>
            <li>• Network connectivity issues</li>
          </ul>
          <p className="text-sm text-yellow-800 mt-2">
            Please wait a bit longer. If it doesn't complete in 2 minutes, try refreshing and uploading a smaller file.
          </p>
        </div>
      )}
      </div>
    </>
  )
}

export default ProcessingProgressEnhanced