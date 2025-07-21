import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, X, AlertCircle, ExternalLink, Trash2, TestTube, BarChart3 } from 'lucide-react';
import ApiKeyService, { ApiKeyUsageStats } from '../services/apikey.service';
import { ApiError, ApiKeyInfo } from '../services/api';

interface ApiKeyManagerProps {
  onKeysUpdated?: () => void;
}

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

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeysUpdated }) => {
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
      console.error('Failed to load API keys:', error);
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

    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true }
    }));
    
    clearMessages();

    try {
      const response = await ApiKeyService.storeApiKey({
        provider: provider as 'openai' | 'elevenlabs',
        apiKey: key
      });

      setKeyStates(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          info: response.keyInfo,
          loading: false,
          editing: false
        }
      }));

      setNewKeys(prev => ({ ...prev, [provider]: '' }));
      setSuccess(`${ApiKeyService.getProviderInfo(provider).name} API key saved successfully`);
      
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
    if (!confirm('Are you sure you want to delete this API key?')) {
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
          usage: null,
          showUsage: false
        }
      }));

      setSuccess(`${ApiKeyService.getProviderInfo(provider).name} API key deleted`);
      
      if (onKeysUpdated) {
        onKeysUpdated();
      }
    } catch (error) {
      setKeyStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false }
      }));
      
      setError('Failed to delete API key');
    }
  };

  const handleTestKey = async (provider: string) => {
    setKeyStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], testing: true }
    }));

    try {
      const result = await ApiKeyService.testApiKey(provider);
      
      if (result.test.success) {
        setSuccess(`${ApiKeyService.getProviderInfo(provider).name} API key is working correctly`);
      } else {
        setError(`API key test failed: ${result.test.error || 'Unknown error'}`);
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

  const renderProviderCard = (provider: string) => {
    const state = keyStates[provider];
    const providerInfo = ApiKeyService.getProviderInfo(provider);
    const setupInstructions = ApiKeyService.getSetupInstructions(provider);
    const hasKey = state?.info && state.info.isActive;

    return (
      <div key={provider} className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{providerInfo.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {providerInfo.name}
              </h3>
              <p className="text-sm text-gray-500">
                {providerInfo.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasKey ? (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Configured</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-400">
                <X className="h-4 w-4 mr-1" />
                <span className="text-sm">Not configured</span>
              </div>
            )}
          </div>
        </div>

        {hasKey ? (
          <div className="space-y-4">
            {/* Key Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Key Prefix:</span>
                  <span className="ml-2 font-mono">{state.info?.keyPrefix}</span>
                </div>
                <div>
                  <span className="text-gray-500">Added:</span>
                  <span className="ml-2">
                    {state.info?.createdAt && new Date(state.info.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Last Used:</span>
                  <span className="ml-2">
                    {state.info?.lastUsedAt 
                      ? new Date(state.info.lastUsedAt).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Usage Count:</span>
                  <span className="ml-2">{state.info?.usageCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            {state.showUsage && state.usage && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Usage Statistics (Last 30 Days)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Total Calls:</span>
                    <span className="ml-2 font-medium">{ApiKeyService.formatUsageStats(state.usage).formattedCalls}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Total Cost:</span>
                    <span className="ml-2 font-medium">{ApiKeyService.formatUsageStats(state.usage).formattedCost}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Success Rate:</span>
                    <span className="ml-2 font-medium">{ApiKeyService.formatUsageStats(state.usage).successRatePercentage}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Tokens Used:</span>
                    <span className="ml-2 font-medium">{ApiKeyService.formatUsageStats(state.usage).formattedTokens}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleTestKey(provider)}
                disabled={state.testing || state.loading}
                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {state.testing ? 'Testing...' : 'Test Key'}
              </button>
              
              <button
                onClick={() => handleLoadUsage(provider)}
                disabled={state.loading}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {state.showUsage ? 'Hide Usage' : 'Show Usage'}
              </button>
              
              <button
                onClick={() => setKeyStates(prev => ({
                  ...prev,
                  [provider]: { ...prev[provider], editing: true }
                }))}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Key className="h-4 w-4 mr-2" />
                Update
              </button>
              
              <button
                onClick={() => handleDeleteKey(provider)}
                disabled={state.loading}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        ) : null}

        {/* Add/Edit Key Form */}
        {(!hasKey || state.editing) && (
          <div className="space-y-4">
            {/* Setup Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-900">
                  {setupInstructions.title}
                </h4>
                {setupInstructions.helpUrl && (
                  <a
                    href={setupInstructions.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <ol className="text-sm text-blue-800 space-y-1">
                {setupInstructions.steps.map((step, index) => (
                  <li key={index} className="flex">
                    <span className="font-medium mr-2">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Key Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKeys[provider] ? 'text' : 'password'}
                  value={newKeys[provider] || ''}
                  onChange={(e) => setNewKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                  placeholder={`Enter your ${providerInfo.name} API key`}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showKeys[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleSaveKey(provider)}
                disabled={state.loading || !newKeys[provider]?.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {state.loading ? 'Saving...' : hasKey ? 'Update Key' : 'Save Key'}
              </button>
              
              {hasKey && state.editing && (
                <button
                  onClick={() => {
                    setKeyStates(prev => ({
                      ...prev,
                      [provider]: { ...prev[provider], editing: false }
                    }));
                    setNewKeys(prev => ({ ...prev, [provider]: '' }));
                  }}
                  className="px-4 py-2 text-gray-600 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-red-800">{error}</p>
            <button
              onClick={clearMessages}
              className="text-red-600 hover:text-red-800 text-sm mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <Check className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-green-800">{success}</p>
            <button
              onClick={clearMessages}
              className="text-green-600 hover:text-green-800 text-sm mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Provider Cards */}
      <div className="grid gap-6">
        {PROVIDERS.map(renderProviderCard)}
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

export default ApiKeyManager;