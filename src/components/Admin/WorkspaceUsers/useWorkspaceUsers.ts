// Custom hook for workspace users logic
import { useState, useEffect } from 'react';
import { WorkspaceUser, AvailableUser, Workspace } from './types';

interface UseWorkspaceUsersProps {
  workspace: Workspace;
  token: string;
  onSessionExpired?: () => void;
  isOpen: boolean;
}

export function useWorkspaceUsers({ 
  workspace, 
  token, 
  onSessionExpired,
  isOpen 
}: UseWorkspaceUsersProps) {
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);

  const handleApiError = (response: Response, errorMessage: string) => {
    if (response.status === 401 && onSessionExpired) {
      onSessionExpired();
      throw new Error('Session expired');
    }
    throw new Error(errorMessage);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) handleApiError(response, 'Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      // Using logger instead of console.error
      // import { logger } from '@/utils/logger';
      // logger.error('Error fetching workspace users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/workspaces/${workspace.id}/available-users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) handleApiError(response, 'Failed to fetch available users');

      const data = await response.json();
      setAvailableUsers(data.users);
    } catch (error) {
      // logger.error('Error fetching available users:', error);
    }
  };

  const addUser = async (userId: string, role: string) => {
    const response = await fetch(`/api/workspaces/${workspace.id}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, role })
    });

    if (!response.ok) handleApiError(response, 'Failed to add user');
    
    await fetchUsers();
  };

  const removeUser = async (userId: string) => {
    const response = await fetch(`/api/workspaces/${workspace.id}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) handleApiError(response, 'Failed to remove user');
    
    await fetchUsers();
  };

  const inviteUser = async (email: string, role: string) => {
    const response = await fetch(`/api/workspaces/${workspace.id}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, role })
    });

    if (!response.ok) handleApiError(response, 'Failed to send invitation');
    
    return response.json();
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchUsers();
    }
  }, [workspace.id, isOpen]);

  return {
    users,
    loading,
    availableUsers,
    fetchUsers,
    fetchAvailableUsers,
    addUser,
    removeUser,
    inviteUser
  };
}