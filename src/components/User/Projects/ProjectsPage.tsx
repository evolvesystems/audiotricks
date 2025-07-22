/**
 * Projects Page - Manage and organize transcription projects
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { Link } from 'react-router-dom';
import { 
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        logger.error('No authentication token found');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('/api/user/projects', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          jobCount: project.jobCount,
          completedJobs: 0, // TODO: Calculate from job statuses
          status: project.status,
          totalDuration: 0 // TODO: Calculate from job durations
        })));
      } else {
        logger.error('Failed to fetch projects:', response.status);
      }
      
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || project.status === filter;
    return matchesSearch && matchesFilter;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading projects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FolderIcon className="w-6 h-6 text-white" />
            </div>
            Projects
          </h1>
          <p className="text-gray-600 mt-2">Organize your transcriptions into projects for better management</p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Project
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'archived'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-20">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try a different search term' : 'Create your first project to get started'}
          </p>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
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
                      style={{ width: `${(project.completedJobs / project.jobCount) * 100}%` }}
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
          ))}
        </div>
      )}
    </div>
  );
}