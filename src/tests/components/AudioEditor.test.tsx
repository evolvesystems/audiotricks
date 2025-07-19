import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AudioEditor from '../../components/AudioEditor'
import { AudioProcessingResponse } from '../../types'

describe('AudioEditor', () => {
  const mockResults: AudioProcessingResponse = {
    transcript: {
      text: 'This is a test transcript with multiple words for editing.',
      segments: [],
      duration: 60
    },
    summary: {
      summary: 'Test summary',
      key_moments: [],
      total_duration: 60,
      language: 'en'
    },
    processing_time: 5,
    audioUrl: 'blob:mock-audio-url'
  }

  const mockProps = {
    results: mockResults,
    elevenLabsKey: 'test-elevenlabs-key'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: Expected use - renders editor with transcript
  it('renders audio editor with transcript words', () => {
    render(<AudioEditor {...mockProps} />)
    
    // Check if editor UI is rendered
    expect(screen.getByText('Audio Editor')).toBeInTheDocument()
    expect(screen.getByText('Edit Transcript')).toBeInTheDocument()
    
    // Check if words are displayed
    expect(screen.getByText('This')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('transcript')).toBeInTheDocument()
  })

  // Test 2: Edge case - no audio source
  it('shows warning when audio source is missing', () => {
    const propsWithoutAudio = {
      ...mockProps,
      results: {
        ...mockResults,
        audioUrl: undefined,
        audioFile: undefined
      }
    }
    
    render(<AudioEditor {...propsWithoutAudio} />)
    
    expect(screen.getByText(/Audio Editor Not Available/i)).toBeInTheDocument()
    expect(screen.getByText(/requires the original audio file/i)).toBeInTheDocument()
  })

  // Test 3: Failure case - empty transcript
  it('handles empty transcript gracefully', () => {
    const propsWithEmptyTranscript = {
      ...mockProps,
      results: {
        ...mockResults,
        transcript: {
          text: '',
          segments: [],
          duration: 0
        }
      }
    }
    
    render(<AudioEditor {...propsWithEmptyTranscript} />)
    
    // Should still render without crashing
    expect(screen.getByText('Audio Editor')).toBeInTheDocument()
  })

  // Test 4: Word selection functionality
  it('allows selecting words by clicking', async () => {
    render(<AudioEditor {...mockProps} />)
    
    const word = screen.getByText('This')
    await userEvent.click(word)
    
    // Word should be visually selected (check for selection class)
    expect(word.className).toContain('bg-yellow')
  })

  // Test 5: Delete functionality
  it('can delete selected words', async () => {
    render(<AudioEditor {...mockProps} />)
    
    // Select a word
    const word = screen.getByText('test')
    await userEvent.click(word)
    
    // Click delete button
    const deleteButton = screen.getByText(/Delete Selected/i)
    await userEvent.click(deleteButton)
    
    // Word should be marked as deleted (strikethrough)
    expect(word.className).toContain('line-through')
  })

  // Test 6: Voice synthesis tab
  it('can switch to voice synthesis tab', async () => {
    render(<AudioEditor {...mockProps} />)
    
    const synthesisTab = screen.getByText('Voice Synthesis')
    await userEvent.click(synthesisTab)
    
    // Should show voice synthesis content
    expect(screen.getByText(/Select Voice/i)).toBeInTheDocument()
  })
})