/**
 * Project Jobs Component
 * Displays and manages project jobs list
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  MicrophoneIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface ProjectJob {
  id: string;
  filename: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  transcription?: string;
  summary?: string;
}

interface ProjectJobsProps {
  jobs: ProjectJob[];
}

export const ProjectJobs: React.FC<ProjectJobsProps> = ({ jobs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
          <div className="flex gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MicrophoneIcon className="h-5 w-5" />
              New Job
            </Link>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No jobs found</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{job.filename}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>{formatDuration(job.duration)}</span>
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  {job.summary && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.summary}</p>
                  )}
                </div>
                <ArrowLeftIcon className="h-5 w-5 text-gray-400 rotate-180" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};