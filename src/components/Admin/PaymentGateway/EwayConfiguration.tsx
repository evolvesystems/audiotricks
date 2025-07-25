/**
 * eWAY Payment Gateway Configuration Component
 * Allows admins to configure eWAY test credentials and settings
 */

import React, { useState, useEffect } from 'react';
import { KeyIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { logger } from '../../../utils/logger';
import EwayCredentialsForm from './EwayCredentialsForm';
import EwayTestInfo from './EwayTestInfo';

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
        <EwayCredentialsForm
          config={config}
          setConfig={setConfig}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />

        <EwayTestInfo environment={config.environment} />

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