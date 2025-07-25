/**
 * Projects Empty State Component - Display when no projects found
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ProjectsEmptyStateProps {
  searchTerm: string;
}

export const ProjectsEmptyState: React.FC<ProjectsEmptyStateProps> = ({ searchTerm }) => {
  return (
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
  );
};