/**
 * User Dashboard - Main overview for users
 * Shows recent projects, jobs, and usage statistics
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  ChartBarIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  jobCount: number;
  status: 'active' | 'archived';
}

interface Job {
  id: string;
  fileName: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  duration?: number;
}

interface DashboardStats {
  totalProjects: number;
  totalJobs: number;
  completedJobs: number;
  processingJobs: number;
  failedJobs: number;
  usageThisMonth: {
    audioFiles: number;
    storageUsed: number;
    apiCalls: number;
  };
  limits: {
    audioFiles: number;
    storage: number;
    apiCalls: number;
  };
}

export default function UserDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for now - these endpoints would need to be implemented
      setStats({
        totalProjects: 5,
        totalJobs: 23,
        completedJobs: 20,
        processingJobs: 2,
        failedJobs: 1,
        usageThisMonth: {
          audioFiles: 45,
          storageUsed: 2.3,
          apiCalls: 89
        },
        limits: {
          audioFiles: 100,
          storage: 5,
          apiCalls: 1000
        }
      });

      setRecentProjects([
        {
          id: '1',
          name: 'Podcast Episodes',
          description: 'Weekly podcast transcriptions',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-20',
          jobCount: 8,
          status: 'active'
        },
        {
          id: '2',
          name: 'Meeting Notes',
          description: 'Company meeting recordings',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-18',
          jobCount: 12,
          status: 'active'
        },
        {
          id: '3',
          name: 'Interview Transcripts',
          description: 'Customer interview recordings',
          createdAt: '2024-01-05',
          updatedAt: '2024-01-16',
          jobCount: 3,
          status: 'active'
        }
      ]);

      setRecentJobs([
        {
          id: 'j1',
          fileName: 'episode-24.mp3',
          projectId: '1',
          projectName: 'Podcast Episodes',
          status: 'completed',
          createdAt: '2024-01-20T10:30:00Z',
          completedAt: '2024-01-20T10:33:00Z',
          duration: 180
        },
        {
          id: 'j2',
          fileName: 'meeting-jan19.wav',
          projectId: '2',
          projectName: 'Meeting Notes',
          status: 'processing',
          createdAt: '2024-01-20T09:15:00Z'
        },
        {
          id: 'j3',
          fileName: 'interview-customer-5.mp3',
          projectId: '3',
          projectName: 'Interview Transcripts',
          status: 'completed',
          createdAt: '2024-01-19T14:20:00Z',
          completedAt: '2024-01-19T14:22:00Z',
          duration: 120
        },
        {
          id: 'j4',
          fileName: 'episode-23.mp3',
          projectId: '1',
          projectName: 'Podcast Episodes',
          status: 'failed',
          createdAt: '2024-01-19T11:00:00Z'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your projects and transcriptions.</p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Project
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FolderIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedJobs}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-3xl font-bold text-gray-900">{stats.processingJobs}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Overview */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Usage This Month
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Audio Files</span>
                <span className="font-medium">{stats.usageThisMonth.audioFiles} / {stats.limits.audioFiles}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(stats.usageThisMonth.audioFiles / stats.limits.audioFiles) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Storage</span>
                <span className="font-medium">{stats.usageThisMonth.storageUsed}GB / {stats.limits.storage}GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${(stats.usageThisMonth.storageUsed / stats.limits.storage) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">API Calls</span>
                <span className="font-medium">{stats.usageThisMonth.apiCalls} / {stats.limits.apiCalls}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(stats.usageThisMonth.apiCalls / stats.limits.apiCalls) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
              <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FolderIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-500">{project.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Updated {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {project.jobCount} jobs
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Transcriptions</h3>
              <Link to="/jobs" className="text-sm text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getJobStatusIcon(job.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{job.fileName}</h4>
                        <p className="text-sm text-gray-500">{job.projectName}</p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(job.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}