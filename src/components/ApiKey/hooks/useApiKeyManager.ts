/**
 * Refactored API Key Manager Hook
 * Combines state and operations hooks for clean interface
 */

import { useEffect } from 'react';
import { useApiKeyState } from './useApiKeyState';
import { useApiKeyOperations } from './useApiKeyOperations';

export function useApiKeyManager(onKeysUpdated?: () => void) {
  const {
    keyStates,
    newKeys,
    showKeys,
    updateKeyState,
    setNewKey,
    toggleKeyVisibility,
    resetKeyState,
    clearNewKeys
  } = useApiKeyState();

  const {
    error,
    success,
    loading,
    clearMessages,
    loadApiKeys,
    saveApiKey,
    deleteApiKey,
    testApiKey,
    loadUsage
  } = useApiKeyOperations(updateKeyState, onKeysUpdated);

  // Load API keys on mount
  useEffect(() => {
    loadApiKeys();
  }, []);

  const startEditing = (provider: string) => {
    updateKeyState(provider, { editing: true });
    clearMessages();
  };

  const cancelEditing = (provider: string) => {
    updateKeyState(provider, { editing: false });
    setNewKey(provider, '');
    clearMessages();
  };

  const handleSaveKey = async (provider: string) => {
    const key = newKeys[provider];
    if (!key?.trim()) {
      return;
    }
    
    await saveApiKey(provider, key.trim());
    setNewKey(provider, '');
  };

  const handleTestKey = async (provider: string, customKey?: string) => {
    const keyToTest = customKey || keyStates[provider]?.info?.maskedKey;
    if (!keyToTest) {
      return { valid: false, error: 'No key to test' };
    }
    
    return await testApiKey(provider, keyToTest);
  };

  const toggleUsage = async (provider: string) => {
    const currentState = keyStates[provider];
    if (!currentState) return;

    if (currentState.showUsage) {
      updateKeyState(provider, { showUsage: false, usage: null });
    } else {
      await loadUsage(provider);
    }
  };

  return {
    // State
    keyStates,
    newKeys,
    showKeys,
    error,
    success,
    loading,
    
    // Key management
    startEditing,
    cancelEditing,
    handleSaveKey,
    deleteApiKey,
    handleTestKey,
    
    // UI helpers
    setNewKey,
    toggleKeyVisibility,
    toggleUsage,
    clearMessages,
    resetKeyState,
    
    // Data operations
    loadApiKeys,
    loadUsage
  };
}