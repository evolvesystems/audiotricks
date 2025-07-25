import React from 'react';
import { Key, AlertCircle, TestTube, BarChart3, Trash2 } from 'lucide-react';
import { ApiKeyInfo, ApiKeyUsageStats } from '../../services/apikey.service';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ApiKeyEditForm } from './ApiKeyEditForm';
import { ApiKeyUsageStats as UsageStatsDisplay } from './ApiKeyUsageStats';
import { getProviderName, getProviderDescription, getProviderUrl } from './providerUtils';

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
            <ApiKeyEditForm
              newKey={newKey}
              showKey={showKey}
              onKeyChange={onKeyChange}
              onToggleShow={onToggleShow}
              onSave={onSave}
              onCancel={() => onEdit(false)}
            />
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
            <UsageStatsDisplay
              usage={usage}
              onRefresh={onLoadUsage}
            />
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