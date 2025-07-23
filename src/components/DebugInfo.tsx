import React, { useState, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { networkStatus } from '../utils/networkStatus';
import { healthChecker } from '../utils/healthCheck';
import { useAuth } from '../contexts/AuthContext';

interface DebugInfoProps {
  isVisible: boolean;
  onClose: () => void;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ isVisible, onClose }) => {
  const { user, token, loading, isAuthenticated, error } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    if (!isVisible) return;

    // Check network status
    setIsOnline(networkStatus.getStatus());
    const unsubscribe = networkStatus.subscribe(setIsOnline);

    // Check API health
    healthChecker.checkHealth().then(setHealthStatus);

    return unsubscribe;
  }, [isVisible]);

  const copyDebugInfo = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      networkStatus: isOnline,
      healthStatus,
      auth: {
        isAuthenticated,
        hasToken: !!token,
        hasUser: !!user,
        loading,
        error
      },
      localStorage: {
        hasOpenAIKey: !!localStorage.getItem('openai_api_key'),
        hasElevenLabsKey: !!localStorage.getItem('elevenlabs_api_key'),
        hasAuthToken: !!localStorage.getItem('authToken')
      },
      environment: {
        isDevelopment: import.meta.env.DEV,
        apiUrl: import.meta.env.VITE_API_URL || 'same-origin'
      }
    };

    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <InformationCircleIcon className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold">Debug Information</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Network Status */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Network Status</h3>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm">
                Online: <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                  {isOnline ? 'Yes' : 'No'}
                </span>
              </p>
            </div>
          </div>

          {/* Authentication Status */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Authentication</h3>
            <div className="bg-gray-50 p-3 rounded space-y-1">
              <p className="text-sm">Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
              <p className="text-sm">Has Token: {token ? 'Yes' : 'No'}</p>
              <p className="text-sm">Has User: {user ? 'Yes' : 'No'}</p>
              <p className="text-sm">Loading: {loading ? 'Yes' : 'No'}</p>
              {error && (
                <p className="text-sm text-red-600">Error: {error}</p>
              )}
            </div>
          </div>

          {/* API Health */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">API Health</h3>
            <div className="bg-gray-50 p-3 rounded">
              {healthStatus ? (
                <div className="space-y-1">
                  <p className="text-sm">API: {healthStatus.api ? '✅' : '❌'}</p>
                  <p className="text-sm">Database: {healthStatus.database ? '✅' : '❌'}</p>
                  <p className="text-sm">Storage: {healthStatus.storage ? '✅' : '❌'}</p>
                  <p className="text-xs text-gray-500">
                    Last checked: {new Date(healthStatus.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Checking...</p>
              )}
            </div>
          </div>

          {/* Browser Info */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Browser Info</h3>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600 break-all">
                {navigator.userAgent}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={copyDebugInfo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Copy Debug Info
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugInfo;