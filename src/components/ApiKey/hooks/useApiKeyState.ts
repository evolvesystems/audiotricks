/**
 * API Key State Management Hook
 */

import { useState, useEffect } from 'react';
import { KeyState, PROVIDERS } from '../types';
import { createDebugLogger } from '../../../utils/debug-logger';

const debug = createDebugLogger('api-key-state');

export function useApiKeyState() {
  const [keyStates, setKeyStates] = useState<KeyState>({});
  const [newKeys, setNewKeys] = useState<{ [provider: string]: string }>({});
  const [showKeys, setShowKeys] = useState<{ [provider: string]: boolean }>({});

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
    debug.log('API key states initialized', { providers: PROVIDERS });
  }, []);

  const updateKeyState = (provider: string, updates: Partial<KeyState[string]>) => {
    setKeyStates(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        ...updates
      }
    }));
    debug.log('Key state updated', { provider, updates });
  };

  const setNewKey = (provider: string, key: string) => {
    setNewKeys(prev => ({ ...prev, [provider]: key }));
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const resetKeyState = (provider: string) => {
    updateKeyState(provider, {
      info: null,
      loading: false,
      editing: false,
      testing: false,
      usage: null,
      showUsage: false
    });
    setNewKey(provider, '');
  };

  const clearNewKeys = () => {
    setNewKeys({});
  };

  return {
    keyStates,
    newKeys,
    showKeys,
    updateKeyState,
    setNewKey,
    toggleKeyVisibility,
    resetKeyState,
    clearNewKeys
  };
}