/**
 * Project Detail Page - View and manage individual project
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FolderIcon,
  ArrowLeftIcon,
  PlusIcon,
  BriefcaseIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      // Mock data for now
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
      setNewName('Podcast Episodes');
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

  const handleUpdateName = async () => {
    if (newName.trim() && newName !== project?.name) {
      try {
        // API call would go here
        setProject(prev => prev ? { ...prev, name: newName } : null);
      } catch (error) {
        console.error('Error updating project name:', error);
      }
    }
    setEditingName(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredJobs = project?.jobs.filter(job =>
    job.filename.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading project details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Projects
        </Link>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FolderIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={handleUpdateName}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                      className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
                <p className="text-gray-600 mt-1">{project.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {project.tags.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {project.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleArchive}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArchiveBoxIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-xl font-semibold text-gray-900">{project.stats.totalJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-semibold text-gray-900">{project.stats.completedJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Duration</p>
              <p className="text-xl font-semibold text-gray-900">{formatDuration(project.stats.totalDuration)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-xl font-semibold text-gray-900">{formatDuration(project.stats.averageDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
            <div className="flex gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MicrophoneIcon className="h-5 w-5" />
                New Job
              </Link>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredJobs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No jobs found</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{job.filename}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{formatDuration(job.duration)}</span>
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    {job.summary && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.summary}</p>
                    )}
                  </div>
                  <ArrowLeftIcon className="h-5 w-5 text-gray-400 rotate-180" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}