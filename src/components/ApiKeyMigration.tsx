// Component to help users migrate their API keys from localStorage to secure backend
import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useApiKeys } from '../hooks/useApiKeys';
import { logger } from '../utils/logger';

interface ApiKeyMigrationProps {
  token: string | null;
  isAuthenticated: boolean;
  onMigrationComplete?: () => void;
}

export default function ApiKeyMigration({ 
  token, 
  isAuthenticated, 
  onMigrationComplete 
}: ApiKeyMigrationProps) {
  const [showMigration, setShowMigration] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [localKeys, setLocalKeys] = useState({
    openai: '',
    elevenLabs: ''
  });

  const { saveApiKeys, hasKeys } = useApiKeys(token);

  useEffect(() => {
    // Check if there are keys in localStorage that need migration
    const openaiKey = localStorage.getItem('openai_api_key');
    const elevenLabsKey = localStorage.getItem('elevenlabs_api_key');
    
    if ((openaiKey || elevenLabsKey) && isAuthenticated && !hasKeys.hasOpenAI && !hasKeys.hasElevenLabs) {
      setLocalKeys({
        openai: openaiKey || '',
        elevenLabs: elevenLabsKey || ''
      });
      setShowMigration(true);
    }
  }, [isAuthenticated, hasKeys]);

  const handleMigration = async () => {
    setMigrating(true);
    
    try {
      const success = await saveApiKeys({
        openai: localKeys.openai || undefined,
        elevenLabs: localKeys.elevenLabs || undefined
      });

      if (success) {
        logger.info('API keys migrated successfully');
        setShowMigration(false);
        onMigrationComplete?.();
      }
    } catch (error) {
      logger.error('Failed to migrate API keys:', error);
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    setShowMigration(false);
  };

  if (!showMigration) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border border-yellow-200 p-4 z-50">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Secure Your API Keys
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            We detected API keys stored locally. For better security, we recommend migrating them to your secure account storage.
          </p>
          
          <div className="bg-gray-50 rounded p-2 mb-3 text-xs">
            <p className="font-medium text-gray-700 mb-1">Keys found:</p>
            <ul className="space-y-1 text-gray-600">
              {localKeys.openai && (
                <li className="flex items-center gap-1">
                  <ShieldCheckIcon className="w-3 h-3" />
                  OpenAI API Key
                </li>
              )}
              {localKeys.elevenLabs && (
                <li className="flex items-center gap-1">
                  <ShieldCheckIcon className="w-3 h-3" />
                  ElevenLabs API Key
                </li>
              )}
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleMigration}
              disabled={migrating}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {migrating ? 'Migrating...' : 'Migrate Keys'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}