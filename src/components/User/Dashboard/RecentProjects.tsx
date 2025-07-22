/**
 * Recent Projects Component
 * Shows list of recent projects with stats
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  jobCount: number;
  status: 'active' | 'archived';
}

interface RecentProjectsProps {
  projects: Project[];
  isLoading: boolean;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({ projects, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
        </div>
        <div className="p-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
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
        <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
        <Link
          to="/projects/new"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          New Project
        </Link>
      </div>
      
      <div className="divide-y divide-gray-200">
        {projects.length === 0 ? (
          <div className="p-6 text-center">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
            <div className="mt-6">
              <Link
                to="/projects/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </div>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FolderIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {project.name}
                      </Link>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{project.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {project.jobCount} jobs • Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    to={`/projects/${project.id}`}
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
      
      {projects.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <Link
            to="/projects"
            className="text-sm text-blue-600 hover:text-blue-900 font-medium"
          >
            View all projects →
          </Link>
        </div>
      )}
    </div>
  );
};