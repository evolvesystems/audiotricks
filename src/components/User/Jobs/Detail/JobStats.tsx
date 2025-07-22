/**
 * Job Statistics Component
 * Displays file metrics and processing statistics
 */

import React from 'react';
import { 
  DocumentTextIcon,
  ClockIcon,
  LanguageIcon,
  MicrophoneIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface JobDetail {
  duration: number;
  fileSize: number;
  confidence?: number;
  language: string;
  processingTime?: number;
  wordCount?: number;
  speakerCount?: number;
}

interface JobStatsProps {
  job: JobDetail;
}

export const JobStats: React.FC<JobStatsProps> = ({ job }) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const stats = [
    {
      label: 'Duration',
      value: formatDuration(job.duration),
      icon: ClockIcon,
      color: 'text-blue-600'
    },
    {
      label: 'File Size',
      value: formatFileSize(job.fileSize),
      icon: DocumentTextIcon,
      color: 'text-green-600'
    },
    {
      label: 'Language',
      value: job.language || 'Auto-detected',
      icon: LanguageIcon,
      color: 'text-purple-600'
    },
    {
      label: 'Confidence',
      value: job.confidence ? `${Math.round(job.confidence * 100)}%` : 'N/A',
      icon: ChartBarIcon,
      color: 'text-orange-600'
    }
  ];

  const additionalStats = [
    { label: 'Processing Time', value: job.processingTime ? `${job.processingTime}s` : 'N/A' },
    { label: 'Word Count', value: job.wordCount?.toLocaleString() || 'N/A' },
    { label: 'Speakers', value: job.speakerCount || 'N/A' }
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Job Statistics</h3>
        
        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex justify-center mb-2">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Additional Stats */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-3 gap-4">
            {additionalStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};