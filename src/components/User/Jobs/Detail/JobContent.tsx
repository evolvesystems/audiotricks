/**
 * Job Content Component
 * Displays transcription and summary with tabs
 */

import React, { useState } from 'react';
import { 
  DocumentTextIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { logger } from '../../../../utils/logger';

interface KeyMoment {
  timestamp: number;
  title: string;
  description: string;
  confidence?: number;
}

interface JobDetail {
  transcriptionText?: string;
  summary?: string;
  keyMoments?: KeyMoment[];
  audioUrl?: string;
}

interface JobContentProps {
  job: JobDetail;
}

export const JobContent: React.FC<JobContentProps> = ({ job }) => {
  const [activeTab, setActiveTab] = useState<'transcription' | 'summary' | 'keyMoments'>('transcription');
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      logger.error('Failed to copy text: ', err);
    }
  };

  const downloadText = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'transcription', name: 'Transcription', icon: DocumentTextIcon },
    { id: 'summary', name: 'Summary', icon: SparklesIcon },
    { id: 'keyMoments', name: 'Key Moments', icon: ClockIcon }
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'transcription' | 'summary' | 'keyMoments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'transcription' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Transcription</h3>
              {job.transcriptionText && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(job.transcriptionText!)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => downloadText(job.transcriptionText!, 'transcription.txt')}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              )}
            </div>
            
            {job.transcriptionText ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {job.transcriptionText}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-4" />
                <p>No transcription available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Summary</h3>
              {job.summary && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(job.summary!)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => downloadText(job.summary!, 'summary.txt')}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              )}
            </div>
            
            {job.summary ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {job.summary}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SparklesIcon className="h-12 w-12 mx-auto mb-4" />
                <p>No summary available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'keyMoments' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Key Moments</h3>
              {job.keyMoments && job.keyMoments.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(
                      job.keyMoments!.map(moment => 
                        `[${formatTimestamp(moment.timestamp)}] ${moment.title}\n${moment.description}`
                      ).join('\n\n')
                    )}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                    {copySuccess ? 'Copied!' : 'Copy All'}
                  </button>
                  <button
                    onClick={() => downloadText(
                      job.keyMoments!.map(moment => 
                        `[${formatTimestamp(moment.timestamp)}] ${moment.title}\n${moment.description}`
                      ).join('\n\n'), 
                      'key-moments.txt'
                    )}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              )}
            </div>
            
            {job.keyMoments && job.keyMoments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {job.keyMoments.map((moment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          {formatTimestamp(moment.timestamp)}
                        </span>
                        {moment.confidence && (
                          <span className="text-xs text-gray-500">
                            {Math.round(moment.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {moment.title}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {moment.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-4" />
                <p>No key moments identified</p>
                <p className="text-xs mt-1">Key moments are automatically extracted from longer audio files</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};