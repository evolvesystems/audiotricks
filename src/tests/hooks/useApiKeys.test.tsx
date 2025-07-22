import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useApiKeys } from '../../hooks/useApiKeys'
import { logger } from '../../utils/logger'

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn()
  }
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useApiKeys Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Expected use case: Successful API key check for authenticated user
  it('should check API keys successfully for authenticated user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hasOpenAI: true,
        hasElevenLabs: false
      })
    })

    const { result } = renderHook(() => useApiKeys('valid-token'))

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.hasKeys).toEqual({ hasOpenAI: false, hasElevenLabs: false })

    // Wait for API call to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify API keys state
    expect(result.current.hasKeys).toEqual({ hasOpenAI: true, hasElevenLabs: false })
    expect(result.current.error).toBe(null)

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/settings/api-keys', {
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    })
  })

  // Edge case: No token provided
  it('should not make API calls when no token is provided', async () => {
    const { result } = renderHook(() => useApiKeys(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should not have made any API calls
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.hasKeys).toEqual({ hasOpenAI: false, hasElevenLabs: false })
  })

  // Failure case: API endpoint not implemented (404)
  it('should fall back to localStorage when API endpoint returns 404', async () => {
    localStorage.setItem('openai_api_key', 'sk-local-key')
    localStorage.setItem('elevenlabs_api_key', 'el-local-key')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should check localStorage as fallback
    expect(result.current.hasKeys).toEqual({ hasOpenAI: true, hasElevenLabs: true })
  })

  // Failure case: Network error
  it('should handle network errors gracefully', async () => {
    localStorage.setItem('openai_api_key', 'sk-backup-key')

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should log error
    expect(logger.error).toHaveBeenCalledWith('Failed to check API keys:', expect.any(Error))

    // Should fall back to localStorage
    expect(result.current.hasKeys).toEqual({ hasOpenAI: true, hasElevenLabs: false })
  })

  // Expected use case: Save API keys successfully
  it('should save API keys successfully to backend', async () => {
    // Mock successful save
    mockFetch.mockResolvedValueOnce({
      ok: true
    })

    // Mock successful check after save
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hasOpenAI: true,
        hasElevenLabs: false
      })
    })

    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Call saveApiKeys
    const success = await result.current.saveApiKeys({
      openai: 'sk-new-key',
      elevenLabs: 'el-new-key'
    })

    expect(success).toBe(true)

    // Verify save API call
    expect(mockFetch).toHaveBeenCalledWith('/api/settings/api-keys', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        openaiKey: 'sk-new-key',
        elevenLabsKey: 'el-new-key'
      })
    })
  })

  // Failure case: Save API keys with no token
  it('should return false when trying to save without token', async () => {
    const { result } = renderHook(() => useApiKeys(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.saveApiKeys({
      openai: 'sk-test-key'
    })

    expect(success).toBe(false)
    expect(result.current.error).toBe('Authentication required')
  })

  // Edge case: Clear error function
  it('should clear error when clearError is called', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Test error' })
    })

    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Trigger error
    await result.current.saveApiKeys({ openai: 'sk-test' })

    expect(result.current.error).toBe('Test error')

    // Clear error
    result.current.clearError()

    expect(result.current.error).toBe(null)
  })
})