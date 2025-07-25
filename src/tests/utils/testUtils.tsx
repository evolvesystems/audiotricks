/**
 * Test Utilities - Common testing helpers and setup
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock API Client
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  uploadFile: vi.fn()
};

// Mock Auth Service
export const mockTokenManager = {
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getAuthHeaders: vi.fn(() => ({ 'Authorization': 'Bearer mock-token' }))
};

// Test Wrapper with Router
interface WrapperProps {
  children: React.ReactNode;
}

const TestWrapper: React.FC<WrapperProps> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// Custom render function
export const renderWithRouter = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

// Mock user data
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  role: 'user',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// Mock admin user data
export const mockAdminUser = {
  ...mockUser,
  id: 'admin-1',
  email: 'admin@example.com',
  username: 'admin',
  role: 'admin'
};

// Mock project data
export const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  description: 'A test project',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  jobCount: 5,
  completedJobs: 3,
  status: 'active' as const,
  totalDuration: 1200 // 20 minutes
};

// Mock job data
export const mockJob = {
  id: 'job-1',
  fileName: 'test-audio.mp3',
  originalFileName: 'Test Audio File.mp3',
  projectId: 'project-1',
  projectName: 'Test Project',
  status: 'completed' as const,
  createdAt: '2024-01-01T00:00:00Z',
  completedAt: '2024-01-01T00:35:00Z',
  duration: 1847,
  fileSize: 25600000,
  confidence: 0.94,
  language: 'English (US)',
  processingTime: 45,
  wordCount: 3420,
  speakerCount: 4
};

// Mock API responses
export const mockApiResponses = {
  projects: {
    projects: [mockProject]
  },
  user: mockUser,
  job: mockJob
};

// Setup common mocks
export const setupMocks = () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn((key: string) => {
      if (key === 'authToken') return 'mock-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  };
  
  global.localStorage = localStorageMock as any;

  // Mock API client responses
  mockApiClient.get.mockResolvedValue(mockApiResponses);
  mockApiClient.post.mockResolvedValue({ success: true });
  mockApiClient.put.mockResolvedValue({ success: true });
  mockApiClient.delete.mockResolvedValue({ success: true });

  // Mock token manager
  mockTokenManager.getToken.mockReturnValue('mock-token');
  mockTokenManager.getAuthHeaders.mockReturnValue({
    'Authorization': 'Bearer mock-token'
  });

  return {
    localStorage: localStorageMock,
    apiClient: mockApiClient,
    tokenManager: mockTokenManager
  };
};

// Cleanup mocks
export const cleanupMocks = () => {
  vi.clearAllMocks();
  mockApiClient.get.mockReset();
  mockApiClient.post.mockReset();
  mockApiClient.put.mockReset();
  mockApiClient.delete.mockReset();
  mockTokenManager.getToken.mockReset();
  mockTokenManager.setToken.mockReset();
  mockTokenManager.clearToken.mockReset();
  mockTokenManager.getAuthHeaders.mockReset();
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock form data
export const createMockFormData = (data: Record<string, any>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
  });
  return formData;
};

// Mock file
export const createMockFile = (name = 'test.mp3', size = 1024, type = 'audio/mpeg') => {
  return new File(['test content'], name, { type, lastModified: Date.now() });
};

// Mock error
export const createMockApiError = (status = 500, message = 'Test error') => {
  const error = new Error(message) as any;
  error.status = status;
  error.isNotFoundError = status === 404;
  error.isAuthError = status === 401;
  error.isValidationError = status === 400;
  return error;
};