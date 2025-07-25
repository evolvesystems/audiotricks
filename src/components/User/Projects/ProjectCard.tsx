/**
 * Project Card Component - Individual project display card
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderIcon,
  EllipsisVerticalIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  jobCount: number;
  completedJobs: number;
  status: 'active' | 'archived';
  totalDuration: number;
}

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const progressPercentage = project.jobCount > 0 
    ? (project.completedJobs / project.jobCount) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Jobs</span>
            <span className="font-medium">{project.completedJobs} / {project.jobCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Total: {formatDuration(project.totalDuration)}</span>
            <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/projects/${project.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
          <Link
            to={`/projects/${project.id}/jobs`}
            className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <DocumentTextIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};