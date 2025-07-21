import React, { Component, ErrorInfo, ReactNode } from 'react'
import { MusicalNoteIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { criticalError, logger } from '../utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetailedAudioErrors?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isAudioError: boolean
}

/**
 * Specialized error boundary for audio processing components.
 * Provides audio-specific error handling and recovery options.
 */
class AudioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isAudioError: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isAudioError = AudioErrorBoundary.isAudioRelatedError(error)
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      isAudioError
    }
  }

  /**
   * Determines if an error is related to audio processing
   */
  static isAudioRelatedError(error: Error): boolean {
    const audioErrorPatterns = [
      /audio/i,
      /wav|mp3|m4a|flac|ogg|opus/i,
      /media/i,
      /webaudio/i,
      /audiocontext/i,
      /decode/i,
      /playback/i,
      /transcription/i,
      /chunk/i,
      /buffer/i
    ]

    const errorMessage = error.message || error.toString()
    const errorStack = error.stack || ''
    
    return audioErrorPatterns.some(pattern => 
      pattern.test(errorMessage) || pattern.test(errorStack)
    )
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log audio-specific error with additional context
    criticalError('AudioErrorBoundary caught an audio error:', {
      error,
      errorInfo,
      isAudioError: this.state.isAudioError,
      userAgent: navigator.userAgent,
      audioSupport: {
        webAudio: typeof AudioContext !== 'undefined',
        mediaDevices: typeof navigator.mediaDevices !== 'undefined'
      }
    })
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isAudioError: false
    })
  }

  handleReloadAudio = () => {
    // Clear audio-related localStorage data
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('audio') || key.includes('transcript') || key.includes('processing')) {
          localStorage.removeItem(key)
        }
      })
    } catch (err) {
      logger.warn('Failed to clear audio data:', err)
    }
    
    this.handleReset()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      const { isAudioError } = this.state

      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              {isAudioError ? (
                <MusicalNoteIcon className="h-6 w-6 text-red-400" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {isAudioError ? 'Audio Processing Error' : 'Component Error'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {isAudioError 
                    ? 'There was a problem processing your audio file. This could be due to an unsupported format, corrupted file, or browser compatibility issue.'
                    : 'An error occurred in the audio component. Please try again.'
                  }
                </p>
                
                {isAudioError && (
                  <div className="mt-3">
                    <h4 className="font-medium mb-2">Troubleshooting steps:</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Try a different audio file format (MP3, WAV recommended)</li>
                      <li>Ensure your file is not corrupted and under 25MB</li>
                      <li>Check if your browser supports WebAudio API</li>
                      <li>Try refreshing the page and uploading again</li>
                    </ul>
                  </div>
                )}

                {(this.props.showDetailedAudioErrors || process.env.NODE_ENV === 'development') && this.state.error && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium">
                      Technical details {process.env.NODE_ENV === 'development' ? '(development)' : ''}
                    </summary>
                    <div className="mt-2 bg-red-100 rounded p-2 text-xs font-mono overflow-auto max-h-32">
                      <p className="text-red-800 mb-1">{this.state.error.toString()}</p>
                      {this.state.errorInfo && (
                        <pre className="text-red-600 whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={this.handleReset}
                  className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Try Again
                </button>
                {isAudioError && (
                  <button
                    onClick={this.handleReloadAudio}
                    className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Clear Audio Data
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AudioErrorBoundary