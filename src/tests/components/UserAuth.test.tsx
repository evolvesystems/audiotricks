import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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

describe('UserAuth Component', () => {
  const mockOnUserChange = vi.fn()
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
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Expected use case: No token shows login link
  it('should display login link when no auth token exists', () => {
    render(<UserAuth onUserChange={mockOnUserChange} />)

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/admin/login')
    
    // Verify fetch was not called
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // Edge case: Admin user should see admin link
  it('should display admin link for admin users', async () => {
    localStorage.setItem('authToken', 'admin-token')
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockAdminUser })
    })

    render(<UserAuth onUserChange={mockOnUserChange} />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Verify admin link is visible
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute('href', '/admin')
  })

  // Failure case: Invalid token should show login link
  it('should display login link when authentication fails', async () => {
    localStorage.setItem('authToken', 'invalid-token')
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    render(<UserAuth onUserChange={mockOnUserChange} />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    // Verify token was removed from localStorage
    expect(localStorage.getItem('authToken')).toBeNull()
    
    // Verify no user info is displayed
    expect(screen.queryByText('testuser')).not.toBeInTheDocument()
  })

  // Expected use case: No token in localStorage
  it('should display login link when no auth token exists', () => {
    render(<UserAuth onUserChange={mockOnUserChange} />)

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/admin/login')
    
    // Verify fetch was not called
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // Expected use case: Logout functionality
  it('should handle logout correctly', async () => {
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

    render(<UserAuth onUserChange={mockOnUserChange} />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

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

    // Verify token was removed
    expect(localStorage.getItem('authToken')).toBeNull()
    
    // Verify onUserChange was called with null
    expect(mockOnUserChange).toHaveBeenLastCalledWith(null)
  })

  // Edge case: Network error during auth check
  it('should handle network errors gracefully during auth check', async () => {
    localStorage.setItem('authToken', 'valid-token')
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<UserAuth onUserChange={mockOnUserChange} />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith('Auth check failed:', expect.any(Error))
    
    // Token should remain in localStorage (network error, not auth error)
    expect(localStorage.getItem('authToken')).toBe('valid-token')
  })

  // Failure case: Logout error should still clear local state
  it('should clear local state even if logout API fails', async () => {
    localStorage.setItem('authToken', 'valid-token')
    
    // Mock successful auth check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    // Mock failed logout
    mockFetch.mockRejectedValueOnce(new Error('Logout failed'))

    render(<UserAuth onUserChange={mockOnUserChange} />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith('Logout error:', expect.any(Error))
    
    // Verify token was still removed
    expect(localStorage.getItem('authToken')).toBeNull()
    
    // Verify onUserChange was still called with null
    expect(mockOnUserChange).toHaveBeenLastCalledWith(null)
  })

  // Edge case: Component without onUserChange callback
  it('should work correctly without onUserChange callback', async () => {
    localStorage.setItem('authToken', 'valid-token')
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    // Render without onUserChange prop
    render(<UserAuth />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Component should still function normally
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
  })

  // Edge case: Component re-renders should not trigger multiple auth checks
  it('should not trigger multiple auth checks on re-render', async () => {
    localStorage.setItem('authToken', 'valid-token')
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    const { rerender } = render(<UserAuth onUserChange={mockOnUserChange} />)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    // Initial auth check
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Re-render component
    rerender(<UserAuth onUserChange={mockOnUserChange} />)

    // Should not trigger another auth check
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})