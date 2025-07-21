import React from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';

interface KeyInputFormProps {
  provider: string;
  providerInfo: any;
  setupInstructions: any;
  newKey: string;
  showKey: boolean;
  isLoading: boolean;
  hasKey: boolean;
  isEditing: boolean;
  onKeyChange: (value: string) => void;
  onShowKeyToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function KeyInputForm({
  provider,
  providerInfo,
  setupInstructions,
  newKey,
  showKey,
  isLoading,
  hasKey,
  isEditing,
  onKeyChange,
  onShowKeyToggle,
  onSave,
  onCancel
}: KeyInputFormProps) {
  return (
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
          {setupInstructions.steps.map((step: string, index: number) => (
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
            type={showKey ? 'text' : 'password'}
            value={newKey || ''}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder={`Enter your ${providerInfo.name} API key`}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={onShowKeyToggle}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex space-x-3">
        <button
          onClick={onSave}
          disabled={isLoading || !newKey?.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : hasKey ? 'Update Key' : 'Save Key'}
        </button>
        
        {hasKey && isEditing && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}