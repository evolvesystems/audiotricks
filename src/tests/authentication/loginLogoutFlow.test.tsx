import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserAuth from '../../components/UserAuth'
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

// Mock window.location for navigation testing
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn()
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('Authentication Login/Logout Flow Integration Tests', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user'
  }

  const mockAdminUser = {
    ...mockUser,
    role: 'admin'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockLocation.href = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Expected use case: Complete login flow
  it('should handle complete authentication flow from login to user display', async () => {
    const user = userEvent.setup()
    const onUserChange = vi.fn()

    // 1. Initial state - no user
    render(<UserAuth onUserChange={onUserChange} />)
    
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/admin/login')

    // 2. Simulate successful login by setting token and user data
    localStorage.setItem('authToken', 'new-valid-token')

    // 3. Mock successful auth check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    // 4. Re-render component to trigger auth check
    const { rerender } = render(<UserAuth onUserChange={onUserChange} />)
    rerender(<UserAuth onUserChange={onUserChange} />)

    // 5. Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // 6. Verify user interface elements
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    expect(onUserChange).toHaveBeenCalledWith(mockUser)

    // Verify no admin link for regular user
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument()
  })

  // Expected use case: Admin user login flow
  it('should display admin interface for admin users', async () => {
    localStorage.setItem('authToken', 'admin-token')
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockAdminUser })
    })

    const onUserChange = vi.fn()
    render(<UserAuth onUserChange={onUserChange} />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Should show admin link
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute('href', '/admin')
    
    // Should also show dashboard link
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
  })

  // Expected use case: Complete logout flow
  it('should handle complete logout flow', async () => {
    const user = userEvent.setup()
    localStorage.setItem('authToken', 'valid-token')

    // Mock successful auth check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    // Mock successful logout
    mockFetch.mockResolvedValueOnce({
      ok: true
    })

    const onUserChange = vi.fn()
    render(<UserAuth onUserChange={onUserChange} />)

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Perform logout
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    // Verify logout API was called
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    })

    // Verify local state is cleared
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(onUserChange).toHaveBeenLastCalledWith(null)
    expect(screen.queryByText('testuser')).not.toBeInTheDocument()
  })

  // Edge case: Token expiration during session
  it('should handle token expiration gracefully', async () => {
    localStorage.setItem('authToken', 'expired-token')

    // Mock auth check with expired token
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    const onUserChange = vi.fn()
    render(<UserAuth onUserChange={onUserChange} />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    // Should clear expired token
    expect(localStorage.getItem('authToken')).toBeNull()
    
    // Should not show user interface
    expect(screen.queryByText('testuser')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument()
  })

  // Failure case: Network error during authentication check
  it('should handle network errors during auth check', async () => {
    localStorage.setItem('authToken', 'valid-token')

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const onUserChange = vi.fn()
    render(<UserAuth onUserChange={onUserChange} />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    // Should log the error
    expect(logger.error).toHaveBeenCalledWith('Auth check failed:', expect.any(Error))
    
    // Token should remain (network error, not auth error)
    expect(localStorage.getItem('authToken')).toBe('valid-token')
  })

  // Edge case: Multiple rapid auth state changes
  it('should handle rapid auth state changes correctly', async () => {
    const onUserChange = vi.fn()
    
    // Start without token
    const { rerender } = render(<UserAuth onUserChange={onUserChange} />)
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()

    // Add token and mock successful auth
    localStorage.setItem('authToken', 'new-token')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    rerender(<UserAuth onUserChange={onUserChange} />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Remove token (simulate logout from another tab)
    localStorage.removeItem('authToken')
    
    // Mock failed auth check
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    rerender(<UserAuth onUserChange={onUserChange} />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })
  })

  // Failure case: Server error during logout
  it('should handle server errors during logout gracefully', async () => {
    const user = userEvent.setup()
    localStorage.setItem('authToken', 'valid-token')

    // Mock successful auth check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    // Mock server error during logout
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const onUserChange = vi.fn()
    render(<UserAuth onUserChange={onUserChange} />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Attempt logout
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    // Should still clear local state despite server error
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(onUserChange).toHaveBeenLastCalledWith(null)
  })

  // Edge case: Auth check with malformed response
  it('should handle malformed auth responses', async () => {
    localStorage.setItem('authToken', 'valid-token')

    // Mock malformed response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalidData: 'no user field' })
    })

    const onUserChange = vi.fn()
    render(<UserAuth onUserChange={onUserChange} />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    // Should not crash but should not authenticate
    expect(onUserChange).not.toHaveBeenCalledWith(expect.objectContaining({
      id: expect.any(String)
    }))
  })

  // Expected use case: Persistent session across page reloads
  it('should maintain authentication state across component remounts', async () => {
    localStorage.setItem('authToken', 'persistent-token')

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    const onUserChange = vi.fn()
    
    // First mount
    const { unmount } = render(<UserAuth onUserChange={onUserChange} />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    unmount()

    // Second mount (simulating page reload)
    render(<UserAuth onUserChange={onUserChange} />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Should have made auth check both times
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(onUserChange).toHaveBeenCalledWith(mockUser)
  })

  // Edge case: Race condition between multiple auth checks
  it('should handle concurrent auth checks correctly', async () => {
    localStorage.setItem('authToken', 'race-token')

    // Mock slow first response, fast second response
    mockFetch
      .mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ user: mockUser })
          }), 100)
        )
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { ...mockUser, username: 'updated-user' } })
      })

    const onUserChange = vi.fn()
    const { rerender } = render(<UserAuth onUserChange={onUserChange} />)

    // Trigger second auth check immediately
    rerender(<UserAuth onUserChange={onUserChange} />)

    // Wait for both to complete
    await waitFor(() => {
      expect(screen.getByText(/user/i)).toBeInTheDocument()
    })

    // Should handle race condition gracefully
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})