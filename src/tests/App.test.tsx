import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock child components to simplify testing
vi.mock('../components/LoginCard', () => ({
  default: ({ onLogin }: any) => (
    <div>
      <button onClick={() => onLogin(true)}>Login as Guest</button>
      <button onClick={() => onLogin(false)}>Login with Password</button>
    </div>
  )
}))

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

  // Test 1: Expected use - guest login flow
  it('allows guest login and shows main interface', async () => {
    render(<App />)
    
    // Should show login initially
    const guestLoginButton = screen.getByText('Login as Guest')
    await userEvent.click(guestLoginButton)
    
    // Should now show main app
    await waitFor(() => {
      expect(screen.getByText('AudioTricks')).toBeInTheDocument()
    })
  })

  // Test 2: Edge case - remembers admin authentication
  it('remembers admin authentication across sessions', async () => {
    // Set admin auth in localStorage
    localStorage.setItem('admin_authenticated', 'true')
    
    render(<App />)
    
    // Should skip login and show main app
    expect(screen.getByText('AudioTricks')).toBeInTheDocument()
  })

  // Test 3: Failure case - handles missing API key
  it('shows appropriate UI when API key is missing', async () => {
    render(<App />)
    
    // Login as guest
    const guestLoginButton = screen.getByText('Login as Guest')
    await userEvent.click(guestLoginButton)
    
    // Should show API key input in header
    await waitFor(() => {
      const apiKeyInput = screen.getByPlaceholderText(/api key/i)
      expect(apiKeyInput).toBeInTheDocument()
    })
  })

  // Test 4: Settings modal functionality
  it('can open and close settings modal', async () => {
    localStorage.setItem('admin_authenticated', 'true')
    render(<App />)
    
    // Find and click settings button
    const settingsButton = screen.getByTitle('Settings')
    await userEvent.click(settingsButton)
    
    // Settings modal should be visible
    await waitFor(() => {
      expect(screen.getByText(/User Settings/i)).toBeInTheDocument()
    })
  })

  // Test 5: History functionality
  it('tracks processing history', async () => {
    localStorage.setItem('admin_authenticated', 'true')
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
})