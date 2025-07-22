/**
 * System Health Monitoring Panel
 * Shows real-time system status and metrics
 */

import React from 'react';
import { 
  ServerIcon, 
  CircleStackIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import StatsCard from '../../Dashboard/StatsCard';

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

interface SystemHealthPanelProps {
  health: SystemHealth | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ 
  health, 
  isLoading, 
  onRefresh 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600';
    if (usage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!health && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" />
          <p>Unable to load system health data</p>
          <button 
            onClick={onRefresh}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <CircleStackIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Database</span>
            <span className={`text-sm ${getStatusColor(health?.databaseStatus || 'error')}`}>
              {health?.databaseStatus || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <ServerIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Redis</span>
            <span className={`text-sm ${getStatusColor(health?.redisStatus || 'error')}`}>
              {health?.redisStatus || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="CPU Usage"
          value={`${health?.cpuUsage || 0}%`}
          icon={ServerIcon}
          color={getUsageColor(health?.cpuUsage || 0)}
          trend={health?.cpuUsage && health.cpuUsage > 80 ? 'warning' : 'stable'}
        />

        <StatsCard
          title="Memory Usage"
          value={`${health?.memoryUsage || 0}%`}
          icon={CircleStackIcon}
          color={getUsageColor(health?.memoryUsage || 0)}
          trend={health?.memoryUsage && health.memoryUsage > 80 ? 'warning' : 'stable'}
        />

        <StatsCard
          title="Storage Usage"
          value={`${health?.storageUsage || 0}%`}
          icon={CircleStackIcon}
          color={getUsageColor(health?.storageUsage || 0)}
          trend={health?.storageUsage && health.storageUsage > 90 ? 'warning' : 'stable'}
        />

        <StatsCard
          title="Active Connections"
          value={health?.activeConnections?.toString() || '0'}
          icon={ServerIcon}
          color="text-blue-600"
          trend="stable"
        />
      </div>

      {/* Job Queue Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Job Queue Status</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Queued Jobs</p>
            <p className="text-2xl font-bold text-yellow-600">{health?.queuedJobs || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Failed Jobs</p>
            <p className="text-2xl font-bold text-red-600">{health?.failedJobs || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};