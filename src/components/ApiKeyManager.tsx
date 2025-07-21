import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { ApiKeyCard } from './ApiKey/ApiKeyCard';
import { useApiKeyManager } from './ApiKey/useApiKeyManager';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';

interface ApiKeyManagerProps {
  onKeysUpdated?: () => void;
}

/**
 * Main API key manager component (refactored for CLAUDE.md compliance)
 * Orchestrates API key cards and state management
 */
export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeysUpdated }) => {
  const {
    keyStates,
    newKeys,
    showKeys,
    error,
    success,
    loading,
    PROVIDERS,
    clearMessages,
    handleSaveKey,
    handleDeleteKey,
    handleTestKey,
    handleLoadUsage,
    updateKeyState,
    updateNewKey,
    toggleShowKey
  } = useApiKeyManager(onKeysUpdated);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">API Key Management</h2>
        <p className="text-gray-600">
          Manage your API keys for transcription, analysis, and voice synthesis services.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="error" onClose={clearMessages}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={clearMessages}>
          {success}
        </Alert>
      )}

      {/* API Key Cards */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const state = keyStates[provider];
          if (!state) return null;

          return (
            <ApiKeyCard
              key={provider}
              provider={provider}
              info={state.info}
              loading={state.loading}
              editing={state.editing}
              testing={state.testing}
              usage={state.usage}
              showUsage={state.showUsage}
              newKey={newKeys[provider] || ''}
              showKey={showKeys[provider] || false}
              onEdit={(editing) => updateKeyState(provider, { editing })}
              onSave={() => handleSaveKey(provider)}
              onDelete={() => handleDeleteKey(provider)}
              onTest={() => handleTestKey(provider)}
              onLoadUsage={() => handleLoadUsage(provider)}
              onToggleUsage={() => updateKeyState(provider, { 
                showUsage: !state.showUsage 
              })}
              onKeyChange={(key) => updateNewKey(provider, key)}
              onToggleShow={() => toggleShowKey(provider)}
            />
          );
        })}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              API Key Security
            </h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                Your API keys are encrypted and stored securely. They are never shared with third parties 
                and are only used to make requests to the respective services on your behalf.
              </p>
              <p>
                You can delete your API keys at any time, and they will be permanently removed from our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;