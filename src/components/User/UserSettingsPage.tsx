/**
 * User Settings Page - Settings interface for user dashboard
 * Provides the same functionality as the main app settings
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Settings, { UserSettings as SettingsType } from '../Settings';
import { useSettings } from '../../hooks/useSettings';
import ApiKeyManager from '../ApiKeyManager';
import { useApiKeys } from '../../hooks/useApiKeys';

export default function UserSettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const token = localStorage.getItem('authToken');
  const { hasKeys } = useApiKeys(token);
  
  // API Keys state
  const [openAIKey, setOpenAIKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [elevenLabsKey, setElevenLabsKey] = useState(localStorage.getItem('elevenlabs_api_key') || '');

  const handleSettingsChange = (newSettings: SettingsType) => {
    updateSettings(newSettings);
  };

  const handleOpenAIKeyChange = (newKey: string) => {
    setOpenAIKey(newKey);
    localStorage.setItem('openai_api_key', newKey);
  };

  const handleElevenLabsKeyChange = (newKey: string) => {
    setElevenLabsKey(newKey);
    localStorage.setItem('elevenlabs_api_key', newKey);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your API keys and default processing settings
        </p>
      </div>

      <div className="space-y-6">
        {/* API Keys Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>
          
          <ApiKeyManager
            openAIKey={openAIKey}
            elevenLabsKey={elevenLabsKey}
            onOpenAIKeyChange={handleOpenAIKeyChange}
            onElevenLabsKeyChange={handleElevenLabsKeyChange}
            isGuest={!token}
            token={token}
            hasSecureKeys={hasKeys}
          />
        </div>

        {/* Processing Settings Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Default Processing Settings</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure default settings for audio processing
              </p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Edit Settings
            </button>
          </div>

          {/* Current Settings Display */}
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Summary Style</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{settings.summaryStyle}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Output Language</span>
              <span className="text-sm font-medium text-gray-900">
                {getLanguageName(settings.outputLanguage)}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Creativity Level</span>
              <span className="text-sm font-medium text-gray-900">{settings.temperature.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Summary Length</span>
              <span className="text-sm font-medium text-gray-900">{settings.maxTokens} tokens</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Show Cost Estimates</span>
              <span className="text-sm font-medium text-gray-900">
                {settings.showCostEstimates ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email</h3>
                <p className="text-sm text-gray-600">john@example.com</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Change
              </button>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Password</h3>
                <p className="text-sm text-gray-600">Last changed 30 days ago</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
          currentSettings={settings}
        />
      )}
    </div>
  );
}

// Helper function to get language name
function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese'
  };
  return languages[code] || code.toUpperCase();
}