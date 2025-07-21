import React from 'react';
import { Key } from 'lucide-react';
import { ApiKeyManagerProps, PROVIDERS } from './ApiKey/types';
import { useApiKeyManager } from './ApiKey/useApiKeyManager';
import ProviderCard from './ApiKey/ProviderCard';
import MessageAlert from './ApiKey/MessageAlert';

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeysUpdated }) => {
  const {
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
  } = useApiKeyManager(onKeysUpdated);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading API keys...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Key Management</h2>
          <p className="text-gray-600 mt-1">
            Securely store and manage your API keys for audio processing services.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <MessageAlert
          type="error"
          message={error}
          onDismiss={clearMessages}
        />
      )}

      {success && (
        <MessageAlert
          type="success"
          message={success}
          onDismiss={clearMessages}
        />
      )}

      {/* Provider Cards */}
      <div className="grid gap-6">
        {PROVIDERS.map(provider => (
          <ProviderCard
            key={provider}
            provider={provider}
            state={keyStates[provider]}
            newKey={newKeys[provider] || ''}
            showKey={showKeys[provider] || false}
            onTestKey={handleTestKey}
            onLoadUsage={handleLoadUsage}
            onDeleteKey={handleDeleteKey}
            onSaveKey={handleSaveKey}
            onEditToggle={handleEditToggle}
            onCancelEdit={handleCancelEdit}
            onKeyChange={handleKeyChange}
            onShowKeyToggle={handleShowKeyToggle}
          />
        ))}
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <Key className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Security Notice</p>
            <p>
              Your API keys are encrypted and stored securely. They are never transmitted in plain text 
              or exposed in logs. You can update or delete them at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};