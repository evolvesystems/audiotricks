/**
 * System Actions Panel
 * Dangerous system operations and maintenance tasks
 */

import React, { useState } from 'react';
import { 
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ActionButton from '../../Dashboard/ActionButton';

interface SystemActionsPanelProps {
  onAction: (action: string, params?: any) => Promise<void>;
}

export const SystemActionsPanel: React.FC<SystemActionsPanelProps> = ({ onAction }) => {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleAction = async (action: string, params?: any) => {
    if (action !== confirmAction) {
      setConfirmAction(action);
      return;
    }

    setIsExecuting(true);
    try {
      await onAction(action, params);
    } finally {
      setIsExecuting(false);
      setConfirmAction(null);
    }
  };

  const systemActions = [
    {
      id: 'backup-database',
      title: 'Backup Database',
      description: 'Create a full backup of the database',
      icon: CloudArrowUpIcon,
      danger: false,
      confirmText: 'Create backup now?'
    },
    {
      id: 'clear-cache',
      title: 'Clear System Cache',
      description: 'Clear all cached data and force refresh',
      icon: ArrowPathIcon,
      danger: false,
      confirmText: 'Clear all caches?'
    },
    {
      id: 'restart-workers',
      title: 'Restart Background Workers',
      description: 'Restart all background job processors',
      icon: ArrowPathIcon,
      danger: true,
      confirmText: 'Restart all workers? This may interrupt processing jobs.'
    },
    {
      id: 'cleanup-old-files',
      title: 'Cleanup Old Files',
      description: 'Remove files older than 90 days with no references',
      icon: TrashIcon,
      danger: true,
      confirmText: 'Delete old unreferenced files? This cannot be undone.'
    },
    {
      id: 'reset-failed-jobs',
      title: 'Reset Failed Jobs',
      description: 'Clear all failed jobs from the queue',
      icon: ExclamationTriangleIcon,
      danger: true,
      confirmText: 'Reset all failed jobs? This will clear the error queue.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
        <h3 className="text-lg font-medium text-gray-900">System Actions</h3>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">
              Warning: System Actions
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              These actions can affect system performance and data. Use with caution.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {systemActions.map((action) => (
          <div
            key={action.id}
            className={`border rounded-lg p-4 ${
              action.danger 
                ? 'border-red-200 bg-red-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <action.icon className={`h-6 w-6 mt-1 ${
                  action.danger ? 'text-red-600' : 'text-blue-600'
                }`} />
                <div>
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  
                  {confirmAction === action.id && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800 font-medium">
                        {action.confirmText}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleAction(action.id)}
                          disabled={isExecuting}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {isExecuting ? 'Executing...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmAction(null)}
                          disabled={isExecuting}
                          className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {confirmAction !== action.id && (
                <ActionButton
                  onClick={() => handleAction(action.id)}
                  variant={action.danger ? 'danger' : 'secondary'}
                  disabled={isExecuting}
                  size="sm"
                >
                  Execute
                </ActionButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};