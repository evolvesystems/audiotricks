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

describe('useApiKeys Hook - Working Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Expected use case: Hook initialization without token
  it('should initialize correctly without token', async () => {
    const { result } = renderHook(() => useApiKeys(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should not make API calls
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.hasKeys).toEqual({ hasOpenAI: false, hasElevenLabs: false })
    expect(result.current.error).toBe(null)
  })

  // Expected use case: Hook initialization with token
  it('should make API call when token is provided', async () => {
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

    // Wait for API call to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify API call was made
    expect(mockFetch).toHaveBeenCalledWith('/api/settings/api-keys', {
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    })

    // Verify state updated
    expect(result.current.hasKeys).toEqual({ hasOpenAI: true, hasElevenLabs: false })
  })

  // Failure case: Network error handling
  it('should handle network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should log error
    expect(logger.error).toHaveBeenCalledWith('Failed to check API keys:', expect.any(Error))

    // Should have fallback state
    expect(result.current.hasKeys).toEqual({ hasOpenAI: false, hasElevenLabs: false })
  })

  // Edge case: 404 response (API not implemented)
  it('should handle 404 responses as expected behavior', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should not treat 404 as an error since it means API not implemented yet
    expect(result.current.hasKeys).toEqual({ hasOpenAI: false, hasElevenLabs: false })
  })

  // Expected use case: Save API keys function exists
  it('should provide saveApiKeys function', async () => {
    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(typeof result.current.saveApiKeys).toBe('function')
  })

  // Expected use case: checkKeys function exists
  it('should provide checkKeys function for manual refresh', async () => {
    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(typeof result.current.checkKeys).toBe('function')
  })

  // Expected use case: clearError function
  it('should provide clearError function', () => {
    const { result } = renderHook(() => useApiKeys(null))

    expect(typeof result.current.clearError).toBe('function')
    
    // Should be callable without errors
    expect(() => result.current.clearError()).not.toThrow()
  })

  // Edge case: Token change triggers new check
  it('should re-check keys when token changes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ hasOpenAI: false, hasElevenLabs: false })
    })

    const { result, rerender } = renderHook(
      (props) => useApiKeys(props.token),
      { initialProps: { token: 'token1' } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Change token
    rerender({ token: 'token2' })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    // Verify new token was used
    expect(mockFetch).toHaveBeenLastCalledWith('/api/settings/api-keys', {
      headers: {
        'Authorization': 'Bearer token2'
      }
    })
  })

  // Failure case: Invalid JSON response
  it('should handle invalid JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON')
      }
    })

    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should handle JSON parsing error gracefully
    expect(logger.error).toHaveBeenCalled()
  })

  // Expected use case: Successful save API keys call
  it('should handle successful save API keys', async () => {
    // Mock initial check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasOpenAI: false, hasElevenLabs: false })
    })

    // Mock successful save
    mockFetch.mockResolvedValueOnce({
      ok: true
    })

    // Mock check after save
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasOpenAI: true, hasElevenLabs: false })
    })

    const { result } = renderHook(() => useApiKeys('valid-token'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Call saveApiKeys
    const success = await result.current.saveApiKeys({
      openai: 'sk-new-key'
    })

    expect(success).toBe(true)
    
    // Should have made save API call
    expect(mockFetch).toHaveBeenCalledWith('/api/settings/api-keys', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        openaiKey: 'sk-new-key',
        elevenLabsKey: undefined
      })
    })
  })

  // Failure case: Save without authentication
  it('should reject save attempts without token', async () => {
    const { result } = renderHook(() => useApiKeys(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.saveApiKeys({
      openai: 'sk-test-key'
    })

    expect(success).toBe(false)
  })

  // Expected use case: Hook cleanup
  it('should cleanup properly on unmount', () => {
    const { unmount } = renderHook(() => useApiKeys('valid-token'))
    
    // Should unmount without errors
    expect(() => unmount()).not.toThrow()
  })
})