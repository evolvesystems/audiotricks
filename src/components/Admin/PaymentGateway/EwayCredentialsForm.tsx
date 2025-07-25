/**
 * eWAY Credentials Form - API key and password configuration form
 */

import React from 'react';

interface EwayConfig {
  apiKey: string;
  apiPassword: string;
  rapidEndpoint: string;
  environment: 'sandbox' | 'production';
  webhookSecret?: string;
  enableWebhooks: boolean;
}

interface EwayCredentialsFormProps {
  config: EwayConfig;
  setConfig: React.Dispatch<React.SetStateAction<EwayConfig>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EwayCredentialsForm({
  config,
  setConfig,
  showPassword,
  setShowPassword
}: EwayCredentialsFormProps) {
  return (
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
    </div>
  );
}