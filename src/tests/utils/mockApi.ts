// API mocking utilities for tests
import { vi } from 'vitest';

export function mockFetch(responses: Array<{ ok: boolean; status?: number; data: any }>) {
  let callIndex = 0;
  
  return vi.fn().mockImplementation(() => {
    const response = responses[callIndex] || responses[responses.length - 1];
    callIndex++;
    
    return Promise.resolve({
      ok: response.ok,
      status: response.status || (response.ok ? 200 : 400),
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
      headers: new Headers()
    });
  });
}

export function mockApiRequest(response: any) {
  return vi.fn().mockResolvedValue(response);
}

export function mockAuthenticatedUser() {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user'
  };
}

export function mockAdminUser() {
  return {
    id: 'admin-user-id',
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin'
  };
}

export function mockWorkspace() {
  return {
    id: 'workspace-1',
    name: 'Test Workspace',
    slug: 'test-workspace',
    description: 'A test workspace',
    isActive: true,
    createdAt: new Date().toISOString(),
    _count: {
      users: 5,
      audioHistory: 10
    }
  };
}

export function mockAudioProcessingResponse() {
  return {
    transcription: 'This is a test transcription',
    summary: 'This is a test summary',
    metadata: {
      fileName: 'test.mp3',
      fileSize: 1024000,
      duration: 60,
      processingTime: 5000,
      summaryStyle: 'formal' as const,
      outputLanguage: 'en',
      timestamp: new Date().toISOString()
    }
  };
}