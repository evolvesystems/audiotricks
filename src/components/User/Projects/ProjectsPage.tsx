/**
 * Projects Page - Manage and organize transcription projects
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { apiClient } from '../../../services/api';
import { ProjectsHeader } from './ProjectsHeader';
import { ProjectCard } from './ProjectCard';
import { ProjectsEmptyState } from './ProjectsEmptyState';

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
      const data = await apiClient.get('/user/projects');
      
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
      <ProjectsHeader
        searchTerm={searchTerm}
        filter={filter}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilter}
      />

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <ProjectsEmptyState searchTerm={searchTerm} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}