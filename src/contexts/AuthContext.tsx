// Unified authentication context
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { logger } from '../utils/logger';
import AuthService, { AuthResponse } from '../services/auth.service';
import { tokenManager, ApiError, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'username' | 'email'>>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  error: string | null;
  clearError: () => void;
}

// Create fallback context values to prevent crashes
const fallbackContextValue: AuthContextType = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
  login: async () => { throw new Error('AuthProvider not ready'); },
  register: async () => { throw new Error('AuthProvider not ready'); },
  logout: async () => { throw new Error('AuthProvider not ready'); },
  checkAuth: async () => { throw new Error('AuthProvider not ready'); },
  updateProfile: async () => { throw new Error('AuthProvider not ready'); },
  changePassword: async () => { throw new Error('AuthProvider not ready'); },
  setUser: () => { console.warn('AuthProvider not ready'); },
  setToken: () => { console.warn('AuthProvider not ready'); },
  error: null,
  clearError: () => { console.warn('AuthProvider not ready'); }
};

const AuthContext = createContext<AuthContextType>(fallbackContextValue);

export function useAuth() {
  const context = useContext(AuthContext);
  // Context always has fallback values, so this should never be null
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = !!user && !!token;

  const clearError = () => setError(null);

  const handleAuthError = (error: any) => {
    if (error instanceof ApiError) {
      setError(error.message);
      
      // Auto-clear auth errors after 5 seconds
      setTimeout(() => setError(null), 5000);
    } else {
      setError('An unexpected error occurred');
      logger.error('Auth error:', error);
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await AuthService.checkAuth();
      setUser(user);
      setToken(tokenManager.getToken());
    } catch (error) {
      setUser(null);
      setToken(null);
      // Don't show error for auth check failures on load
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await AuthService.login({ email, password });
      setUser(response.user);
      setToken(response.token);
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string) => {
    setLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await AuthService.register({ email, password, username });
      setUser(response.user);
      setToken(response.token);
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await AuthService.logout();
    } catch (error) {
      logger.error('Logout error:', error);
      // Don't show error for logout failures
    } finally {
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'username' | 'email'>>) => {
    setError(null);

    try {
      const updatedUser = await AuthService.updateProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setError(null);

    try {
      await AuthService.changePassword(currentPassword, newPassword);
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Listen for auth logout events from API errors
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      setToken(null);
      setError('Your session has expired. Please log in again.');
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  // Check auth on mount and mark as initialized when complete
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        logger.error('Failed to initialize auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    changePassword,
    setUser,
    setToken,
    error,
    clearError
  };

  // Always render AuthContext.Provider to prevent useAuth warnings
  // Show loading screen until initialized
  return (
    <AuthContext.Provider value={value}>
      {!isInitialized ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Initializing...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}