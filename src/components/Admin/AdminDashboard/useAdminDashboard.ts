// Custom hook for admin dashboard logic
import { useState, useEffect } from 'react';
import { User, Stats } from './types';
import { apiRequest } from '../../../utils/api';
import { logger } from '../../../utils/logger';
import { apiClient } from '../../../services/api';

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
      const params = {
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      };

      const data = await apiClient.get('/admin/users', params);
      logger.debug('Fetched users:', data);
      logger.debug('Users array:', data.users);
      logger.debug('Setting users state to:', data.users || []);
      setUsers(data.users || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      logger.error('Error fetching users:', error);
      if (error.isAuthError && onSessionExpired) {
        onSessionExpired();
      }
      setUsers([]);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiClient.get('/admin/stats');
      logger.debug('Fetched stats:', data);
      setStats(data.stats || null);
    } catch (error) {
      logger.error('Error fetching stats:', error);
      if (error.isAuthError && onSessionExpired) {
        onSessionExpired();
      }
      setStats(null);
    }
  };

  const fetchUsersWithToken = async (authToken: string) => {
    try {
      const params = {
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      };

      const data = await apiClient.get('/admin/users', params);
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
      const data = await apiClient.get('/admin/stats');
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
      await apiClient.put(`/admin/users/${userId}/toggle-status`);
      fetchUsers();
    } catch (error) {
      // Silent error handling
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role });
      fetchUsers();
    } catch (error) {
      // Silent error handling
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.delete(`/admin/users/${userId}`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert(error.message || 'Failed to delete user');
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