/**
 * User Dashboard - Main overview for users
 * Shows recent projects, jobs, and usage statistics
 */

import React, { useState, useEffect } from 'react';
import { DashboardStats } from './Dashboard/DashboardStats';
import { RecentProjects } from './Dashboard/RecentProjects';
import { RecentJobs } from './Dashboard/RecentJobs';

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

interface DashboardStatsData {
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
}

export const UserDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsData>({
    totalProjects: 0,
    totalJobs: 0,
    completedJobs: 0,
    processingJobs: 0,
    failedJobs: 0,
    usageThisMonth: {
      audioFiles: 0,
      storageUsed: 0,
      apiCalls: 0
    }
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Load dashboard statistics
      const statsResponse = await fetch('/api/dashboard/stats', { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent activity (projects and jobs)
      const recentResponse = await fetch('/api/dashboard/recent', { headers });
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentProjects(recentData.projects || []);
        setRecentJobs(recentData.jobs || []);
      }

    } catch (error) {
      // Failed to load dashboard data - using fallback data
      // Set mock data for development
      setStats({
        totalProjects: 3,
        totalJobs: 15,
        completedJobs: 12,
        processingJobs: 2,
        failedJobs: 1,
        usageThisMonth: {
          audioFiles: 25,
          storageUsed: 1024,
          apiCalls: 150
        }
      });
      
      setRecentProjects([
        {
          id: '1',
          name: 'Podcast Episodes',
          description: 'Weekly podcast transcriptions',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T15:30:00Z',
          jobCount: 8,
          status: 'active'
        },
        {
          id: '2',
          name: 'Meeting Notes',
          description: 'Company meeting transcriptions',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-18T14:20:00Z',
          jobCount: 5,
          status: 'active'
        }
      ]);
      
      setRecentJobs([
        {
          id: '1',
          fileName: 'episode-15.mp3',
          projectId: '1',
          projectName: 'Podcast Episodes',
          status: 'completed',
          createdAt: '2024-01-20T10:00:00Z',
          completedAt: '2024-01-20T10:05:00Z',
          duration: 1800
        },
        {
          id: '2',
          fileName: 'meeting-jan-18.wav',
          projectId: '2',
          projectName: 'Meeting Notes',
          status: 'processing',
          createdAt: '2024-01-18T14:00:00Z'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>

      {/* Dashboard Statistics */}
      <DashboardStats stats={stats} isLoading={isLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <RecentProjects projects={recentProjects} isLoading={isLoading} />

        {/* Recent Jobs */}
        <RecentJobs jobs={recentJobs} isLoading={isLoading} />
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
        <div className="px-6 py-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">
            Ready to transcribe more audio?
          </h3>
          <p className="text-blue-100 mb-6">
            Upload new files, create projects, or explore advanced features.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <a
              href="/upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors"
            >
              Upload Audio
            </a>
            <a
              href="/projects/new"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Create Project
            </a>
          </div>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">This Month's Usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.usageThisMonth.audioFiles}</div>
            <div className="text-sm text-gray-500">Audio Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(stats.usageThisMonth.storageUsed / 1024).toFixed(1)} GB
            </div>
            <div className="text-sm text-gray-500">Storage Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.usageThisMonth.apiCalls}</div>
            <div className="text-sm text-gray-500">API Calls</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;