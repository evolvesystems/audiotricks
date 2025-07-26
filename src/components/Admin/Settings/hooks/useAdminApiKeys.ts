/**
 * Admin API Keys Management Hook
 */

import { useState, useEffect } from 'react';
import { ApiKeySettings } from '../types';
import { useAdminAuthContext } from '../../../../contexts/AdminAuthContext';
import AdminSettingsService from '../../../../services/adminSettings.service';
import { createDebugLogger } from '../../../../utils/debug-logger';

const debug = createDebugLogger('admin-api-keys');

export function useAdminApiKeys() {
  const { token } = useAdminAuthContext();
  const [apiKeys, setApiKeys] = useState<ApiKeySettings>({
    openaiKey: '',
    elevenLabsKey: '',
    sendgridKey: '',
    ewayKey: '',
    lastUpdated: new Date(),
    keysEncrypted: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadApiKeys();
  }, [token]);

  const loadApiKeys = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const keysData = await AdminSettingsService.getApiKeys(token);
      setApiKeys({
        ...apiKeys,
        ...keysData,
        lastUpdated: new Date(keysData.lastUpdated)
      });
      debug.log('API keys loaded', { hasOpenAI: !!keysData.openaiKey, hasElevenLabs: !!keysData.elevenLabsKey });
    } catch (error) {
      debug.error('Failed to load API keys', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApiKey = async (keyType: keyof ApiKeySettings, value: string) => {
    if (!token) return;

    try {
      setSaving(true);
      const updates = { [keyType]: value };
      await AdminSettingsService.updateApiKeys(token, updates);
      setApiKeys({
        ...apiKeys,
        [keyType]: value,
        lastUpdated: new Date()
      });
      debug.log('API key updated', { keyType });
    } catch (error) {
      debug.error('Failed to update API key', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const testApiKey = async (keyType: string, key: string) => {
    if (!token) return;

    try {
      setTestingKeys(prev => ({ ...prev, [keyType]: true }));
      const result = await AdminSettingsService.testApiKey(token, keyType, key);
      debug.log('API key test completed', { keyType, result });
      return result;
    } catch (error) {
      debug.error('API key test failed', error);
      throw error;
    } finally {
      setTestingKeys(prev => ({ ...prev, [keyType]: false }));
    }
  };

  const rotateApiKey = async (keyType: string) => {
    if (!token) return;

    try {
      setSaving(true);
      const newKey = await AdminSettingsService.rotateApiKey(token, keyType);
      setApiKeys({
        ...apiKeys,
        [keyType]: newKey,
        lastUpdated: new Date()
      });
      debug.log('API key rotated', { keyType });
      return newKey;
    } catch (error) {
      debug.error('Failed to rotate API key', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteApiKey = async (keyType: string) => {
    if (!token) return;

    try {
      setSaving(true);
      await AdminSettingsService.deleteApiKey(token, keyType);
      setApiKeys({
        ...apiKeys,
        [keyType]: '',
        lastUpdated: new Date()
      });
      debug.log('API key deleted', { keyType });
    } catch (error) {
      debug.error('Failed to delete API key', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    apiKeys,
    loading,
    saving,
    testingKeys,
    updateApiKey,
    testApiKey,
    rotateApiKey,
    deleteApiKey,
    loadApiKeys
  };
}