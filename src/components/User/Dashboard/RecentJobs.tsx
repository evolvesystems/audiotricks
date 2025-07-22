/**
 * Recent Jobs Component
 * Shows list of recent jobs with status
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

interface Job {
  id: string;
  fileName: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  duration?: number;
}

interface RecentJobsProps {
  jobs: Job[];
  isLoading: boolean;
}

export const RecentJobs: React.FC<RecentJobsProps> = ({ jobs, isLoading }) => {
  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Jobs</h2>
        </div>
        <div className="p-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Recent Jobs</h2>
        <Link
          to="/upload"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <CloudArrowUpIcon className="h-4 w-4 mr-1" />
          Upload Audio
        </Link>
      </div>
      
      <div className="divide-y divide-gray-200">
        {jobs.length === 0 ? (
          <div className="p-6 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs yet</h3>
            <p className="mt-1 text-sm text-gray-500">Upload your first audio file to get started.</p>
            <div className="mt-6">
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Upload Audio
              </Link>
            </div>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getStatusIcon(job.status)}
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {job.fileName}
                      </Link>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Project: {job.projectName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created {new Date(job.createdAt).toLocaleDateString()}
                      {job.completedAt && ` • Completed ${new Date(job.completedAt).toLocaleDateString()}`}
                      {job.duration && ` • ${Math.round(job.duration / 60)}m ${job.duration % 60}s`}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    View →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {jobs.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <Link
            to="/jobs"
            className="text-sm text-blue-600 hover:text-blue-900 font-medium"
          >
            View all jobs →
          </Link>
        </div>
      )}
    </div>
  );
};