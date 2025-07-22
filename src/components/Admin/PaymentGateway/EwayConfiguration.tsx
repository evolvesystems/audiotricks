/**
 * eWAY Payment Gateway Configuration Component
 * Allows admins to configure eWAY test credentials and settings
 */

import React, { useState, useEffect } from 'react';
import { CreditCardIcon, KeyIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { logger } from '../../../utils/logger';

interface EwayConfig {
  apiKey: string;
  apiPassword: string;
  rapidEndpoint: string;
  environment: 'sandbox' | 'production';
  webhookSecret?: string;
  enableWebhooks: boolean;
}

interface EwayConfigurationProps {
  token: string;
  onConfigSaved?: () => void;
}

export default function EwayConfiguration({ token, onConfigSaved }: EwayConfigurationProps) {
  const [config, setConfig] = useState<EwayConfig>({
    apiKey: '',
    apiPassword: '',
    rapidEndpoint: 'https://api.sandbox.ewaypayments.com',
    environment: 'sandbox',
    webhookSecret: '',
    enableWebhooks: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/eway/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      logger.error('Error fetching eWAY config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/eway/config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Configuration saved successfully' });
        if (onConfigSaved) onConfigSaved();
      } else {
        const error = await response.json();
        setTestResult({ success: false, message: error.message || 'Failed to save configuration' });
      }
    } catch (error) {
      logger.error('Error saving eWAY config:', error);
      setTestResult({ success: false, message: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/eway/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      });

      const result = await response.json();
      setTestResult({
        success: response.ok,
        message: result.message || (response.ok ? 'Connection successful' : 'Connection failed')
      });
    } catch (error) {
      logger.error('Error testing eWAY connection:', error);
      setTestResult({ success: false, message: 'Failed to test connection' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <KeyIcon className="w-6 h-6 text-blue-600" />
          eWAY Configuration
        </h2>
        <p className="text-gray-600 mt-2">
          Configure your eWAY payment gateway credentials. For testing, use the sandbox environment.
        </p>
      </div>

      <div className="space-y-6">
        {/* Environment Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Environment
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="sandbox"
                checked={config.environment === 'sandbox'}
                onChange={(e) => setConfig({ 
                  ...config, 
                  environment: 'sandbox',
                  rapidEndpoint: 'https://api.sandbox.ewaypayments.com'
                })}
                className="mr-2"
              />
              <span>Sandbox (Testing)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="production"
                checked={config.environment === 'production'}
                onChange={(e) => setConfig({ 
                  ...config, 
                  environment: 'production',
                  rapidEndpoint: 'https://api.ewaypayments.com'
                })}
                className="mr-2"
              />
              <span>Production</span>
            </label>
          </div>
        </div>

        {/* API Key */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            API Key {config.environment === 'sandbox' && <span className="text-gray-500">(Use test key)</span>}
          </label>
          <input
            type="text"
            id="apiKey"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder={config.environment === 'sandbox' ? 'Enter sandbox API key' : 'Enter production API key'}
          />
        </div>

        {/* API Password */}
        <div>
          <label htmlFor="apiPassword" className="block text-sm font-medium text-gray-700 mb-1">
            API Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="apiPassword"
              value={config.apiPassword}
              onChange={(e) => setConfig({ ...config, apiPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter API password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Rapid Endpoint */}
        <div>
          <label htmlFor="rapidEndpoint" className="block text-sm font-medium text-gray-700 mb-1">
            Rapid API Endpoint
          </label>
          <input
            type="text"
            id="rapidEndpoint"
            value={config.rapidEndpoint}
            onChange={(e) => setConfig({ ...config, rapidEndpoint: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled
          />
        </div>

        {/* Webhooks */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enableWebhooks}
              onChange={(e) => setConfig({ ...config, enableWebhooks: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Enable Webhooks</span>
          </label>
        </div>

        {config.enableWebhooks && (
          <div>
            <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700 mb-1">
              Webhook Secret
            </label>
            <input
              type="text"
              id="webhookSecret"
              value={config.webhookSecret || ''}
              onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter webhook secret"
            />
          </div>
        )}

        {/* Test Credentials Info */}
        {config.environment === 'sandbox' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Test Credentials</h3>
            <p className="text-sm text-blue-700 mb-2">
              To get test credentials:
            </p>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Sign up for an eWAY sandbox account at developers.eway.com.au</li>
              <li>Log in to your sandbox account</li>
              <li>Navigate to API Keys section</li>
              <li>Copy your Rapid API Key and Password</li>
            </ol>
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Test Card Numbers:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Visa: 4444333322221111</li>
                <li>• MasterCard: 5123456789012346</li>
                <li>• CVN: 123 (any 3 digits)</li>
                <li>• Expiry: Any future date</li>
              </ul>
            </div>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              {testResult.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              )}
              <span className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleTestConnection}
            disabled={!config.apiKey || !config.apiPassword || saving}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Connection
          </button>
          <button
            onClick={handleSave}
            disabled={!config.apiKey || !config.apiPassword || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}