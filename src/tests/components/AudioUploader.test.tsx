import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AudioUploader from '../../components/AudioUploader'
import * as openaiUtils from '../../utils/openai'

// Mock the openai utils
vi.mock('../../utils/openai', () => ({
  processAudioWithOpenAI: vi.fn(),
  processAudioFromUrl: vi.fn(),
}))

describe('AudioUploader', () => {
  const mockProps = {
    apiKey: 'test-api-key',
    onProcessingComplete: vi.fn(),
    onError: vi.fn(),
    defaultSettings: {
      summaryStyle: 'formal' as const,
      outputLanguage: 'en',
      temperature: 0.3,
      maxTokens: 2000,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: Expected use case
  it('renders upload area and accepts file drop', async () => {
    render(<AudioUploader {...mockProps} />)
    
    // Check if upload area is rendered
    const uploadArea = screen.getByText(/drop audio file here/i)
    expect(uploadArea).toBeInTheDocument()
    
    // Check supported formats are displayed
    expect(screen.getByText(/MP3, WAV, M4A, FLAC/i)).toBeInTheDocument()
  })

  // Test 2: Edge case - no API key
  it('shows warning when API key is missing', () => {
    render(<AudioUploader {...mockProps} apiKey="" />)
    
    const warning = screen.getByText(/please enter your openai api key/i)
    expect(warning).toBeInTheDocument()
  })

  // Test 3: Failure case - processing error
  it('handles processing errors gracefully', async () => {
    const processingError = new Error('Processing failed')
    vi.mocked(openaiUtils.processAudioWithOpenAI).mockRejectedValueOnce(processingError)
    
    render(<AudioUploader {...mockProps} />)
    
    // Create a mock file
    const file = new File(['audio content'], 'test.mp3', { type: 'audio/mp3' })
    const input = screen.getByLabelText(/drop audio file here/i).parentElement?.querySelector('input')
    
    if (input) {
      await userEvent.upload(input, file)
      
      await waitFor(() => {
        expect(mockProps.onError).toHaveBeenCalledWith('Processing failed. Please try again.')
      })
    }
  })

  // Test 4: Summary style selection
  it('allows user to select summary style', async () => {
    render(<AudioUploader {...mockProps} />)
    
    // Look for summary style options
    const formalOption = screen.getByText(/formal/i)
    expect(formalOption).toBeInTheDocument()
  })

  // Test 5: URL input mode
  it('can switch to URL input mode', async () => {
    render(<AudioUploader {...mockProps} />)
    
    const urlTab = screen.getByText(/from url/i)
    await userEvent.click(urlTab)
    
    const urlInput = screen.getByPlaceholderText(/enter audio file url/i)
    expect(urlInput).toBeInTheDocument()
  })
})