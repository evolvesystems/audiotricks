import React, { useState } from 'react';
import { Key, Eye, EyeOff, Check, X, AlertCircle, TestTube, BarChart3, Trash2 } from 'lucide-react';
import { ApiKeyInfo, ApiKeyUsageStats } from '../../services/apikey.service';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ApiKeyCardProps {
  provider: string;
  info: ApiKeyInfo | null;
  loading: boolean;
  editing: boolean;
  testing: boolean;
  usage: ApiKeyUsageStats | null;
  showUsage: boolean;
  newKey: string;
  showKey: boolean;
  onEdit: (editing: boolean) => void;
  onSave: () => void;
  onDelete: () => void;
  onTest: () => void;
  onLoadUsage: () => void;
  onToggleUsage: () => void;
  onKeyChange: (key: string) => void;
  onToggleShow: () => void;
}

/**
 * Individual API key card component
 */
export const ApiKeyCard: React.FC<ApiKeyCardProps> = ({
  provider,
  info,
  loading,
  editing,
  testing,
  usage,
  showUsage,
  newKey,
  showKey,
  onEdit,
  onSave,
  onDelete,
  onTest,
  onLoadUsage,
  onToggleUsage,
  onKeyChange,
  onToggleShow
}) => {
  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'elevenlabs': return 'ElevenLabs';
      default: return provider;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'openai': return 'Used for audio transcription and text analysis';
      case 'elevenlabs': return 'Used for voice synthesis and audio generation';
      default: return 'API key for external service';
    }
  };

  const getProviderUrl = (provider: string) => {
    switch (provider) {
      case 'openai': return 'https://platform.openai.com/api-keys';
      case 'elevenlabs': return 'https://elevenlabs.io/app/settings/api';
      default: return '#';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Key className="h-5 w-5 text-gray-500" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {getProviderName(provider)}
            </h3>
            <p className="text-sm text-gray-500">
              {getProviderDescription(provider)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {info && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onTest}
                disabled={testing}
                className="text-blue-600 hover:text-blue-700"
              >
                {testing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleUsage}
                className="text-green-600 hover:text-green-700"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      ) : info ? (
        <div className="space-y-4">
          {/* Key Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                info.isValid ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                info.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                {info.isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
          </div>

          {/* Key Value */}
          {editing ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={newKey}
                    onChange={(e) => onKeyChange(e.target.value)}
                    placeholder="Enter your API key..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={onToggleShow}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={onSave} variant="primary" size="sm">
                  <Check className="h-4 w-4" />
                </Button>
                <Button onClick={() => onEdit(false)} variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Key:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(true)}
                >
                  Edit
                </Button>
              </div>
              <div className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded">
                {info.maskedKey}
              </div>
            </div>
          )}

          {/* Usage Statistics */}
          {showUsage && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Usage Statistics</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLoadUsage}
                  disabled={!usage}
                >
                  Refresh
                </Button>
              </div>
              {usage ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Requests:</span>
                    <div className="font-semibold">{usage.totalRequests.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Tokens:</span>
                    <div className="font-semibold">{usage.totalTokens?.toLocaleString() || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">This Month:</span>
                    <div className="font-semibold">{usage.currentMonthRequests.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Used:</span>
                    <div className="font-semibold">
                      {usage.lastUsed ? new Date(usage.lastUsed).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-gray-500">
            Last updated: {new Date(info.updatedAt).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No API Key</h4>
          <p className="text-gray-600 mb-4">
            Add your {getProviderName(provider)} API key to enable {provider === 'openai' ? 'transcription and analysis' : 'voice synthesis'} features.
          </p>
          <div className="space-y-3">
            <Button onClick={() => onEdit(true)} variant="primary">
              Add API Key
            </Button>
            <div>
              <a
                href={getProviderUrl(provider)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                Get API Key
                <AlertCircle className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};