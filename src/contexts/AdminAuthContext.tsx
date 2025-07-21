/**
 * Admin Authentication Context
 * Provides centralized auth state management to prevent logout issues
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface AdminAuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuthContext = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuthContext must be used within AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  const refreshAuth = async () => {
    const storedToken = localStorage.getItem('authToken');
    
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(storedToken);
      } else {
        logger.warn('Auth check failed with status:', response.status);
        // Only clear auth on 401/403 (authentication/authorization errors)
        // Don't clear on 404 (endpoint missing) or 500 (server errors)
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          setUser(null);
          setToken(null);
        } else {
          // For other errors (404, 500, etc), keep existing token and retry later
          logger.warn('Auth refresh failed but keeping existing session for retry');
          setToken(storedToken);
        }
      }
    } catch (error) {
      logger.error('Auth check failed with network error:', error);
      // On network errors, keep the token for retry but don't set user data
      setToken(storedToken);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    window.location.href = '/admin/login';
  };

  const value: AdminAuthContextType = {
    user,
    token,
    loading,
    isAdmin,
    login,
    logout,
    refreshAuth
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};