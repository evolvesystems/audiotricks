import { useState, useEffect } from 'react';
import ApiKeyService, { ApiKeyUsageStats, ApiKeyInfo } from '../../services/apikey.service';

interface KeyState {
  [provider: string]: {
    info: ApiKeyInfo | null;
    loading: boolean;
    editing: boolean;
    testing: boolean;
    usage: ApiKeyUsageStats | null;
    showUsage: boolean;
  };
}

const PROVIDERS = ['openai', 'elevenlabs'] as const;

/**
 * Custom hook for API key management logic
 */
export const useApiKeyManager = (onKeysUpdated?: () => void) => {
  const [keyStates, setKeyStates] = useState<KeyState>({});
  const [newKeys, setNewKeys] = useState<{ [provider: string]: string }>({});
  const [showKeys, setShowKeys] = useState<{ [provider: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize state for all providers
  useEffect(() => {
    const initialState: KeyState = {};
    PROVIDERS.forEach(provider => {
      initialState[provider] = {
        info: null,
        loading: false,
        editing: false,
        testing: false,
        usage: null,
        showUsage: false
      };
    });
    setKeyStates(initialState);
  }, []);

  // Load existing API keys
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = PROVIDERS.map(async (provider) => {
        try {
          const info = await ApiKeyService.getApiKeyInfo(provider);
          return { provider, info };
        } catch (err) {
          console.warn(`Failed to load ${provider} key:`, err);
          return { provider, info: null };
        }
      });

      const results = await Promise.all(promises);
      
      setKeyStates(prev => {
        const newState = { ...prev };
        results.forEach(({ provider, info }) => {
          if (newState[provider]) {
            newState[provider].info = info;
            newState[provider].loading = false;
          }
        });
        return newState;
      });
    } catch (err: any) {
      setError(`Failed to load API keys: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSaveKey = async (provider: string) => {
    const key = newKeys[provider]?.trim();
    
    if (!key) {
      setError('Please enter an API key');
      return;
    }

    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true }
    }));

    try {
      await ApiKeyService.saveApiKey(provider, key);
      
      // Reload the key info
      const info = await ApiKeyService.getApiKeyInfo(provider);
      
      setKeyStates(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          info,
          loading: false,
          editing: false
        }
      }));
      
      setNewKeys(prev => ({ ...prev, [provider]: '' }));
      setSuccess(`${provider.toUpperCase()} API key saved successfully`);
      
      onKeysUpdated?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to save ${provider} API key: ${err.message}`);
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false }
      }));
    }
  };

  const handleDeleteKey = async (provider: string) => {
    if (!confirm(`Are you sure you want to delete your ${provider.toUpperCase()} API key?`)) {
      return;
    }

    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true }
    }));

    try {
      await ApiKeyService.deleteApiKey(provider);
      
      setKeyStates(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          info: null,
          loading: false,
          editing: false,
          usage: null,
          showUsage: false
        }
      }));
      
      setSuccess(`${provider.toUpperCase()} API key deleted successfully`);
      
      onKeysUpdated?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete ${provider} API key: ${err.message}`);
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false }
      }));
    }
  };

  const handleTestKey = async (provider: string) => {
    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], testing: true }
    }));

    try {
      const result = await ApiKeyService.testApiKey(provider);
      
      if (result.valid) {
        setSuccess(`${provider.toUpperCase()} API key is working correctly`);
      } else {
        setError(`${provider.toUpperCase()} API key test failed: ${result.error}`);
      }
      
      // Clear messages after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    } catch (err: any) {
      setError(`Failed to test ${provider} API key: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], testing: false }
      }));
    }
  };

  const handleLoadUsage = async (provider: string) => {
    try {
      const usage = await ApiKeyService.getUsageStats(provider);
      
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], usage }
      }));
    } catch (err: any) {
      setError(`Failed to load usage stats for ${provider}: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const updateKeyState = (provider: string, updates: Partial<KeyState[string]>) => {
    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates }
    }));
  };

  const updateNewKey = (provider: string, key: string) => {
    setNewKeys(prev => ({ ...prev, [provider]: key }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return {
    keyStates,
    newKeys,
    showKeys,
    error,
    success,
    loading,
    PROVIDERS,
    loadApiKeys,
    clearMessages,
    handleSaveKey,
    handleDeleteKey,
    handleTestKey,
    handleLoadUsage,
    updateKeyState,
    updateNewKey,
    toggleShowKey
  };
};