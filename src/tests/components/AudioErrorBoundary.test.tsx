import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import AudioErrorBoundary from '../../components/AudioErrorBoundary'

// Mock logger to avoid actual logging during tests
vi.mock('../../utils/logger', () => ({
  criticalError: vi.fn()
}))

// Component that throws audio-related errors
const ThrowAudioError: React.FC<{ errorType: string; shouldThrow: boolean }> = ({ 
  errorType, 
  shouldThrow 
}) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'audio':
        throw new Error('Failed to decode audio file')
      case 'webaudio':
        throw new Error('AudioContext initialization failed')
      case 'chunk':
        throw new Error('Audio chunk processing error')
      case 'generic':
        throw new Error('Generic component error')
      default:
        throw new Error('Test error')
    }
  }
  return <div data-testid="audio-child">Audio component working</div>
}

describe('AudioErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error
  
  beforeEach(() => {
    console.error = vi.fn()
    // Mock localStorage
    const mockLocalStorage = {
      removeItem: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    // Mock Object.keys for localStorage
    Object.keys = vi.fn(() => ['audio-data', 'transcript-cache', 'processing-state'])
  })
  
  afterEach(() => {
    console.error = originalError
    vi.clearAllMocks()
  })

  test('renders children when there is no error', () => {
    render(
      <AudioErrorBoundary>
        <ThrowAudioError errorType="audio" shouldThrow={false} />
      </AudioErrorBoundary>
    )
    
    expect(screen.getByTestId('audio-child')).toBeInTheDocument()
    expect(screen.getByText('Audio component working')).toBeInTheDocument()
  })

  test('detects and handles audio-related errors', () => {
    render(
      <AudioErrorBoundary>
        <ThrowAudioError errorType="audio" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    expect(screen.getByText('Audio Processing Error')).toBeInTheDocument()
    expect(screen.getByText(/There was a problem processing your audio file/)).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Clear Audio Data')).toBeInTheDocument()
  })

  test('detects WebAudio API errors', () => {
    render(
      <AudioErrorBoundary>
        <ThrowAudioError errorType="webaudio" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    expect(screen.getByText('Audio Processing Error')).toBeInTheDocument()
    expect(screen.getByText(/Check if your browser supports WebAudio API/)).toBeInTheDocument()
  })

  test('handles generic component errors', () => {
    render(
      <AudioErrorBoundary>
        <ThrowAudioError errorType="generic" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    expect(screen.getByText('Component Error')).toBeInTheDocument()
    expect(screen.getByText(/An error occurred in the audio component/)).toBeInTheDocument()
  })

  test('clears audio data when Clear Audio Data button is clicked', () => {
    render(
      <AudioErrorBoundary>
        <ThrowAudioError errorType="audio" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    const clearButton = screen.getByText('Clear Audio Data')
    fireEvent.click(clearButton)
    
    // Should attempt to clear localStorage items
    expect(window.localStorage.removeItem).toHaveBeenCalled()
  })

  test('shows troubleshooting steps for audio errors', () => {
    render(
      <AudioErrorBoundary>
        <ThrowAudioError errorType="audio" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    expect(screen.getByText('Troubleshooting steps:')).toBeInTheDocument()
    expect(screen.getByText(/Try a different audio file format/)).toBeInTheDocument()
    expect(screen.getByText(/Ensure your file is not corrupted/)).toBeInTheDocument()
  })

  test('shows technical details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <AudioErrorBoundary showDetailedAudioErrors={true}>
        <ThrowAudioError errorType="audio" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    expect(screen.getByText('Technical details (development)')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  test('calls custom error handler when provided', () => {
    const onError = vi.fn()
    
    render(
      <AudioErrorBoundary onError={onError}>
        <ThrowAudioError errorType="audio" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    )
  })

  test('renders custom fallback when provided', () => {
    const customFallback = <div>Custom audio error message</div>
    
    render(
      <AudioErrorBoundary fallback={customFallback}>
        <ThrowAudioError errorType="audio" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    expect(screen.getByText('Custom audio error message')).toBeInTheDocument()
    expect(screen.queryByText('Audio Processing Error')).not.toBeInTheDocument()
  })

  test('handles error recovery', () => {
    const { rerender } = render(
      <AudioErrorBoundary>
        <ThrowAudioError errorType="audio" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    // Verify error state
    expect(screen.getByText('Audio Processing Error')).toBeInTheDocument()
    
    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'))
    
    // Rerender with working component
    rerender(
      <AudioErrorBoundary>
        <ThrowAudioError errorType="audio" shouldThrow={false} />
      </AudioErrorBoundary>
    )
    
    expect(screen.getByText('Audio component working')).toBeInTheDocument()
  })

  test('refreshes page when Refresh Page button is clicked', () => {
    // Mock window.location.reload
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })
    
    render(
      <AudioErrorBoundary>
        <ThrowAudioError errorType="audio" shouldThrow={true} />
      </AudioErrorBoundary>
    )
    
    fireEvent.click(screen.getByText('Refresh Page'))
    expect(mockReload).toHaveBeenCalled()
  })
})