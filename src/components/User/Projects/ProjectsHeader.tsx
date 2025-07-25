/**
 * Projects Header Component - Header section for projects page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ProjectsHeaderProps {
  searchTerm: string;
  filter: 'all' | 'active' | 'archived';
  onSearchChange: (term: string) => void;
  onFilterChange: (filter: 'all' | 'active' | 'archived') => void;
}

export const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({
  searchTerm,
  filter,
  onSearchChange,
  onFilterChange
}) => {
  return (
    <>
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => onFilterChange('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => onFilterChange('archived')}
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
    </>
  );
};