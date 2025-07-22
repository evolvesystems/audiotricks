import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SecureApiKeyInput from '../../components/SecureApiKeyInput'
import { useApiKeys } from '../../hooks/useApiKeys'

// Mock the useApiKeys hook
vi.mock('../../hooks/useApiKeys', () => ({
  useApiKeys: vi.fn()
}))

describe('SecureApiKeyInput Component - Working Tests', () => {
  const mockOnApiKeyChange = vi.fn()
  const mockSaveApiKeys = vi.fn()
  const mockCheckKeys = vi.fn()

  const defaultMockHook = {
    hasKeys: { hasOpenAI: false, hasElevenLabs: false },
    saveApiKeys: mockSaveApiKeys,
    checkKeys: mockCheckKeys,
    loading: false,
    error: null,
    clearError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(useApiKeys).mockReturnValue(defaultMockHook)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Expected use case: Basic component rendering
  it('should render input field for API key entry', () => {
    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={true}
        keyType="openai"
      />
    )

    // Find input field
    const input = screen.getByPlaceholderText('Enter OpenAI API Key')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')

    // Find save button
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).toBeDisabled() // Should be disabled when empty
  })

  // Expected use case: Toggle password visibility
  it('should toggle password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={true}
        keyType="openai"
      />
    )

    const input = screen.getByPlaceholderText('Enter OpenAI API Key')
    
    // Initially password type
    expect(input).toHaveAttribute('type', 'password')

    // Find and click toggle button (eye icon)
    const toggleButtons = screen.getAllByRole('button')
    const toggleButton = toggleButtons.find(btn => btn.querySelector('svg'))

    if (toggleButton) {
      await user.click(toggleButton)
      expect(input).toHaveAttribute('type', 'text')

      // Click again to hide
      await user.click(toggleButton)
      expect(input).toHaveAttribute('type', 'password')
    }
  })

  // Expected use case: Display existing API key
  it('should display when API key is already set', () => {
    vi.mocked(useApiKeys).mockReturnValue({
      ...defaultMockHook,
      hasKeys: { hasOpenAI: true, hasElevenLabs: false }
    })

    render(
      <SecureApiKeyInput
        apiKey="sk-existing-key"
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={false}
        token="valid-token"
        keyType="openai"
      />
    )

    // Should show key set status
    expect(screen.getByText(/OpenAI Key Set/i)).toBeInTheDocument()
    expect(screen.getByText(/Secured/i)).toBeInTheDocument()
    
    // Should show change button
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument()
  })

  // Edge case: Empty input validation
  it('should disable save button when input is empty or whitespace', async () => {
    const user = userEvent.setup()
    
    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={true}
        keyType="openai"
      />
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    const input = screen.getByPlaceholderText('Enter OpenAI API Key')

    // Initially disabled
    expect(saveButton).toBeDisabled()

    // Type something
    await user.type(input, 'sk-key')
    expect(saveButton).not.toBeDisabled()

    // Clear input
    await user.clear(input)
    expect(saveButton).toBeDisabled()

    // Type only whitespace
    await user.type(input, '   ')
    expect(saveButton).toBeDisabled()
  })

  // Expected use case: Help tooltip display
  it('should display help tooltip when question mark is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={true}
        keyType="openai"
      />
    )

    // Find help button
    const helpButton = screen.getByTitle('How to get OpenAI API key')
    
    // Click help button
    await user.click(helpButton)

    // Verify help content is displayed
    expect(screen.getByText('How to get OpenAI API Key')).toBeInTheDocument()
    expect(screen.getByText(/platform.openai.com/)).toBeInTheDocument()
  })

  // Edge case: Different help content for ElevenLabs
  it('should show correct help content for ElevenLabs API key', async () => {
    const user = userEvent.setup()
    
    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={true}
        keyType="elevenlabs"
      />
    )

    const helpButton = screen.getByTitle('How to get ElevenLabs API key')
    await user.click(helpButton)

    expect(screen.getByText('How to get ElevenLabs API Key')).toBeInTheDocument()
    expect(screen.getByText(/elevenlabs.io/)).toBeInTheDocument()
  })

  // Expected use case: Cancel editing
  it('should reset to original value when cancel is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SecureApiKeyInput
        apiKey="sk-original-key"
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={true}
        keyType="openai"
      />
    )

    // Click change button to enter edit mode
    const changeButton = screen.getByRole('button', { name: /change/i })
    await user.click(changeButton)

    // Should now be in editing mode
    const input = screen.getByPlaceholderText('Enter OpenAI API Key')
    expect(input).toBeInTheDocument()

    // Type new value
    await user.clear(input)
    await user.type(input, 'sk-new-key')

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Should show original key status again
    expect(screen.getByText(/OpenAI Key Set/i)).toBeInTheDocument()
    
    // onApiKeyChange should not have been called
    expect(mockOnApiKeyChange).not.toHaveBeenCalled()
  })

  // Failure case: Backend save failure
  it('should handle backend save failure gracefully', async () => {
    const user = userEvent.setup()
    mockSaveApiKeys.mockResolvedValue(false) // Simulate failure
    
    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={false}
        token="valid-token"
        keyType="openai"
      />
    )

    const input = screen.getByPlaceholderText('Enter OpenAI API Key')
    await user.type(input, 'sk-test-key')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Verify save was attempted
    expect(mockSaveApiKeys).toHaveBeenCalled()
    
    // onApiKeyChange should not be called on failure
    expect(mockOnApiKeyChange).not.toHaveBeenCalled()
  })

  // Expected use case: Guest user API key entry
  it('should handle guest user API key entry', async () => {
    const user = userEvent.setup()
    
    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={true}
        keyType="openai"
      />
    )

    const input = screen.getByPlaceholderText('Enter OpenAI API Key')
    await user.type(input, 'sk-guest-key')

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).not.toBeDisabled()
    
    await user.click(saveButton)

    // For guest users, should call onApiKeyChange directly
    expect(mockOnApiKeyChange).toHaveBeenCalledWith('sk-guest-key')
    
    // Should not call backend save for guest users
    expect(mockSaveApiKeys).not.toHaveBeenCalled()
  })

  // Edge case: Authenticated user with backend key
  it('should show secured status for authenticated users with backend keys', () => {
    vi.mocked(useApiKeys).mockReturnValue({
      ...defaultMockHook,
      hasKeys: { hasOpenAI: true, hasElevenLabs: false }
    })

    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={false}
        token="valid-token"
        keyType="openai"
      />
    )

    // Should show secured status
    expect(screen.getByText(/Secured/i)).toBeInTheDocument()
    expect(screen.getByText(/OpenAI Key Set/i)).toBeInTheDocument()
  })

  // Failure case: Component without required props
  it('should handle missing optional props gracefully', () => {
    // Test with minimal required props
    expect(() => {
      render(
        <SecureApiKeyInput
          apiKey=""
          onApiKeyChange={mockOnApiKeyChange}
          keyType="openai"
        />
      )
    }).not.toThrow()

    // Should still render basic interface
    expect(screen.getByPlaceholderText('Enter OpenAI API Key')).toBeInTheDocument()
  })
})