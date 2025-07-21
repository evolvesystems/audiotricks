import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
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
          if (response.status === 401) {
            localStorage.removeItem('authToken');
            setUser(null);
            setToken(null);
          }
        }
      } catch (error) {
        logger.error('Auth check failed:', error);
        // Don't remove token on network errors, only on auth errors
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
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
  };

  return {
    user,
    token,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    logout
  };
}