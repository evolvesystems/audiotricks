/**
 * Project Detail Page - Refactored view for project management
 * Split into modular components for better maintainability
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectHeader } from './Detail/ProjectHeader';
import { ProjectStats } from './Detail/ProjectStats';
import { ProjectJobs } from './Detail/ProjectJobs';

interface ProjectJob {
  id: string;
  filename: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  transcription?: string;
  summary?: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived';
  stats: {
    totalJobs: number;
    completedJobs: number;
    totalDuration: number;
    averageDuration: number;
  };
  tags: string[];
  settings: {
    autoArchiveAfterDays: number;
    defaultLanguage: string;
    notifyOnCompletion: boolean;
  };
  jobs: ProjectJob[];
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      // Try to fetch from API
      const response = await fetch(`/api/projects/${id}`);
      
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
      } else {
        // Fallback mock data for development
        setProject({
          id: id!,
          name: 'Podcast Episodes',
          description: 'Weekly podcast transcriptions for our show',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-20T00:00:00Z',
          status: 'active',
          stats: {
            totalJobs: 8,
            completedJobs: 6,
            totalDuration: 1440,
            averageDuration: 180
          },
          tags: ['podcast', 'weekly', 'audio'],
          settings: {
            autoArchiveAfterDays: 90,
            defaultLanguage: 'en',
            notifyOnCompletion: true
          },
          jobs: [
            {
              id: '1',
              filename: 'Episode_045_Interview_with_CEO.mp3',
              duration: 180,
              status: 'completed',
              createdAt: '2024-01-20T10:00:00Z',
              transcription: 'Full transcription text...',
              summary: 'Interview with company CEO discussing Q4 results...'
            },
            {
              id: '2',
              filename: 'Episode_044_Tech_Trends_2024.mp3',
              duration: 210,
              status: 'completed',
              createdAt: '2024-01-18T10:00:00Z',
              transcription: 'Full transcription text...',
              summary: 'Discussion about emerging technology trends...'
            },
            {
              id: '3',
              filename: 'Episode_046_Customer_Success.mp3',
              duration: 150,
              status: 'processing',
              createdAt: '2024-01-21T10:00:00Z'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this project?')) return;
    
    try {
      // API call would go here
      navigate('/projects');
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      // API call would go here
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleUpdateName = async (newName: string) => {
    try {
      // API call would go here
      setProject(prev => prev ? { ...prev, name: newName } : null);
    } catch (error) {
      console.error('Error updating project name:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading project details...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-gray-500">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <ProjectHeader 
        project={project}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onUpdateName={handleUpdateName}
      />

      {/* Project Statistics */}
      <ProjectStats stats={project.stats} />

      {/* Project Jobs */}
      <ProjectJobs jobs={project.jobs} />
    </div>
  );
}