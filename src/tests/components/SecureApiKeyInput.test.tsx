import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SecureApiKeyInput from '../../components/SecureApiKeyInput'
import { useApiKeys } from '../../hooks/useApiKeys'

// Mock the useApiKeys hook
vi.mock('../../hooks/useApiKeys', () => ({
  useApiKeys: vi.fn()
}))

describe('SecureApiKeyInput Component', () => {
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

  // Expected use case: Guest user entering OpenAI API key
  it('should allow guest users to enter and save API key to localStorage', async () => {
    const user = userEvent.setup()
    
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
    expect(input).toHaveAttribute('type', 'password')

    // Type API key
    await user.type(input, 'sk-test-key-123')

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Verify callbacks
    expect(mockOnApiKeyChange).toHaveBeenCalledWith('sk-test-key-123')
    expect(localStorage.getItem('openai_api_key')).toBe('sk-test-key-123')
    
    // Should not call backend save for guest users
    expect(mockSaveApiKeys).not.toHaveBeenCalled()
  })

  // Expected use case: Authenticated user saving to backend
  it('should save API key to backend for authenticated users', async () => {
    const user = userEvent.setup()
    mockSaveApiKeys.mockResolvedValue(true)
    
    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={false}
        token="valid-token"
        keyType="elevenlabs"
      />
    )

    const input = screen.getByPlaceholderText('Enter ElevenLabs API Key')
    await user.type(input, 'el-test-key-456')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Verify backend save was called
    expect(mockSaveApiKeys).toHaveBeenCalledWith({
      elevenlabs: 'el-test-key-456'
    })

    // Wait for save to complete
    await waitFor(() => {
      expect(mockOnApiKeyChange).toHaveBeenCalledWith('el-test-key-456')
    })
  })

  // Edge case: Toggle password visibility
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
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button

    // Initially password type
    expect(input).toHaveAttribute('type', 'password')

    // Click to show
    await user.click(toggleButton)
    expect(input).toHaveAttribute('type', 'text')

    // Click to hide again
    await user.click(toggleButton)
    expect(input).toHaveAttribute('type', 'password')
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

  // Edge case: Cancel editing
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

    // Click change button
    const changeButton = screen.getByRole('button', { name: /change/i })
    await user.click(changeButton)

    // Type new value
    const input = screen.getByPlaceholderText('Enter OpenAI API Key')
    await user.clear(input)
    await user.type(input, 'sk-new-key')

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Should show original key status
    expect(screen.getByText(/OpenAI Key Set/i)).toBeInTheDocument()
    
    // onApiKeyChange should not have been called
    expect(mockOnApiKeyChange).not.toHaveBeenCalled()
  })

  // Failure case: Backend save failure
  it('should handle backend save failure gracefully', async () => {
    const user = userEvent.setup()
    mockSaveApiKeys.mockResolvedValue(false)
    
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

  // Edge case: Empty key validation
  it('should disable save button when input is empty', async () => {
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
  })

  // Expected use case: Show help tooltip
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
    expect(screen.getByText(/Create new secret key/)).toBeInTheDocument()
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

  // Edge case: Loading state during save
  it('should show loading state while saving', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: boolean) => void
    const savePromise = new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
    mockSaveApiKeys.mockReturnValue(savePromise)
    
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

    // Should show saving state
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(saveButton).toBeDisabled()

    // Resolve the promise
    resolvePromise!(true)

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    })
  })

  // Failure case: No token for authenticated user
  it('should handle missing token for authenticated users', async () => {
    const user = userEvent.setup()
    
    render(
      <SecureApiKeyInput
        apiKey=""
        onApiKeyChange={mockOnApiKeyChange}
        isGuest={false}
        token={null}
        keyType="openai"
      />
    )

    const input = screen.getByPlaceholderText('Enter OpenAI API Key')
    await user.type(input, 'sk-test-key')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Should still save to localStorage as fallback
    expect(localStorage.getItem('openai_api_key')).toBe('sk-test-key')
    expect(mockOnApiKeyChange).toHaveBeenCalledWith('sk-test-key')
  })
})