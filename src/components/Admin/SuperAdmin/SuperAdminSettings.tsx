/**
 * Advanced Admin Settings Dashboard
 * Refactored system configuration and management for administrators
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuthContext } from '../../../contexts/AdminAuthContext';
import { SystemHealthPanel } from './Settings/SystemHealthPanel';
import { SystemConfigPanel } from './Settings/SystemConfigPanel';
import { SystemActionsPanel } from './Settings/SystemActionsPanel';

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
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const tabs = ['System Health', 'Configuration', 'System Actions'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadSystemConfig(),
        loadSystemHealth()
      ]);
    } catch (error) {
      setError('Failed to load system data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemConfig = async () => {
    try {
      const response = await fetch('/api/admin/system/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = response.ok ? await response.json() : {
        maintenanceMode: false, debugMode: false, registrationEnabled: true,
        maxUsersPerWorkspace: 10, maxAudioFileSize: 500, maxStoragePerUser: 10,
        apiRateLimit: 1000, webhookRetryLimit: 3, sessionTimeout: 30,
        passwordMinLength: 8, mfaEnabled: false, emailVerificationRequired: true
      };
      setConfig(data);
    } catch (error) {
      throw new Error('Failed to load system configuration');
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system/health', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = response.ok ? await response.json() : {
        databaseStatus: 'healthy', redisStatus: 'healthy', storageUsage: 45,
        cpuUsage: 23, memoryUsage: 67, activeConnections: 15, queuedJobs: 3, failedJobs: 0
      };
      setHealth(data);
    } catch (error) {
      throw new Error('Failed to load system health');
    }
  };

  const handleConfigChange = (field: keyof SystemConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
    setSuccessMessage(null);
    setError(null);
  };

  const saveSystemConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/system/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setSuccessMessage('System configuration saved successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to save configuration');
      }
    } catch (error) {
      setError('Network error while saving configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSystemAction = async (action: string, params?: any) => {
    try {
      const response = await fetch(`/api/admin/system/actions/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(params || {})
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(result.message || `${action} completed successfully`);
        if (['restart-workers', 'clear-cache'].includes(action)) {
          setTimeout(loadSystemHealth, 2000);
        }
      } else {
        setError(`Failed to execute ${action}`);
      }
    } catch (error) {
      setError(`Network error during ${action}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <SystemHealthPanel
            health={health}
            isLoading={isLoading}
            onRefresh={loadSystemHealth}
          />
        );
      case 1:
        return (
          <SystemConfigPanel
            config={config}
            onChange={handleConfigChange}
            onSave={saveSystemConfig}
            isSaving={isSaving}
          />
        );
      case 2:
        return (
          <SystemActionsPanel
            onAction={handleSystemAction}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Advanced system configuration and monitoring tools.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}