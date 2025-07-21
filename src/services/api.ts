import { config } from '../config/env';

// Base API configuration
const API_BASE_URL = config.apiUrl || (config.isDevelopment ? 'http://localhost:3001/api' : '/api');

// Types for API responses
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  users?: Array<{
    id: string;
    userId: string;
    role: string;
    permissions: Record<string, any>;
  }>;
}

export interface Upload {
  id: string;
  originalFileName: string;
  fileSize: string;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadProgress: number;
  storageUrl?: string;
  cdnUrl?: string;
  createdAt: string;
  updatedAt: string;
  workspace?: {
    id: string;
    name: string;
  };
}

export interface ProcessingJob {
  id: string;
  type: 'transcription' | 'summary' | 'analysis';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  upload: {
    fileName: string;
    fileSize: string;
    workspace: string;
  };
  audioHistory?: {
    id: string;
    title: string;
  };
}

export interface ApiKeyInfo {
  id: string;
  provider: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
}

export interface UsageData {
  storage: {
    used: string;
    limit: string;
    percentUsed: number;
  };
  processing: {
    used: number;
    limit: number;
    percentUsed: number;
  };
  apiCalls: {
    used: number;
    limit: number;
    percentUsed: number;
  };
  transcription: {
    used: number;
    limit: number;
    percentUsed: number;
  };
  aiTokens: {
    used: number;
    limit: number;
    percentUsed: number;
  };
}

// Enhanced API Error class
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isQuotaError() {
    return this.status === 429;
  }

  get isAuthError() {
    return this.status === 401;
  }

  get isForbiddenError() {
    return this.status === 403;
  }

  get isNotFoundError() {
    return this.status === 404;
  }

  get isValidationError() {
    return this.status === 400;
  }
}

// Token management
class TokenManager {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }
}

const tokenManager = new TokenManager();

// Base API client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      let responseData: any;
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          tokenManager.clearToken();
          // Dispatch custom event for auth error
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        // Handle quota errors specially
        if (response.status === 429) {
          throw new ApiError(
            response.status,
            responseData.message || 'Quota exceeded',
            responseData,
            responseData.suggestion
          );
        }

        throw new ApiError(
          response.status,
          responseData.error || responseData.message || `HTTP ${response.status}`,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'Network error. Please check your connection.');
      }

      throw new ApiError(500, 'An unexpected error occurred');
    }
  }

  // HTTP methods
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload method
  async uploadFile<T = any>(
    endpoint: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new ApiError(xhr.status, 'Invalid response format'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new ApiError(
              xhr.status,
              errorData.error || errorData.message || `HTTP ${xhr.status}`,
              errorData
            ));
          } catch (error) {
            reject(new ApiError(xhr.status, `HTTP ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError(0, 'Network error during upload'));
      });

      xhr.open('POST', `${this.baseUrl}${endpoint}`);
      
      // Add auth header
      const token = tokenManager.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export token manager for auth context
export { tokenManager };