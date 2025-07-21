// Hook for managing API keys securely through backend
import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

interface ApiKeysState {
  hasOpenAI: boolean;
  hasElevenLabs: boolean;
}

interface SaveApiKeysParams {
  openai?: string;
  elevenLabs?: string;
}

export function useApiKeys(token: string | null) {
  const [hasKeys, setHasKeys] = useState<ApiKeysState>({ 
    hasOpenAI: false, 
    hasElevenLabs: false 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkKeys = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/settings/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHasKeys({
          hasOpenAI: data.hasOpenAI || false,
          hasElevenLabs: data.hasElevenLabs || false
        });
      } else if (response.status === 404) {
        // API endpoint not yet implemented, fall back to localStorage check
        setHasKeys({
          hasOpenAI: !!localStorage.getItem('openai_api_key'),
          hasElevenLabs: !!localStorage.getItem('elevenlabs_api_key')
        });
      }
    } catch (error) {
      logger.error('Failed to check API keys:', error);
      // Fall back to localStorage check
      setHasKeys({
        hasOpenAI: !!localStorage.getItem('openai_api_key'),
        hasElevenLabs: !!localStorage.getItem('elevenlabs_api_key')
      });
    } finally {
      setLoading(false);
    }
  };

  const saveApiKeys = async (keys: SaveApiKeysParams) => {
    if (!token) {
      setError('Authentication required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          openaiKey: keys.openai,
          elevenLabsKey: keys.elevenLabs
        })
      });

      if (response.ok) {
        // Clear localStorage (migration)
        if (keys.openai) {
          localStorage.removeItem('openai_api_key');
        }
        if (keys.elevenLabs) {
          localStorage.removeItem('elevenlabs_api_key');
        }
        
        await checkKeys();
        return true;
      } else if (response.status === 404) {
        // API endpoint not yet implemented, fall back to localStorage
        if (keys.openai) {
          localStorage.setItem('openai_api_key', keys.openai);
        }
        if (keys.elevenLabs) {
          localStorage.setItem('elevenlabs_api_key', keys.elevenLabs);
        }
        await checkKeys();
        return true;
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to save API keys');
        return false;
      }
    } catch (error) {
      logger.error('Failed to save API keys:', error);
      setError('Failed to save API keys');
      // Fall back to localStorage
      if (keys.openai) {
        localStorage.setItem('openai_api_key', keys.openai);
      }
      if (keys.elevenLabs) {
        localStorage.setItem('elevenlabs_api_key', keys.elevenLabs);
      }
      await checkKeys();
      return true;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkKeys();
  }, [token]);

  return { 
    hasKeys, 
    saveApiKeys, 
    checkKeys, 
    loading, 
    error,
    clearError: () => setError(null)
  };
}