import React from 'react';
import { KeyIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import ActionButton from '../Dashboard/ActionButton';
import { ApiKeySettings } from './types';

interface ApiKeySectionProps {
  apiKeys: ApiKeySettings;
  showApiKeys: Record<keyof ApiKeySettings, boolean>;
  onChange: (key: keyof ApiKeySettings, value: string) => void;
  onToggleVisibility: (field: keyof ApiKeySettings) => void;
  onSave: () => void;
  saving: boolean;
}

const apiKeyConfigs = [
  {
    key: 'openaiApiKey' as keyof ApiKeySettings,
    label: 'OpenAI API Key',
    description: '(Whisper, GPT-4, Embeddings)',
    placeholder: 'sk-...'
  },
  {
    key: 'elevenlabsApiKey' as keyof ApiKeySettings,
    label: 'ElevenLabs API Key',
    description: '(Voice Synthesis)',
    placeholder: 'Enter ElevenLabs API key...'
  },
  {
    key: 'sendgridApiKey' as keyof ApiKeySettings,
    label: 'SendGrid API Key',
    description: '(Email Services)',
    placeholder: 'SG...'
  }
];

const apiKeyPairs = [
  {
    keyField: 'digitaloceanSpacesKey' as keyof ApiKeySettings,
    secretField: 'digitaloceanSpacesSecret' as keyof ApiKeySettings,
    keyLabel: 'DigitalOcean Spaces Key',
    secretLabel: 'DigitalOcean Spaces Secret',
    keyDescription: '(File Storage)',
    keyPlaceholder: 'Access Key...',
    secretPlaceholder: 'Secret Key...'
  },
  {
    keyField: 'ewayApiKey' as keyof ApiKeySettings,
    secretField: 'ewayApiPassword' as keyof ApiKeySettings,
    keyLabel: 'eWAY API Key',
    secretLabel: 'eWAY Password',
    keyDescription: '(Payment Processing)',
    keyPlaceholder: 'eWAY API Key...',
    secretPlaceholder: 'eWAY Password...'
  }
];

export default function ApiKeySection({
  apiKeys,
  showApiKeys,
  onChange,
  onToggleVisibility,
  onSave,
  saving
}: ApiKeySectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <KeyIcon className="h-5 w-5 mr-2" />
          API Keys Management
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure API keys for third-party integrations. These keys are stored securely and used server-side only.
        </p>

        <div className="space-y-6">
          {/* Single API Keys */}
          {apiKeyConfigs.map(({ key, label, description, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
                <span className="text-xs text-gray-500 ml-2">{description}</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKeys[key] ? 'text' : 'password'}
                  value={apiKeys[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="block w-full rounded-md border-gray-300 shadow-sm pr-10 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => onToggleVisibility(key)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showApiKeys[key] ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Paired API Keys */}
          {apiKeyPairs.map((pair) => (
            <div key={pair.keyField} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {pair.keyLabel}
                  <span className="text-xs text-gray-500 ml-2">{pair.keyDescription}</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys[pair.keyField] ? 'text' : 'password'}
                    value={apiKeys[pair.keyField]}
                    onChange={(e) => onChange(pair.keyField, e.target.value)}
                    placeholder={pair.keyPlaceholder}
                    className="block w-full rounded-md border-gray-300 shadow-sm pr-10 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(pair.keyField)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKeys[pair.keyField] ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {pair.secretLabel}
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys[pair.secretField] ? 'text' : 'password'}
                    value={apiKeys[pair.secretField]}
                    onChange={(e) => onChange(pair.secretField, e.target.value)}
                    placeholder={pair.secretPlaceholder}
                    className="block w-full rounded-md border-gray-300 shadow-sm pr-10 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(pair.secretField)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKeys[pair.secretField] ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <ActionButton
            onClick={onSave}
            variant="primary"
            loading={saving}
          >
            Save API Keys
          </ActionButton>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <ShieldCheckIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              API keys are encrypted and stored securely. They are only used server-side and never exposed to client applications.
              Ensure you're using production-grade keys with appropriate permissions and rate limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}