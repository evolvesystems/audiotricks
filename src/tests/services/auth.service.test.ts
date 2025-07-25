/**
 * Auth Service Tests
 * Tests for the centralized authentication service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AuthService from '../../services/auth.service';
import { apiClient, tokenManager, ApiError } from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn()
  },
  tokenManager: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    getToken: vi.fn()
  },
  ApiError: class MockApiError extends Error {
    constructor(public status: number, message: string, public details?: any, public suggestion?: string) {
      super(message);
      this.name = 'ApiError';
    }
    
    get isAuthError() { return this.status === 401; }
    get isNotFoundError() { return this.status === 404; }
    get isValidationError() { return this.status === 400; }
    get isQuotaError() { return this.status === 429; }
    get isForbiddenError() { return this.status === 403; }
  }
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('AuthService', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully', async () => {
      const mockResponse = {
        user: mockUser,
        token: mockToken
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await AuthService.login(loginCredentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginCredentials);
      expect(tokenManager.setToken).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid credentials', async () => {
      const error = new ApiError(401, 'Unauthorized');
      (apiClient.post as any).mockRejectedValue(error);

      await expect(AuthService.login(loginCredentials))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('should handle too many attempts', async () => {
      const error = new ApiError(429, 'Too Many Requests');
      (apiClient.post as any).mockRejectedValue(error);

      await expect(AuthService.login(loginCredentials))
        .rejects
        .toThrow('Too many login attempts. Please try again later.');
    });

    it('should pass through other API errors', async () => {
      const error = new ApiError(500, 'Internal Server Error');
      (apiClient.post as any).mockRejectedValue(error);

      await expect(AuthService.login(loginCredentials))
        .rejects
        .toThrow('Internal Server Error');
    });

    it('should pass through non-API errors', async () => {
      const error = new Error('Network error');
      (apiClient.post as any).mockRejectedValue(error);

      await expect(AuthService.login(loginCredentials))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser'
    };

    it('should register successfully', async () => {
      const mockResponse = {
        user: mockUser,
        token: mockToken
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await AuthService.register(registerData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(tokenManager.setToken).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      const error = new ApiError(400, 'Email already exists');
      (apiClient.post as any).mockRejectedValue(error);

      await expect(AuthService.register(registerData))
        .rejects
        .toThrow('Email already exists');
    });

    it('should handle generic validation errors', async () => {
      const error = new ApiError(400, '');
      (apiClient.post as any).mockRejectedValue(error);

      await expect(AuthService.register(registerData))
        .rejects
        .toThrow('Registration failed. Please check your input.');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (apiClient.post as any).mockResolvedValue({});

      await AuthService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(tokenManager.clearToken).toHaveBeenCalled();
    });

    it('should clear token even if API call fails', async () => {
      const error = new Error('Network error');
      (apiClient.post as any).mockRejectedValue(error);

      await AuthService.logout();

      expect(tokenManager.clearToken).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      (apiClient.get as any).mockResolvedValue(mockUser);

      const result = await AuthService.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('should handle auth errors', async () => {
      const error = new ApiError(401, 'Unauthorized');
      (apiClient.get as any).mockRejectedValue(error);

      await expect(AuthService.getCurrentUser())
        .rejects
        .toThrow('Unauthorized');
    });
  });

  describe('checkAuth', () => {
    it('should return null when no token', async () => {
      (tokenManager.getToken as any).mockReturnValue(null);

      const result = await AuthService.checkAuth();

      expect(result).toBeNull();
    });

    it('should return user when token is valid', async () => {
      (tokenManager.getToken as any).mockReturnValue(mockToken);
      (apiClient.get as any).mockResolvedValue(mockUser);

      const result = await AuthService.checkAuth();

      expect(result).toEqual(mockUser);
    });

    it('should clear token and return null on auth error', async () => {
      (tokenManager.getToken as any).mockReturnValue(mockToken);
      const error = new ApiError(401, 'Unauthorized');
      (apiClient.get as any).mockRejectedValue(error);

      const result = await AuthService.checkAuth();

      expect(tokenManager.clearToken).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should throw non-auth errors', async () => {
      (tokenManager.getToken as any).mockReturnValue(mockToken);
      const error = new ApiError(500, 'Server Error');
      (apiClient.get as any).mockRejectedValue(error);

      await expect(AuthService.checkAuth())
        .rejects
        .toThrow('Server Error');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const newToken = 'new-jwt-token';
      (apiClient.post as any).mockResolvedValue({ token: newToken });

      const result = await AuthService.refreshToken();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(tokenManager.setToken).toHaveBeenCalledWith(newToken);
      expect(result).toBe(newToken);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      (apiClient.post as any).mockResolvedValue({});

      await AuthService.requestPasswordReset('test@example.com');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/password-reset', {
        email: 'test@example.com'
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      (apiClient.post as any).mockResolvedValue({});

      await AuthService.resetPassword('reset-token', 'newpassword');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/password-reset/confirm', {
        token: 'reset-token',
        password: 'newpassword'
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      (apiClient.put as any).mockResolvedValue({});

      await AuthService.changePassword('oldpassword', 'newpassword');

      expect(apiClient.put).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword'
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updates = { username: 'newusername', email: 'new@example.com' };
      const updatedUser = { ...mockUser, ...updates };
      
      (apiClient.put as any).mockResolvedValue(updatedUser);

      const result = await AuthService.updateProfile(updates);

      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', updates);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      (apiClient.post as any).mockResolvedValue({});

      await AuthService.deleteAccount('password');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/delete-account', {
        password: 'password'
      });
      expect(tokenManager.clearToken).toHaveBeenCalled();
    });
  });
});

describe('ApiError Class', () => {
  it('should identify auth errors correctly', () => {
    const authError = new ApiError(401, 'Unauthorized');
    expect(authError.isAuthError).toBe(true);
    expect(authError.isNotFoundError).toBe(false);
  });

  it('should identify not found errors correctly', () => {
    const notFoundError = new ApiError(404, 'Not Found');
    expect(notFoundError.isNotFoundError).toBe(true);
    expect(authError.isAuthError).toBe(false);
  });

  it('should identify validation errors correctly', () => {
    const validationError = new ApiError(400, 'Bad Request');
    expect(validationError.isValidationError).toBe(true);
    expect(validationError.isAuthError).toBe(false);
  });

  it('should identify quota errors correctly', () => {
    const quotaError = new ApiError(429, 'Too Many Requests');
    expect(quotaError.isQuotaError).toBe(true);
    expect(quotaError.isAuthError).toBe(false);
  });

  it('should identify forbidden errors correctly', () => {
    const forbiddenError = new ApiError(403, 'Forbidden');
    expect(forbiddenError.isForbiddenError).toBe(true);
    expect(forbiddenError.isAuthError).toBe(false);
  });

  it('should store error details and suggestions', () => {
    const error = new ApiError(400, 'Validation Error', { field: 'email' }, 'Please check your email format');
    
    expect(error.details).toEqual({ field: 'email' });
    expect(error.suggestion).toBe('Please check your email format');
  });
});