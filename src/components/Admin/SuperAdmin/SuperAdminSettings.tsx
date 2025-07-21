/**
 * Advanced Admin Settings Dashboard
 * Advanced system configuration and management for administrators
 */

import React, { useState, useEffect } from 'react';
import { 
  ServerIcon, 
  Cog6ToothIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  BoltIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { useAdminAuthContext } from '../../../contexts/AdminAuthContext';
import StatsCard from '../Dashboard/StatsCard';
import ActionButton from '../Dashboard/ActionButton';

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

interface SystemHealth {
  databaseStatus: 'healthy' | 'degraded' | 'error';
  redisStatus: 'healthy' | 'degraded' | 'error';
  storageUsage: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  queuedJobs: number;
  failedJobs: number;
}

export default function SuperAdminSettings() {
  const { token } = useAdminAuthContext();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'health' | 'danger'>('config');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch system configuration and health
      // These endpoints would need to be implemented in the backend
      setLoading(false);
      
      // Mock data for now
      setConfig({
        maintenanceMode: false,
        debugMode: false,
        registrationEnabled: true,
        maxUsersPerWorkspace: 50,
        maxAudioFileSize: 100, // MB
        maxStoragePerUser: 5000, // MB
        apiRateLimit: 1000, // requests per hour
        webhookRetryLimit: 3,
        sessionTimeout: 24, // hours
        passwordMinLength: 8,
        mfaEnabled: false,
        emailVerificationRequired: true
      });
      
      setHealth({
        databaseStatus: 'healthy',
        redisStatus: 'degraded',
        storageUsage: 65,
        cpuUsage: 45,
        memoryUsage: 72,
        activeConnections: 234,
        queuedJobs: 12,
        failedJobs: 3
      });
    } catch (error) {
      console.error('Error fetching super admin data:', error);
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    if (config) {
      setConfig({ ...config, [key]: value });
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // Save configuration to backend
      console.log('Saving config:', config);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaving(false);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            Advanced Settings
          </h1>
          <p className="text-gray-600 mt-2">Advanced system configuration and monitoring</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Caution: Super Admin Access
            </h3>
            <p className="mt-1 text-sm text-red-700">
              Changes made here affect the entire system. Please ensure you understand the implications of any modifications.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Configuration
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'health'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Health
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'danger'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Danger Zone
          </button>
        </nav>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && config && (
        <div className="space-y-6">
          {/* System Toggles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
                  <p className="text-sm text-gray-500">Block all non-admin access to the system</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.maintenanceMode}
                    onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Debug Mode</h4>
                  <p className="text-sm text-gray-500">Enable verbose logging and debug information</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.debugMode}
                    onChange={(e) => handleConfigChange('debugMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">User Registration</h4>
                  <p className="text-sm text-gray-500">Allow new users to create accounts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.registrationEnabled}
                    onChange={(e) => handleConfigChange('registrationEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* System Limits */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Users per Workspace
                </label>
                <input
                  type="number"
                  value={config.maxUsersPerWorkspace}
                  onChange={(e) => handleConfigChange('maxUsersPerWorkspace', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Audio File Size (MB)
                </label>
                <input
                  type="number"
                  value={config.maxAudioFileSize}
                  onChange={(e) => handleConfigChange('maxAudioFileSize', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Storage per User (MB)
                </label>
                <input
                  type="number"
                  value={config.maxStoragePerUser}
                  onChange={(e) => handleConfigChange('maxStoragePerUser', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  API Rate Limit (per hour)
                </label>
                <input
                  type="number"
                  value={config.apiRateLimit}
                  onChange={(e) => handleConfigChange('apiRateLimit', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <ActionButton
              variant="danger"
              icon={CloudArrowUpIcon}
              onClick={handleSaveConfig}
              loading={saving}
            >
              Save Configuration
            </ActionButton>
          </div>
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === 'health' && health && (
        <div className="space-y-6">
          {/* Health Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Database Status"
              value={health.databaseStatus}
              icon={CircleStackIcon}
              gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            />
            <StatsCard
              title="Active Connections"
              value={health.activeConnections}
              icon={ServerIcon}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Storage Usage"
              value={`${health.storageUsage}%`}
              icon={CircleStackIcon}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatsCard
              title="Failed Jobs"
              value={health.failedJobs}
              icon={ExclamationTriangleIcon}
              gradient="bg-gradient-to-br from-red-500 to-red-600"
            />
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Database</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(health.databaseStatus)}`}>
                  {health.databaseStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Redis Cache</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(health.redisStatus)}`}>
                  {health.redisStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${health.cpuUsage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{health.cpuUsage}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${health.memoryUsage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{health.memoryUsage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-6">
              These actions are irreversible and will affect the entire system. Use with extreme caution.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div>
                  <h4 className="font-medium text-gray-900">Clear All Cache</h4>
                  <p className="text-sm text-gray-500">Remove all cached data from Redis and memory</p>
                </div>
                <ActionButton variant="danger" size="sm">
                  Clear Cache
                </ActionButton>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div>
                  <h4 className="font-medium text-gray-900">Reset All User Sessions</h4>
                  <p className="text-sm text-gray-500">Force all users to log in again</p>
                </div>
                <ActionButton variant="danger" size="sm">
                  Reset Sessions
                </ActionButton>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div>
                  <h4 className="font-medium text-gray-900">Regenerate API Keys</h4>
                  <p className="text-sm text-gray-500">Invalidate all existing API keys</p>
                </div>
                <ActionButton variant="danger" size="sm">
                  Regenerate Keys
                </ActionButton>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div>
                  <h4 className="font-medium text-gray-900">Database Maintenance</h4>
                  <p className="text-sm text-gray-500">Run database optimization and cleanup</p>
                </div>
                <ActionButton variant="danger" size="sm">
                  Run Maintenance
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}