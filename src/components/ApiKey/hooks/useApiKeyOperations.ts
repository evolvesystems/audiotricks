/**
 * API Key Operations Hook
 */

import { useState } from 'react';
import ApiKeyService from '../../../services/apikey.service';
import { ApiError } from '../../../services/api';
import { PROVIDERS } from '../types';
import { createDebugLogger } from '../../../utils/debug-logger';

const debug = createDebugLogger('api-key-operations');

export function useApiKeyOperations(
  updateKeyState: (provider: string, updates: any) => void,
  onKeysUpdated?: () => void
) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const response = await ApiKeyService.listApiKeys();
      
      // Reset all providers first
      PROVIDERS.forEach(provider => {
        updateKeyState(provider, { info: null });
      });
      
      // Update with loaded keys
      response.keys.forEach((key: any) => {
        updateKeyState(key.provider, { info: key });
      });
      
      debug.log('API keys loaded', { count: response.keys.length });
    } catch (error) {
      debug.error('Failed to load API keys', error);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async (provider: string, apiKey: string) => {
    updateKeyState(provider, { loading: true });
    clearMessages();
    
    try {
      await ApiKeyService.saveApiKey(provider, apiKey);
      await loadApiKeys();
      updateKeyState(provider, { editing: false });
      setSuccess(`${provider} API key saved successfully`);
      onKeysUpdated?.();
      debug.log('API key saved', { provider });
    } catch (error) {
      debug.error('Failed to save API key', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to save API key');
      }
    } finally {
      updateKeyState(provider, { loading: false });
    }
  };

  const deleteApiKey = async (provider: string) => {
    if (!confirm(`Are you sure you want to delete your ${provider} API key?`)) {
      return;
    }
    
    updateKeyState(provider, { loading: true });
    clearMessages();
    
    try {
      await ApiKeyService.deleteApiKey(provider);
      await loadApiKeys();
      setSuccess(`${provider} API key deleted successfully`);
      onKeysUpdated?.();
      debug.log('API key deleted', { provider });
    } catch (error) {
      debug.error('Failed to delete API key', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to delete API key');
      }
    } finally {
      updateKeyState(provider, { loading: false });
    }
  };

  const testApiKey = async (provider: string, apiKey?: string) => {
    updateKeyState(provider, { testing: true });
    clearMessages();
    
    try {
      const result = await ApiKeyService.testApiKey(provider, apiKey);
      
      if (result.valid) {
        setSuccess(`${provider} API key is valid`);
      } else {
        setError(`${provider} API key test failed: ${result.error}`);
      }
      
      debug.log('API key tested', { provider, valid: result.valid });
      return result;
    } catch (error) {
      debug.error('API key test failed', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('API key test failed');
      }
      return { valid: false, error: 'Test failed' };
    } finally {
      updateKeyState(provider, { testing: false });
    }
  };

  const loadUsage = async (provider: string) => {
    updateKeyState(provider, { loading: true });
    
    try {
      const usage = await ApiKeyService.getUsage(provider);
      updateKeyState(provider, { usage, showUsage: true });
      debug.log('Usage loaded', { provider, usage });
    } catch (error) {
      debug.error('Failed to load usage', error);
      setError(`Failed to load ${provider} usage data`);
    } finally {
      updateKeyState(provider, { loading: false });
    }
  };

  return {
    error,
    success,
    loading,
    clearMessages,
    loadApiKeys,
    saveApiKey,
    deleteApiKey,
    testApiKey,
    loadUsage
  };
}