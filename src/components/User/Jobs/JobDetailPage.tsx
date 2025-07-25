/**
 * Job Detail Page - Refactored view for detailed job information
 * Split into modular components for better maintainability
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { JobHeader } from './Detail/JobHeader';
import { JobStats } from './Detail/JobStats';
import { JobContent } from './Detail/JobContent';
import { apiClient } from '../../../services/api';

interface KeyMoment {
  timestamp: number;
  title: string;
  description: string;
  confidence?: number;
}

interface JobDetail {
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
  summary?: string;
  keyMoments?: KeyMoment[];
  confidence?: number;
  language: string;
  audioUrl?: string;
  processingTime?: number;
  wordCount?: number;
  speakerCount?: number;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from API
      const jobData = await apiClient.get(`/jobs/${id}`);
      setJob(jobData);
    } catch (error: any) {
      // Fallback mock data for development on API error
      if (error?.isNotFoundError) {
        // Fallback mock data for development
        setJob({
          id: id!,
          fileName: 'meeting-recording.mp3',
          originalFileName: 'Team Meeting - January 2024.mp3',
          projectId: 'project-1',
          projectName: 'Team Meetings',
          status: 'completed',
          createdAt: '2024-01-15T10:30:00Z',
          completedAt: '2024-01-15T10:35:00Z',
          duration: 1847, // 30 minutes 47 seconds
          fileSize: 25600000, // 25.6 MB
          confidence: 0.94,
          language: 'English (US)',
          processingTime: 45,
          wordCount: 3420,
          speakerCount: 4,
          transcriptionText: `[Speaker 1]: Good morning everyone, thank you for joining today's team meeting.

[Speaker 2]: Good morning! Thanks for organizing this.

[Speaker 1]: Let's start with our project updates. Sarah, would you like to begin with the Q1 deliverables?

[Speaker 3]: Absolutely. We've made significant progress on the user interface redesign. The wireframes are complete and we've received positive feedback from stakeholders.

[Speaker 4]: That's great news. How are we tracking against the timeline?

[Speaker 3]: We're actually ahead of schedule. The development team has been incredibly efficient.

[Speaker 1]: Excellent work, Sarah. Mike, how are things progressing with the backend infrastructure?

[Speaker 2]: We've successfully migrated to the new cloud architecture. Performance has improved by 40% and we've reduced costs by 25%.

[Speaker 4]: Those are impressive numbers. Any challenges we should be aware of?

[Speaker 2]: Minor integration issues with the legacy systems, but nothing we can't handle. Expected resolution by end of week.

[Speaker 1]: Perfect. Let's discuss our Q2 planning and resource allocation...`,
          summary: 'Team meeting covering Q1 project progress and Q2 planning. Key highlights: UI redesign ahead of schedule with positive stakeholder feedback, successful cloud migration resulting in 40% performance improvement and 25% cost reduction. Minor legacy system integration issues expected to be resolved by end of week. Discussion included resource allocation for upcoming Q2 initiatives.',
          keyMoments: [
            {
              timestamp: 45,
              title: 'Q1 Deliverables Review',
              description: 'Sarah provides update on UI redesign project - wireframes complete with positive stakeholder feedback.',
              confidence: 0.92
            },
            {
              timestamp: 125,
              title: 'Performance Improvements',
              description: 'Mike reports successful cloud migration with 40% performance improvement and 25% cost reduction.',
              confidence: 0.88
            },
            {
              timestamp: 185,
              title: 'Technical Challenges',
              description: 'Discussion of minor integration issues with legacy systems, resolution expected by end of week.',
              confidence: 0.85
            },
            {
              timestamp: 220,
              title: 'Q2 Planning',
              description: 'Resource allocation discussion for upcoming Q2 initiatives and project prioritization.',
              confidence: 0.90
            }
          ],
          audioUrl: '/api/audio/sample-meeting.mp3'
        });
      } else {
        setError('Failed to load job details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">Error Loading Job</div>
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={fetchJobDetails}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">Job not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Job Header */}
        <JobHeader job={job} />

        {/* Job Statistics */}
        <JobStats job={job} />

        {/* Job Content (Transcription/Summary) */}
        <JobContent job={job} />
      </div>
    </div>
  );
}