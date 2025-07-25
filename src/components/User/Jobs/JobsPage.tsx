/**
 * Jobs Page - View and manage transcription jobs
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import JobsFilters from './JobsFilters';
import JobsTable from './JobsTable';
import { apiClient } from '../../../services/api';

interface Job {
  id: string;
  fileName: string;
  originalFileName: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  duration: number;
  fileSize: number;
  transcriptionText?: string;
  confidence?: number;
  language: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await apiClient.get('/jobs');
      setJobs(data.jobs.map((job: any) => ({
        id: job.id,
        fileName: job.fileName,
        originalFileName: job.fileName,
        projectId: job.projectId,
        projectName: job.projectName,
        status: job.status,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        duration: job.duration || 0,
        fileSize: job.fileSize || 0,
        transcriptionText: job.results?.transcription,
        confidence: job.results?.confidence,
        language: 'en'
      })));
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesProject = projectFilter === 'all' || job.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const uniqueProjects = Array.from(new Set(jobs.map(job => job.projectName)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            Jobs
          </h1>
          <p className="text-gray-600 mt-2">View and manage your audio transcription jobs</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <CloudArrowUpIcon className="h-5 w-5" />
          Upload Audio
        </Link>
      </div>

      <JobsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        uniqueProjects={uniqueProjects}
      />

      <JobsTable 
        jobs={filteredJobs}
        searchTerm={searchTerm}
      />
    </div>
  );
}