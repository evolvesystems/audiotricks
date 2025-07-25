/**
 * API Client Tests
 * Tests for the centralized API client and token manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient, tokenManager, ApiError } from '../../services/api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = mockLocalStorage as any;

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn();
global.window = { dispatchEvent: mockDispatchEvent } as any;

describe('TokenManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should load token from localStorage on initialization', () => {
      mockLocalStorage.getItem.mockReturnValue('stored-token');
      
      // Create new instance to test constructor
      const { TokenManager } = require('../../services/api');
      const manager = new TokenManager();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken');
      expect(manager.getToken()).toBe('stored-token');
    });

    it('should handle missing token in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const { TokenManager } = require('../../services/api');
      const manager = new TokenManager();
      
      expect(manager.getToken()).toBeNull();
    });
  });

  describe('setToken', () => {
    it('should set token and store in localStorage', () => {
      tokenManager.setToken('new-token');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(tokenManager.getToken()).toBe('new-token');
    });

    it('should remove token when setting null', () => {
      tokenManager.setToken(null);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(tokenManager.getToken()).toBeNull();
    });
  });

  describe('clearToken', () => {
    it('should clear token and remove from localStorage', () => {
      tokenManager.setToken('some-token');
      tokenManager.clearToken();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(tokenManager.getToken()).toBeNull();
    });
  });

  describe('getAuthHeaders', () => {
    it('should return auth headers when token exists', () => {
      tokenManager.setToken('test-token');
      
      const headers = tokenManager.getAuthHeaders();
      
      expect(headers).toEqual({
        'Authorization': 'Bearer test-token'
      });
    });

    it('should return empty headers when no token', () => {
      tokenManager.clearToken();
      
      const headers = tokenManager.getAuthHeaders();
      
      expect(headers).toEqual({});
    });
  });
});

describe('ApiClient', () => {
  const mockResponse = {
    ok: true,
    status: 200,
    headers: new Map([['content-type', 'application/json']]),
    json: vi.fn(),
    text: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tokenManager.setToken('test-token');
    mockResponse.json.mockResolvedValue({ success: true });
    mockResponse.text.mockResolvedValue('success');
  });

  describe('GET requests', () => {
    it('should make GET request with auth headers', async () => {
      mockFetch.mockResolvedValue(mockResponse);
      
      await apiClient.get('/test-endpoint');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValue(mockResponse);
      
      await apiClient.get('/test-endpoint', { param1: 'value1', param2: 'value2' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint?param1=value1&param2=value2'),
        expect.any(Object)
      );
    });

    it('should return JSON response', async () => {
      const responseData = { data: 'test' };
      mockResponse.json.mockResolvedValue(responseData);
      mockFetch.mockResolvedValue(mockResponse);
      
      const result = await apiClient.get('/test-endpoint');
      
      expect(result).toEqual(responseData);
    });
  });

  describe('POST requests', () => {
    it('should make POST request with data', async () => {
      mockFetch.mockResolvedValue(mockResponse);
      const testData = { name: 'test' };
      
      await apiClient.post('/test-endpoint', testData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should handle POST without data', async () => {
      mockFetch.mockResolvedValue(mockResponse);
      
      await apiClient.post('/test-endpoint');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'POST',
          body: undefined
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request with data', async () => {
      mockFetch.mockResolvedValue(mockResponse);
      const testData = { name: 'updated' };
      
      await apiClient.put('/test-endpoint', testData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(testData)
        })
      );
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValue(mockResponse);
      
      await apiClient.delete('/test-endpoint');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle 401 errors and clear token', async () => {
      const errorResponse = {
        ok: false,
        status: 401,
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      };
      
      mockFetch.mockResolvedValue(errorResponse);
      
      await expect(apiClient.get('/test-endpoint'))
        .rejects
        .toThrow('Unauthorized');
      
      expect(tokenManager.getToken()).toBeNull();
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:logout' })
      );
    });

    it('should handle 429 quota errors with suggestion', async () => {
      const errorResponse = {
        ok: false,
        status: 429,
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({
          message: 'Quota exceeded',
          suggestion: 'Please upgrade your plan'
        })
      };
      
      mockFetch.mockResolvedValue(errorResponse);
      
      try {
        await apiClient.get('/test-endpoint');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(429);
        expect(error.message).toBe('Quota exceeded');
        expect(error.suggestion).toBe('Please upgrade your plan');
      }
    });

    it('should handle network errors', async () => {
      const networkError = new TypeError('Failed to fetch');
      mockFetch.mockRejectedValue(networkError);
      
      await expect(apiClient.get('/test-endpoint'))
        .rejects
        .toThrow('Network error. Please check your connection.');
    });

    it('should handle non-JSON responses', async () => {
      const textResponse = {
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'text/plain']]),
        text: vi.fn().mockResolvedValue('Internal Server Error')
      };
      
      mockFetch.mockResolvedValue(textResponse);
      
      await expect(apiClient.get('/test-endpoint'))
        .rejects
        .toThrow('HTTP 500');
    });

    it('should handle generic server errors', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ error: 'Internal Server Error' })
      };
      
      mockFetch.mockResolvedValue(errorResponse);
      
      try {
        await apiClient.get('/test-endpoint');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(500);
        expect(error.message).toBe('Internal Server Error');
      }
    });
  });

  describe('File upload', () => {
    it('should upload file with progress tracking', async () => {
      const mockFormData = new FormData();
      mockFormData.append('file', new File(['test'], 'test.txt'));
      
      const onProgress = vi.fn();
      
      // Mock XMLHttpRequest
      const mockXHR = {
        upload: {
          addEventListener: vi.fn()
        },
        addEventListener: vi.fn(),
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(),
        status: 200,
        responseText: JSON.stringify({ success: true })
      };
      
      global.XMLHttpRequest = vi.fn(() => mockXHR) as any;
      
      // Simulate successful upload
      setTimeout(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )[1];
        loadHandler();
      }, 0);
      
      const result = await apiClient.uploadFile('/upload', mockFormData, onProgress);
      
      expect(mockXHR.open).toHaveBeenCalledWith('POST', expect.stringContaining('/upload'));
      expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
      expect(mockXHR.send).toHaveBeenCalledWith(mockFormData);
    });

    it('should handle upload errors', async () => {
      const mockFormData = new FormData();
      const mockXHR = {
        upload: { addEventListener: vi.fn() },
        addEventListener: vi.fn(),
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(),
        status: 400,
        responseText: JSON.stringify({ error: 'File too large' })
      };
      
      global.XMLHttpRequest = vi.fn(() => mockXHR) as any;
      
      setTimeout(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )[1];
        loadHandler();
      }, 0);
      
      await expect(apiClient.uploadFile('/upload', mockFormData))
        .rejects
        .toThrow('File too large');
    });

    it('should handle upload network errors', async () => {
      const mockFormData = new FormData();
      const mockXHR = {
        upload: { addEventListener: vi.fn() },
        addEventListener: vi.fn(),
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn()
      };
      
      global.XMLHttpRequest = vi.fn(() => mockXHR) as any;
      
      setTimeout(() => {
        const errorHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'error'
        )[1];
        errorHandler();
      }, 0);
      
      await expect(apiClient.uploadFile('/upload', mockFormData))
        .rejects
        .toThrow('Network error during upload');
    });
  });

  describe('Response handling', () => {
    it('should handle text responses', async () => {
      const textResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/plain']]),
        text: vi.fn().mockResolvedValue('Plain text response')
      };
      
      mockFetch.mockResolvedValue(textResponse);
      
      const result = await apiClient.get('/test-endpoint');
      
      expect(result).toBe('Plain text response');
    });

    it('should handle missing content-type', async () => {
      const responseWithoutContentType = {
        ok: true,
        status: 200,
        headers: new Map(),
        text: vi.fn().mockResolvedValue('No content type')
      };
      
      mockFetch.mockResolvedValue(responseWithoutContentType);
      
      const result = await apiClient.get('/test-endpoint');
      
      expect(result).toBe('No content type');
    });
  });

  describe('Request configuration', () => {
    it('should merge custom headers', async () => {
      mockFetch.mockResolvedValue(mockResponse);
      
      await apiClient.get('/test-endpoint');
      
      // Check that auth headers are included with Content-Type
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should work without auth token', async () => {
      tokenManager.clearToken();
      mockFetch.mockResolvedValue(mockResponse);
      
      await apiClient.get('/test-endpoint');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      
      // Should not include Authorization header
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers).not.toHaveProperty('Authorization');
    });
  });
});