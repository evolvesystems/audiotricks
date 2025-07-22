// Statistics cards component

import { UsersIcon, ChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { StatsCardsProps } from './types';

export default function StatsCards({ stats }: StatsCardsProps) {
  // Handle null/undefined stats
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="mt-4">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <UsersIcon className="w-10 h-10 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-semibold">{stats.totalUsers || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <UsersIcon className="w-10 h-10 text-green-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-semibold">{stats.activeUsers || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <ChartBarIcon className="w-10 h-10 text-purple-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Audio Processed</p>
            <p className="text-2xl font-semibold">{stats.totalAudioProcessed || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <ShieldCheckIcon className="w-10 h-10 text-orange-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Admins</p>
            <p className="text-2xl font-semibold">{stats.usersByRole?.admin || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}