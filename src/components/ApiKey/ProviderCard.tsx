import React from 'react';
import { Key, Check, X, TestTube, BarChart3, Trash2 } from 'lucide-react';
import ApiKeyService from '../../services/apikey.service';
import { KeyState } from './types';
import KeyInfoSection from './KeyInfoSection';
import UsageStatistics from './UsageStatistics';
import KeyInputForm from './KeyInputForm';

interface ProviderCardProps {
  provider: string;
  state: KeyState[string];
  newKey: string;
  showKey: boolean;
  onTestKey: (provider: string) => void;
  onLoadUsage: (provider: string) => void;
  onDeleteKey: (provider: string) => void;
  onSaveKey: (provider: string) => void;
  onEditToggle: (provider: string) => void;
  onCancelEdit: (provider: string) => void;
  onKeyChange: (provider: string, value: string) => void;
  onShowKeyToggle: (provider: string) => void;
}

export default function ProviderCard({
  provider,
  state,
  newKey,
  showKey,
  onTestKey,
  onLoadUsage,
  onDeleteKey,
  onSaveKey,
  onEditToggle,
  onCancelEdit,
  onKeyChange,
  onShowKeyToggle
}: ProviderCardProps) {
  const providerInfo = ApiKeyService.getProviderInfo(provider);
  const setupInstructions = ApiKeyService.getSetupInstructions(provider);
  const hasKey = state?.info && state.info.isActive;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
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

      {hasKey && !state.editing ? (
        <div className="space-y-4">
          <KeyInfoSection info={state.info!} />
          
          {state.showUsage && state.usage && (
            <UsageStatistics usage={state.usage} />
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => onTestKey(provider)}
              disabled={state.testing || state.loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {state.testing ? 'Testing...' : 'Test Key'}
            </button>
            
            <button
              onClick={() => onLoadUsage(provider)}
              disabled={state.loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {state.showUsage ? 'Hide Usage' : 'Show Usage'}
            </button>
            
            <button
              onClick={() => onEditToggle(provider)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Key className="h-4 w-4 mr-2" />
              Update
            </button>
            
            <button
              onClick={() => onDeleteKey(provider)}
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
        <KeyInputForm
          provider={provider}
          providerInfo={providerInfo}
          setupInstructions={setupInstructions}
          newKey={newKey}
          showKey={showKey}
          isLoading={state.loading}
          hasKey={hasKey}
          isEditing={state.editing}
          onKeyChange={(value) => onKeyChange(provider, value)}
          onShowKeyToggle={() => onShowKeyToggle(provider)}
          onSave={() => onSaveKey(provider)}
          onCancel={() => onCancelEdit(provider)}
        />
      )}
    </div>
  );
}