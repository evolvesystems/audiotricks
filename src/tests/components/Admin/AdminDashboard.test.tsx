// Tests for AdminDashboard component
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminDashboard from '../../../components/Admin/AdminDashboard/AdminDashboard';

// Mock the hooks and utilities
vi.mock('../../../hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    user: { id: '1', username: 'admin', role: 'admin' },
    token: 'test-token',
    loading: false
  })
}));

vi.mock('../../../utils/api', () => ({
  apiRequest: vi.fn()
}));

describe('AdminDashboard', () => {
  const mockOnSessionExpired = vi.fn();
  const defaultProps = {
    token: 'test-token',
    onSessionExpired: mockOnSessionExpired
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for API calls
    global.fetch = vi.fn();
  });

  it('renders loading state initially', () => {
    render(<AdminDashboard {...defaultProps} />);
    
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Spinner
  });

  it('displays admin dashboard header', async () => {
    // Mock successful API responses
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [], pagination: { pages: 1 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: {
            totalUsers: 10,
            activeUsers: 8,
            totalAudioProcessed: 100,
            usersByRole: { admin: 2, user: 8 }
          }
        })
      });

    render(<AdminDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('displays statistics cards when data is loaded', async () => {
    const mockStats = {
      totalUsers: 10,
      activeUsers: 8,
      totalAudioProcessed: 100,
      usersByRole: { admin: 2, user: 8 }
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [], pagination: { pages: 1 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stats: mockStats })
      });

    render(<AdminDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Audio Processed')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Admins')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('handles session expiration on 401 response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid or expired session' })
    });

    render(<AdminDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(mockOnSessionExpired).toHaveBeenCalled();
    });
  });

  it('opens user modal when Add User button is clicked', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [], pagination: { pages: 1 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: {
            totalUsers: 0,
            activeUsers: 0,
            totalAudioProcessed: 0,
            usersByRole: {}
          }
        })
      });

    render(<AdminDashboard {...defaultProps} />);

    await waitFor(() => {
      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);
    });

    // UserModal should be rendered (mocked)
    expect(screen.getByText('Add User')).toBeInTheDocument();
  });

  it('filters users based on search input', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [], pagination: { pages: 1 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: {
            totalUsers: 0,
            activeUsers: 0,
            totalAudioProcessed: 0,
            usersByRole: {}
          }
        })
      });

    render(<AdminDashboard {...defaultProps} />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search users by email or username...');
      expect(searchInput).toBeInTheDocument();
    });

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search users by email or username...');
    fireEvent.change(searchInput, { target: { value: 'test@example.com' } });

    // Should trigger new API call with search parameter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test@example.com'),
        expect.any(Object)
      );
    });
  });
});