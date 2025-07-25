/**
 * API Key Edit Form - Form for editing API keys
 */

import React from 'react';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';

interface ApiKeyEditFormProps {
  newKey: string;
  showKey: boolean;
  onKeyChange: (key: string) => void;
  onToggleShow: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ApiKeyEditForm: React.FC<ApiKeyEditFormProps> = ({
  newKey,
  showKey,
  onKeyChange,
  onToggleShow,
  onSave,
  onCancel
}) => {
  return (
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
        <Button onClick={onCancel} variant="outline" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};