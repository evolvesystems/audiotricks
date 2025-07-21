/**
 * Job Detail Page - View detailed information about a specific job
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  LanguageIcon,
  MicrophoneIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

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
  confidence?: number;
  language: string;
  audioUrl?: string;
  processingTime?: number;
  wordCount?: number;
  speakerCount?: number;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transcription' | 'summary'>('transcription');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      // Mock data for now
      setJob({
        id: id!,
        fileName: 'episode-24.mp3',
        originalFileName: 'podcast-episode-24-final.mp3',
        projectId: '1',
        projectName: 'Podcast Episodes',
        status: 'completed',
        createdAt: '2024-01-20T10:30:00Z',
        completedAt: '2024-01-20T10:33:00Z',
        duration: 1800,
        fileSize: 25600000,
        transcriptionText: `Welcome to our podcast, episode 24. Today we're discussing the future of artificial intelligence and its impact on various industries.

[00:00:15] Host: Good morning everyone, and welcome back to Tech Talks. I'm your host, John Smith, and today we have a very special guest with us.

[00:00:25] Guest: Thank you for having me, John. I'm excited to be here.

[00:00:30] Host: Let's dive right into it. AI has been making headlines everywhere. What are your thoughts on the current state of AI technology?

[00:00:40] Guest: Well, we're at a fascinating inflection point. The advances in large language models and generative AI have been absolutely remarkable. We're seeing applications that would have been science fiction just a few years ago.

[00:01:00] Host: Can you give us some specific examples?

[00:01:05] Guest: Absolutely. In healthcare, we're seeing AI assist with diagnoses, drug discovery, and personalized treatment plans. In creative industries, AI is helping with content creation, design, and even music composition.

[00:01:25] Host: That's incredible. But what about the concerns people have about AI?

[00:01:30] Guest: Those concerns are very valid and we need to address them seriously. Issues around job displacement, privacy, bias, and the need for proper regulation are all critical topics that require thoughtful discussion and action.

[00:01:50] Host: How do you see the future unfolding?

[00:02:00] Guest: I believe we'll see a collaborative future where AI augments human capabilities rather than replacing them entirely. The key is to ensure we develop and deploy these technologies responsibly, with proper safeguards and ethical considerations in place.

[Transcript continues...]`,
        summary: `This podcast episode features an in-depth discussion about the current state and future of artificial intelligence. The guest expert covers several key topics:

1. **Current AI Landscape**: The conversation highlights the remarkable advances in large language models and generative AI, noting we're at a critical inflection point in the technology's development.

2. **Real-world Applications**: Specific examples are provided across industries:
   - Healthcare: AI assists with diagnoses, drug discovery, and personalized treatment
   - Creative industries: AI helps with content creation, design, and music composition

3. **Concerns and Challenges**: The discussion acknowledges legitimate concerns including:
   - Job displacement
   - Privacy issues
   - AI bias
   - Need for proper regulation

4. **Future Outlook**: The guest envisions a collaborative future where AI augments rather than replaces human capabilities, emphasizing the importance of responsible development and deployment with proper safeguards and ethical considerations.

The conversation maintains a balanced perspective, acknowledging both the transformative potential and the challenges that need to be addressed as AI technology continues to evolve.`,
        confidence: 0.95,
        language: 'en',
        audioUrl: '/audio/episode-24.mp3',
        processingTime: 180,
        wordCount: 2847,
        speakerCount: 2
      });
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTranscription = () => {
    if (!job?.transcriptionText) return;
    
    const blob = new Blob([job.transcriptionText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.fileName.replace(/\.[^/.]+$/, '')}_transcription.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCopyTranscription = async () => {
    if (!job?.transcriptionText) return;
    
    try {
      await navigator.clipboard.writeText(job.transcriptionText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'processing':
        return <ClockIcon className="h-6 w-6 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <ExclamationCircleIcon className="h-6 w-6 text-gray-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading || !job) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading job details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Jobs
        </Link>
        
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  job.status === 'completed' ? 'bg-green-100' :
                  job.status === 'processing' ? 'bg-yellow-100' :
                  job.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {getStatusIcon(job.status)}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{job.fileName}</h1>
                  <p className="text-sm text-gray-500 mt-1">Original: {job.originalFileName}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    <Link to={`/projects/${job.projectId}`} className="text-sm text-blue-600 hover:text-blue-700">
                      {job.projectName}
                    </Link>
                  </div>
                </div>
              </div>
              
              {job.status === 'completed' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyTranscription}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDownloadTranscription}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium text-gray-900">{formatDuration(job.duration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">File Size</p>
                <p className="font-medium text-gray-900">{formatFileSize(job.fileSize)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Language</p>
                <p className="font-medium text-gray-900">{job.language.toUpperCase()}</p>
              </div>
              {job.confidence && (
                <div>
                  <p className="text-sm text-gray-500">Confidence</p>
                  <p className="font-medium text-gray-900">{Math.round(job.confidence * 100)}%</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">{formatDateTime(job.createdAt)}</p>
              </div>
              {job.completedAt && (
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium text-gray-900">{formatDateTime(job.completedAt)}</p>
                </div>
              )}
              {job.processingTime && (
                <div>
                  <p className="text-sm text-gray-500">Processing Time</p>
                  <p className="font-medium text-gray-900">{job.processingTime}s</p>
                </div>
              )}
              {job.wordCount && (
                <div>
                  <p className="text-sm text-gray-500">Word Count</p>
                  <p className="font-medium text-gray-900">{job.wordCount.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      {job.status === 'completed' && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('transcription')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'transcription'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  Transcription
                </div>
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4" />
                  Summary
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'transcription' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Full Transcription</h3>
                  {copySuccess && (
                    <span className="text-sm text-green-600">Copied to clipboard!</span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 font-sans">
                    {job.transcriptionText}
                  </pre>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">AI Summary</h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {job.summary?.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Failed State */}
      {job.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <XCircleIcon className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="text-lg font-medium text-red-900">Processing Failed</h3>
              <p className="text-red-700 mt-1">
                There was an error processing this audio file. Please try uploading it again.
              </p>
              <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                Retry Processing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing State */}
      {job.status === 'processing' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-yellow-500 animate-spin" />
            <div>
              <h3 className="text-lg font-medium text-yellow-900">Processing Audio</h3>
              <p className="text-yellow-700 mt-1">
                Your audio file is being transcribed. This may take a few minutes depending on the file size.
              </p>
              <div className="mt-3 w-64 bg-yellow-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}