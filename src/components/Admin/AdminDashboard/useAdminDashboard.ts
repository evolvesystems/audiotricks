// Custom hook for admin dashboard logic
import { useState, useEffect } from 'react';
import { User, Stats } from './types';
import { apiRequest } from '../../../utils/api';
import { logger } from '../../../utils/logger';

interface UseAdminDashboardProps {
  token: string;
  onSessionExpired?: () => void;
}

export function useAdminDashboard({ token, onSessionExpired }: UseAdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleApiError = async (response: Response, errorMessage: string) => {
    if (response.status === 401) {
      try {
        const errorData = await response.json();
        if (errorData.error === 'Invalid or expired session' && onSessionExpired) {
          onSessionExpired();
          throw new Error('Session expired');
        }
      } catch (parseError) {
        // Silent catch
      }
    }
    throw new Error(errorMessage);
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        logger.error('Failed to fetch users - Status:', response.status);
        await handleApiError(response, 'Failed to fetch users');
        return;
      }

      const data = await response.json();
      logger.debug('Fetched users:', data);
      logger.debug('Users array:', data.users);
      logger.debug('Setting users state to:', data.users || []);
      setUsers(data.users || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      logger.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        logger.error('Failed to fetch stats - Status:', response.status);
        await handleApiError(response, 'Failed to fetch stats');
        return;
      }

      const data = await response.json();
      logger.debug('Fetched stats:', data);
      setStats(data.stats || null);
    } catch (error) {
      logger.error('Error fetching stats:', error);
      setStats(null);
    }
  };

  const fetchUsersWithToken = async (authToken: string) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        logger.error('Failed to fetch users - Status:', response.status);
        return;
      }

      const data = await response.json();
      logger.debug('Fetched users with stored token:', data);
      logger.debug('Users array from stored token:', data.users);
      logger.debug('Setting users state from stored token to:', data.users || []);
      setUsers(data.users || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      logger.error('Error fetching users with token:', error);
      setUsers([]);
    }
  };

  const fetchStatsWithToken = async (authToken: string) => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        logger.error('Failed to fetch stats - Status:', response.status);
        return;
      }

      const data = await response.json();
      logger.debug('Fetched stats with stored token:', data);
      setStats(data.stats || null);
    } catch (error) {
      logger.error('Error fetching stats with token:', error);
      setStats(null);
    }
  };

  useEffect(() => {
    if (!token) {
      logger.debug('No token available, trying localStorage...');
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        logger.debug('No token in localStorage either');
        return;
      }
      logger.debug('Using token from localStorage');
      // Use the stored token directly for this request
      const loadDataWithStoredToken = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchUsersWithToken(storedToken),
            fetchStatsWithToken(storedToken)
          ]);
        } catch (error) {
          logger.error('Failed to load admin data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadDataWithStoredToken();
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchStats()]);
      } catch (error) {
        logger.error('Failed to load admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token, page, searchTerm]);

  const toggleUserStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  return {
    users,
    stats,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalPages,
    toggleUserStatus,
    updateUserRole,
    handleDeleteUser,
    fetchUsers,
    fetchStats
  };
}