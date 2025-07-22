import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Key } from 'lucide-react';
import { Button } from '../ui/Button';
import ApiKeyService from '../../services/apikey.service';
import { logger } from '../../utils/logger';

interface ApiKeyValidatorProps {
  requiredKeys: string[];
  onValidationChange: (isValid: boolean, keys: string[]) => void;
}

/**
 * Component for validating required API keys before upload
 */
export const ApiKeyValidator: React.FC<ApiKeyValidatorProps> = ({
  requiredKeys,
  onValidationChange
}) => {
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkApiKeys();
  }, [requiredKeys]);

  const checkApiKeys = async () => {
    setLoading(true);
    const status: Record<string, boolean> = {};
    
    try {
      for (const keyType of requiredKeys) {
        try {
          const keyInfo = await ApiKeyService.getApiKeyInfo(keyType);
          status[keyType] = keyInfo?.isValid || false;
        } catch {
          status[keyType] = false;
        }
      }
      
      setKeyStatus(status);
      const allValid = Object.values(status).every(valid => valid);
      const missingKeys = Object.entries(status)
        .filter(([_, valid]) => !valid)
        .map(([key]) => key);
      
      onValidationChange(allValid, missingKeys);
    } catch (error) {
      logger.error('Error checking API keys:', error);
      onValidationChange(false, requiredKeys);
    } finally {
      setLoading(false);
    }
  };

  const getKeyDisplayName = (keyType: string) => {
    switch (keyType) {
      case 'openai': return 'OpenAI';
      case 'elevenlabs': return 'ElevenLabs';
      default: return keyType.toUpperCase();
    }
  };

  const getKeyUrl = (keyType: string) => {
    switch (keyType) {
      case 'openai': return 'https://platform.openai.com/api-keys';
      case 'elevenlabs': return 'https://elevenlabs.io/app/settings/api';
      default: return '#';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Checking API keys...</span>
      </div>
    );
  }

  const hasInvalidKeys = Object.values(keyStatus).some(valid => !valid);

  if (!hasInvalidKeys) {
    return (
      <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
        <span className="text-sm text-green-700 font-medium">
          All required API keys are configured and valid
        </span>
      </div>
    );
  }

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 mb-2">
            API Keys Required
          </h3>
          
          <p className="text-sm text-amber-700 mb-3">
            The following API keys are required for audio processing:
          </p>
          
          <div className="space-y-2 mb-4">
            {Object.entries(keyStatus).map(([keyType, isValid]) => (
              <div key={keyType} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Key className="h-4 w-4 text-amber-600" />
                  )}
                  <span className={`text-sm ${
                    isValid ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {getKeyDisplayName(keyType)} API Key
                  </span>
                </div>
                
                {!isValid && (
                  <a
                    href={getKeyUrl(keyType)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:text-amber-700 underline"
                  >
                    Get Key
                  </a>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/settings?tab=api-keys'}
              className="text-amber-700 border-amber-300 hover:bg-amber-100"
            >
              Configure API Keys
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={checkApiKeys}
              className="text-amber-600 hover:text-amber-700"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};