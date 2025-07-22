import { useState, useEffect } from 'react';
import ApiKeyService from '../../services/apikey.service';
import { ApiError } from '../../services/api';
import { KeyState, PROVIDERS } from './types';
import { logger } from '../../utils/logger';

export function useApiKeyManager(onKeysUpdated?: () => void) {
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
    try {
      const response = await ApiKeyService.listApiKeys();
      
      setKeyStates(prev => {
        const newState = { ...prev };
        
        // Reset all providers
        PROVIDERS.forEach(provider => {
          if (newState[provider]) {
            newState[provider].info = null;
          }
        });
        
        // Set existing keys
        response.keys.forEach(key => {
          if (newState[key.provider]) {
            newState[key.provider].info = key;
          }
        });
        
        return newState;
      });
    } catch (error) {
      logger.error('Failed to load API keys:', error);
      setError('Failed to load API keys');
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

    // Validate format
    const validation = ApiKeyService.validateApiKeyFormat(provider, key);
    if (!validation.valid) {
      setError(validation.error || 'Invalid API key format');
      return;
    }

    clearMessages();
    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true }
    }));

    try {
      await ApiKeyService.saveApiKey(provider, key);
      
      setSuccess(`${ApiKeyService.getProviderInfo(provider).name} API key saved successfully`);
      setNewKeys(prev => ({ ...prev, [provider]: '' }));
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false, editing: false }
      }));
      
      await loadApiKeys();
      
      if (onKeysUpdated) {
        onKeysUpdated();
      }
    } catch (error) {
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false }
      }));
      
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to save API key');
      }
    }
  };

  const handleDeleteKey = async (provider: string) => {
    if (!confirm(`Are you sure you want to delete your ${ApiKeyService.getProviderInfo(provider).name} API key?`)) {
      return;
    }

    clearMessages();
    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true }
    }));

    try {
      await ApiKeyService.deleteApiKey(provider);
      
      setSuccess(`${ApiKeyService.getProviderInfo(provider).name} API key deleted successfully`);
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false, info: null }
      }));
      
      if (onKeysUpdated) {
        onKeysUpdated();
      }
    } catch (error) {
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false }
      }));
      
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to delete API key');
      }
    }
  };

  const handleTestKey = async (provider: string) => {
    clearMessages();
    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], testing: true }
    }));

    try {
      const response = await ApiKeyService.testApiKey(provider);
      
      if (response.valid) {
        setSuccess(`${ApiKeyService.getProviderInfo(provider).name} API key is valid and working!`);
      } else {
        setError(response.error || 'API key test failed');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to test API key');
      }
    } finally {
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], testing: false }
      }));
    }
  };

  const handleLoadUsage = async (provider: string) => {
    const currentState = keyStates[provider];
    
    if (currentState?.showUsage) {
      // Hide usage
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], showUsage: false, usage: null }
      }));
      return;
    }

    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true }
    }));

    try {
      const response = await ApiKeyService.getApiKeyUsage(provider);
      
      setKeyStates(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          usage: response.stats,
          showUsage: true,
          loading: false
        }
      }));
    } catch (error) {
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false }
      }));
      
      setError('Failed to load usage statistics');
    }
  };

  const handleEditToggle = (provider: string) => {
    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], editing: true }
    }));
  };

  const handleCancelEdit = (provider: string) => {
    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], editing: false }
    }));
    setNewKeys(prev => ({ ...prev, [provider]: '' }));
  };

  const handleKeyChange = (provider: string, value: string) => {
    setNewKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleShowKeyToggle = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return {
    keyStates,
    newKeys,
    showKeys,
    error,
    success,
    loading,
    clearMessages,
    handleSaveKey,
    handleDeleteKey,
    handleTestKey,
    handleLoadUsage,
    handleEditToggle,
    handleCancelEdit,
    handleKeyChange,
    handleShowKeyToggle
  };
}