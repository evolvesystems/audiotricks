/**
 * Project Stats Component
 * Displays project statistics in a grid layout
 */

import React from 'react';
import { 
  BriefcaseIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface ProjectStats {
  totalJobs: number;
  completedJobs: number;
  totalDuration: number;
  averageDuration: number;
}

interface ProjectStatsProps {
  stats: ProjectStats;
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ stats }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const statItems = [
    {
      label: 'Total Jobs',
      value: stats.totalJobs,
      icon: BriefcaseIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Completed',
      value: stats.completedJobs,
      icon: DocumentTextIcon,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      label: 'Total Duration',
      value: formatDuration(stats.totalDuration),
      icon: ClockIcon,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      label: 'Avg Duration',
      value: formatDuration(stats.averageDuration),
      icon: ChartBarIcon,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="text-xl font-semibold text-gray-900">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};