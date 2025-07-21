import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiKeys } from '../../hooks/useApiKeys';
import ApiKeyService from '../../services/apikey.service';

// Mock the API key service
vi.mock('../../services/apikey.service', () => ({
  default: {
    getAllApiKeys: vi.fn(),
    getApiKeyInfo: vi.fn(),
    validateApiKey: vi.fn(),
    saveApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
    updateApiKey: vi.fn(),
  },
}));

/**
 * Test suite for useApiKeys hook - API key management state
 * Follows CLAUDE.md requirements: expected use, edge case, failure case
 */

describe('useApiKeys Hook', () => {
  const mockApiKeyService = vi.mocked(ApiKeyService);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockImplementation(() => {});
  });

  test('expected use case - loads API keys on mount', async () => {
    const mockKeys = {
      openai: { value: 'sk-test...', isValid: true, lastValidated: new Date() },
      elevenlabs: { value: 'test-key', isValid: true, lastValidated: new Date() }
    };

    mockApiKeyService.getAllApiKeys.mockResolvedValue(mockKeys);

    const { result } = renderHook(() => useApiKeys());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.keys).toEqual({});

    // Wait for keys to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.keys).toEqual(mockKeys);
    expect(result.current.error).toBeNull();
  });

  test('expected use case - saves new API key successfully', async () => {
    mockApiKeyService.getAllApiKeys.mockResolvedValue({});
    mockApiKeyService.saveApiKey.mockResolvedValue({ success: true });
    mockApiKeyService.validateApiKey.mockResolvedValue({ isValid: true });

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.saveKey('openai', 'sk-test-key');
    });

    expect(mockApiKeyService.saveApiKey).toHaveBeenCalledWith('openai', 'sk-test-key');
    expect(mockApiKeyService.validateApiKey).toHaveBeenCalledWith('openai', 'sk-test-key');
    expect(result.current.error).toBeNull();
  });

  test('expected use case - validates API key before saving', async () => {
    mockApiKeyService.getAllApiKeys.mockResolvedValue({});
    mockApiKeyService.validateApiKey.mockResolvedValue({ isValid: true });
    mockApiKeyService.saveApiKey.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const isValid = await act(async () => {
      return await result.current.validateKey('openai', 'sk-test-key');
    });

    expect(isValid).toBe(true);
    expect(mockApiKeyService.validateApiKey).toHaveBeenCalledWith('openai', 'sk-test-key');
  });

  test('expected use case - deletes API key successfully', async () => {
    const mockKeys = {
      openai: { value: 'sk-test...', isValid: true, lastValidated: new Date() }
    };

    mockApiKeyService.getAllApiKeys.mockResolvedValue(mockKeys);
    mockApiKeyService.deleteApiKey.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.deleteKey('openai');
    });

    expect(mockApiKeyService.deleteApiKey).toHaveBeenCalledWith('openai');
  });

  test('edge case - handles key validation during save', async () => {
    mockApiKeyService.getAllApiKeys.mockResolvedValue({});
    mockApiKeyService.validateApiKey.mockResolvedValue({ isValid: false, error: 'Invalid key format' });

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.saveKey('openai', 'invalid-key');
    });

    expect(result.current.error).toBe('Invalid key format');
    expect(mockApiKeyService.saveApiKey).not.toHaveBeenCalled();
  });

  test('edge case - tracks validation status correctly', async () => {
    const mockKeys = {
      openai: { value: 'sk-test...', isValid: true, lastValidated: new Date() },
      elevenlabs: { value: 'invalid-key', isValid: false, lastValidated: new Date() }
    };

    mockApiKeyService.getAllApiKeys.mockResolvedValue(mockKeys);

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.hasValidKey('openai')).toBe(true);
    expect(result.current.hasValidKey('elevenlabs')).toBe(false);
    expect(result.current.hasValidKey('nonexistent')).toBe(false);
  });

  test('edge case - refreshes keys manually', async () => {
    const initialKeys = {
      openai: { value: 'sk-old...', isValid: true, lastValidated: new Date() }
    };
    const updatedKeys = {
      openai: { value: 'sk-new...', isValid: true, lastValidated: new Date() }
    };

    mockApiKeyService.getAllApiKeys
      .mockResolvedValueOnce(initialKeys)
      .mockResolvedValueOnce(updatedKeys);

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.keys).toEqual(initialKeys);

    await act(async () => {
      await result.current.refreshKeys();
    });

    expect(result.current.keys).toEqual(updatedKeys);
    expect(mockApiKeyService.getAllApiKeys).toHaveBeenCalledTimes(2);
  });

  test('failure case - handles API service errors gracefully', async () => {
    mockApiKeyService.getAllApiKeys.mockRejectedValue(new Error('Service unavailable'));

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to load API keys');
    expect(result.current.keys).toEqual({});
  });

  test('failure case - handles save operation failures', async () => {
    mockApiKeyService.getAllApiKeys.mockResolvedValue({});
    mockApiKeyService.validateApiKey.mockResolvedValue({ isValid: true });
    mockApiKeyService.saveApiKey.mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.saveKey('openai', 'sk-test-key');
    });

    expect(result.current.error).toBe('Failed to save API key');
  });

  test('failure case - handles validation errors', async () => {
    mockApiKeyService.getAllApiKeys.mockResolvedValue({});
    mockApiKeyService.validateApiKey.mockRejectedValue(new Error('Validation service down'));

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const isValid = await act(async () => {
      return await result.current.validateKey('openai', 'sk-test-key');
    });

    expect(isValid).toBe(false);
    expect(result.current.error).toBe('Validation service down');
  });

  test('edge case - handles concurrent operations', async () => {
    mockApiKeyService.getAllApiKeys.mockResolvedValue({});
    mockApiKeyService.saveApiKey.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    mockApiKeyService.validateApiKey.mockResolvedValue({ isValid: true });

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Start multiple save operations simultaneously
    const promises = [
      result.current.saveKey('openai', 'sk-key-1'),
      result.current.saveKey('elevenlabs', 'el-key-1'),
    ];

    await act(async () => {
      await Promise.all(promises);
    });

    expect(mockApiKeyService.saveApiKey).toHaveBeenCalledTimes(2);
  });

  test('edge case - maintains key list consistency', async () => {
    const mockKeys = {
      openai: { value: 'sk-test...', isValid: true, lastValidated: new Date() }
    };

    mockApiKeyService.getAllApiKeys.mockResolvedValue(mockKeys);
    mockApiKeyService.deleteApiKey.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.getKeyList()).toEqual(['openai']);

    await act(async () => {
      await result.current.deleteKey('openai');
    });

    // Should remove key from local state immediately
    expect(result.current.getKeyList()).toEqual([]);
  });

  test('failure case - handles delete operation failures', async () => {
    const mockKeys = {
      openai: { value: 'sk-test...', isValid: true, lastValidated: new Date() }
    };

    mockApiKeyService.getAllApiKeys.mockResolvedValue(mockKeys);
    mockApiKeyService.deleteApiKey.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.deleteKey('openai');
    });

    expect(result.current.error).toBe('Failed to delete API key');
    // Key should still be present after failed delete
    expect(result.current.getKeyList()).toEqual(['openai']);
  });
});