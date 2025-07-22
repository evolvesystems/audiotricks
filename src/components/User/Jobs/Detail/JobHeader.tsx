/**
 * Job Header Component
 * Displays job title, status, and basic metadata
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface JobDetail {
  id: string;
  fileName: string;
  originalFileName: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

interface JobHeaderProps {
  job: JobDetail;
}

export const JobHeader: React.FC<JobHeaderProps> = ({ job }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="h-6 w-6 text-red-600" />;
      case 'processing':
        return <ClockIcon className="h-6 w-6 text-blue-600" />;
      default:
        return <ExclamationCircleIcon className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/jobs"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.fileName}</h1>
              <p className="text-sm text-gray-500">
                Original: {job.originalFileName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(job.status)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
          <div>
            <span className="font-medium">Project:</span>{' '}
            <Link 
              to={`/projects/${job.projectId}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {job.projectName}
            </Link>
          </div>
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(job.createdAt).toLocaleDateString()}
          </div>
          {job.completedAt && (
            <div>
              <span className="font-medium">Completed:</span>{' '}
              {new Date(job.completedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};