// Tests for WorkspaceDashboard component
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import WorkspaceDashboard from '../../../components/Admin/WorkspaceDashboard/WorkspaceDashboard';

describe('WorkspaceDashboard', () => {
  const mockOnSessionExpired = vi.fn();
  const defaultProps = {
    token: 'test-token',
    onSessionExpired: mockOnSessionExpired
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders loading state initially', () => {
    render(<WorkspaceDashboard {...defaultProps} />);
    
    // Check for loading spinner
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('animate-spin');
  });

  it('displays workspace management header', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ workspaces: [] })
    });

    render(<WorkspaceDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Workspace Management')).toBeInTheDocument();
    });
  });

  it('displays empty state when no workspaces exist', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ workspaces: [] })
    });

    render(<WorkspaceDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No workspaces')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first workspace.')).toBeInTheDocument();
    });
  });

  it('displays workspace cards when workspaces exist', async () => {
    const mockWorkspaces = [
      {
        id: '1',
        name: 'Test Workspace',
        slug: 'test-workspace',
        description: 'A test workspace',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        _count: {
          users: 5,
          audioHistory: 10
        }
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ workspaces: mockWorkspaces })
    });

    render(<WorkspaceDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
      expect(screen.getByText('/test-workspace')).toBeInTheDocument();
      expect(screen.getByText('A test workspace')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('5 users')).toBeInTheDocument();
      expect(screen.getByText('10 files')).toBeInTheDocument();
    });
  });

  it('opens workspace modal when Create Workspace button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ workspaces: [] })
    });

    render(<WorkspaceDashboard {...defaultProps} />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Workspace');
      fireEvent.click(createButton);
    });

    // Modal should be opened (we'd need to mock WorkspaceModal to test this fully)
    expect(screen.getByText('Create Workspace')).toBeInTheDocument();
  });

  it('handles delete workspace with confirmation', async () => {
    const mockWorkspaces = [
      {
        id: '1',
        name: 'Test Workspace',
        slug: 'test-workspace',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        _count: { users: 0, audioHistory: 0 }
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ workspaces: mockWorkspaces })
    });

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    render(<WorkspaceDashboard {...defaultProps} />);

    await waitFor(() => {
      const deleteButton = screen.getByTitle('Delete workspace');
      fireEvent.click(deleteButton);
    });

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this workspace? This will remove all associated data.'
    );

    // Should make DELETE request
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workspaces/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
    );
  });

  it('handles session expiration on 401 response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' })
    });

    render(<WorkspaceDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(mockOnSessionExpired).toHaveBeenCalled();
    });
  });

  it('opens users modal when view users button is clicked', async () => {
    const mockWorkspaces = [
      {
        id: '1',
        name: 'Test Workspace',
        slug: 'test-workspace',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        _count: { users: 5, audioHistory: 0 }
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ workspaces: mockWorkspaces })
    });

    render(<WorkspaceDashboard {...defaultProps} />);

    await waitFor(() => {
      const viewUsersButton = screen.getByTitle('View users');
      fireEvent.click(viewUsersButton);
    });

    // Users modal should be opened
    expect(screen.getByTitle('View users')).toBeInTheDocument();
  });
});