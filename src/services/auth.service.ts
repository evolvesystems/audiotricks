import { apiClient, tokenManager, ApiError, User } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  /**
   * Login user
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      // Store token
      tokenManager.setToken(response.token);
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        // Enhance login-specific error messages
        if (error.status === 401) {
          throw new ApiError(401, 'Invalid email or password');
        }
        if (error.status === 429) {
          throw new ApiError(429, 'Too many login attempts. Please try again later.');
        }
      }
      throw error;
    }
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      
      // Store token
      tokenManager.setToken(response.token);
      
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        // Handle validation errors
        throw new ApiError(400, error.message || 'Registration failed. Please check your input.');
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors, just clear local storage
      console.warn('Logout request failed:', error);
    } finally {
      tokenManager.clearToken();
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  /**
   * Check if user is authenticated
   */
  static async checkAuth(): Promise<User | null> {
    const token = tokenManager.getToken();
    if (!token) {
      return null;
    }

    try {
      return await this.getCurrentUser();
    } catch (error) {
      if (error instanceof ApiError && error.isAuthError) {
        tokenManager.clearToken();
        return null;
      }
      throw error;
    }
  }

  /**
   * Refresh token (if needed in the future)
   */
  static async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ token: string }>('/auth/refresh');
    tokenManager.setToken(response.token);
    return response.token;
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset', { email });
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password-reset/confirm', {
      token,
      password: newPassword
    });
  }

  /**
   * Change password (authenticated user)
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  /**
   * Update profile
   */
  static async updateProfile(updates: Partial<Pick<User, 'username' | 'email'>>): Promise<User> {
    return apiClient.put<User>('/auth/profile', updates);
  }

  /**
   * Delete account
   */
  static async deleteAccount(password: string): Promise<void> {
    await apiClient.post('/auth/delete-account', { password });
    tokenManager.clearToken();
  }
}

export default AuthService;