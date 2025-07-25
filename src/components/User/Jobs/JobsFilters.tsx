/**
 * Jobs Filters - Search and filter controls for jobs
 */

import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface JobsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'pending' | 'processing' | 'completed' | 'failed';
  setStatusFilter: (status: 'all' | 'pending' | 'processing' | 'completed' | 'failed') => void;
  projectFilter: string;
  setProjectFilter: (project: string) => void;
  uniqueProjects: string[];
}

export default function JobsFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  projectFilter,
  setProjectFilter,
  uniqueProjects
}: JobsFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Projects</option>
          {uniqueProjects.map((project) => (
            <option key={project} value={project}>{project}</option>
          ))}
        </select>
      </div>
    </div>
  );
}