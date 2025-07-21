import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock child components to simplify testing
vi.mock('../components/HeroSection', () => ({
  default: () => <div>Hero Section</div>
}))

vi.mock('../components/AudioUploader', () => ({
  default: ({ onProcessingComplete }: any) => (
    <div>
      <button onClick={() => onProcessingComplete({ 
        transcript: { text: 'Test' },
        summary: { summary: 'Test summary' },
        processing_time: 1 
      })}>
        Process Audio
      </button>
    </div>
  )
}))

describe('App', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  // Test 1: Expected use - main interface renders
  it('renders main interface', async () => {
    render(<App />)
    
    // Should show main app
    await waitFor(() => {
      expect(screen.getByText('AudioTricks')).toBeInTheDocument()
    })
  })

  // Test 2: API key input functionality
  it('shows API key input in header', async () => {
    render(<App />)
    
    // Should show API key input in header
    await waitFor(() => {
      const apiKeyInput = screen.getByPlaceholderText(/api key/i)
      expect(apiKeyInput).toBeInTheDocument()
    })
  })

  // Test 3: Settings modal functionality
  it('can open and close settings modal', async () => {
    render(<App />)
    
    // Find and click settings button
    const settingsButton = screen.getByTitle('Settings')
    await userEvent.click(settingsButton)
    
    // Settings modal should be visible
    await waitFor(() => {
      expect(screen.getByText(/User Settings/i)).toBeInTheDocument()
    })
  })

  // Test 4: History functionality
  it('tracks processing history', async () => {
    render(<App />)
    
    // Process an audio file
    const processButton = screen.getByText('Process Audio')
    await userEvent.click(processButton)
    
    // History button should show count
    await waitFor(() => {
      const historyButton = screen.getByTitle('History')
      const badge = historyButton.querySelector('.bg-blue-600')
      expect(badge?.textContent).toBe('1')
    })
  })

  // Test 5: Help modal functionality
  it('can open help center', async () => {
    render(<App />)
    
    // Find and click help button
    const helpButton = screen.getByTitle('Help')
    await userEvent.click(helpButton)
    
    // Help center should be visible
    await waitFor(() => {
      expect(screen.getByText(/Help Center/i)).toBeInTheDocument()
    })
  })
})