/**
 * System Configuration Panel
 * Handles global system settings and toggles
 */

import React from 'react';
import { 
  Cog6ToothIcon,
  ShieldCheckIcon,
  BoltIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

interface SystemConfig {
  maintenanceMode: boolean;
  debugMode: boolean;
  registrationEnabled: boolean;
  maxUsersPerWorkspace: number;
  maxAudioFileSize: number;
  maxStoragePerUser: number;
  apiRateLimit: number;
  webhookRetryLimit: number;
  sessionTimeout: number;
  passwordMinLength: number;
  mfaEnabled: boolean;
  emailVerificationRequired: boolean;
}

interface SystemConfigPanelProps {
  config: SystemConfig | null;
  onChange: (field: keyof SystemConfig, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const SystemConfigPanel: React.FC<SystemConfigPanelProps> = ({
  config,
  onChange,
  onSave,
  isSaving
}) => {
  if (!config) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const configSections = [
    {
      title: 'System Controls',
      icon: Cog6ToothIcon,
      fields: [
        { 
          key: 'maintenanceMode' as keyof SystemConfig,
          label: 'Maintenance Mode',
          type: 'boolean',
          description: 'Enable to block all user access for maintenance'
        },
        { 
          key: 'debugMode' as keyof SystemConfig,
          label: 'Debug Mode',
          type: 'boolean',
          description: 'Enable detailed logging and error reporting'
        },
        { 
          key: 'registrationEnabled' as keyof SystemConfig,
          label: 'User Registration',
          type: 'boolean',
          description: 'Allow new users to register accounts'
        }
      ]
    },
    {
      title: 'Security Settings',
      icon: ShieldCheckIcon,
      fields: [
        { 
          key: 'mfaEnabled' as keyof SystemConfig,
          label: 'Multi-Factor Authentication',
          type: 'boolean',
          description: 'Require MFA for all admin accounts'
        },
        { 
          key: 'emailVerificationRequired' as keyof SystemConfig,
          label: 'Email Verification',
          type: 'boolean',
          description: 'Require email verification for new accounts'
        },
        { 
          key: 'passwordMinLength' as keyof SystemConfig,
          label: 'Minimum Password Length',
          type: 'number',
          description: 'Minimum characters required for passwords'
        },
        { 
          key: 'sessionTimeout' as keyof SystemConfig,
          label: 'Session Timeout (minutes)',
          type: 'number',
          description: 'Auto-logout after inactivity'
        }
      ]
    },
    {
      title: 'Resource Limits',
      icon: BoltIcon,
      fields: [
        { 
          key: 'maxUsersPerWorkspace' as keyof SystemConfig,
          label: 'Max Users per Workspace',
          type: 'number',
          description: 'Maximum number of users allowed in a workspace'
        },
        { 
          key: 'maxAudioFileSize' as keyof SystemConfig,
          label: 'Max Audio File Size (MB)',
          type: 'number',
          description: 'Maximum size for uploaded audio files'
        },
        { 
          key: 'maxStoragePerUser' as keyof SystemConfig,
          label: 'Max Storage per User (GB)',
          type: 'number',
          description: 'Storage quota per user account'
        },
        { 
          key: 'apiRateLimit' as keyof SystemConfig,
          label: 'API Rate Limit (requests/hour)',
          type: 'number',
          description: 'Maximum API requests per hour per user'
        },
        { 
          key: 'webhookRetryLimit' as keyof SystemConfig,
          label: 'Webhook Retry Limit',
          type: 'number',
          description: 'Number of retry attempts for failed webhooks'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">System Configuration</h3>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {configSections.map((section) => (
        <div key={section.title} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <section.icon className="h-5 w-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">{section.title}</h4>
          </div>

          <div className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <p className="text-xs text-gray-500">{field.description}</p>
                </div>

                <div className="ml-4">
                  {field.type === 'boolean' ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config[field.key] as boolean}
                        onChange={(e) => onChange(field.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  ) : (
                    <input
                      type="number"
                      value={config[field.key] as number}
                      onChange={(e) => onChange(field.key, parseInt(e.target.value) || 0)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="0"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};