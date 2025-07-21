// Custom hook for workspace dashboard logic
import { useState, useEffect } from 'react';
import { Workspace } from './types';

interface UseWorkspaceDashboardProps {
  token: string;
  onSessionExpired?: () => void;
}

export function useWorkspaceDashboard({ token, onSessionExpired }: UseWorkspaceDashboardProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const handleApiError = (response: Response, errorMessage: string) => {
    if (response.status === 401 && onSessionExpired) {
      onSessionExpired();
    }
    throw new Error(errorMessage);
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) handleApiError(response, 'Failed to fetch workspaces');

      const data = await response.json();
      setWorkspaces(data.workspaces);
    } catch (error) {
      // Error already logged in handleApiError
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchWorkspaces();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace? This will remove all associated data.')) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchWorkspaces();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete workspace');
      }
    } catch (error) {
      alert('Failed to delete workspace');
    }
  };

  return {
    workspaces,
    loading,
    fetchWorkspaces,
    handleDeleteWorkspace
  };
}