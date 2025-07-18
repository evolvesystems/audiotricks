import React, { useState } from 'react'
import { 
  ClockIcon, 
  DocumentTextIcon, 
  StarIcon,
  ArrowDownTrayIcon,
  MicrophoneIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { AudioProcessingResponse } from '../types'
import PodcastsTab from './PodcastsTab'
import TranscriptDisplay from './TranscriptDisplay'
import CostEstimate from './CostEstimate'
import AudioPlayer from './AudioPlayer'

interface ResultsDisplayProps {
  results: AudioProcessingResponse
  onExport: (format: 'txt' | 'json') => void
  showCostEstimates?: boolean
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onExport, showCostEstimates = true }) => {
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'podcasts'>('summary')

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Results Header Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Processing Complete</h2>
            <div className="flex items-center space-x-4 text-sm text-blue-100">
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>{formatDuration(results.summary.total_duration)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <DocumentTextIcon className="h-4 w-4" />
                <span>{results.summary.word_count} words</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cost Estimate */}
        {showCostEstimates && results.summary.total_duration && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
            <CostEstimate 
              duration={results.summary.total_duration}
              showDetailed={true}
            />
          </div>
        )}
      </div>

      {/* Audio Player */}
      {(results.audioUrl || results.audioFile) && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <AudioPlayer 
            audioUrl={results.audioUrl}
            audioFile={results.audioFile}
            title="Original Audio"
          />
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 px-6 pt-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'summary'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Summary & Key Moments
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'transcript'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Full Transcript
          </button>
          <button
            onClick={() => setActiveTab('podcasts')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg inline-flex items-center space-x-1 ${
              activeTab === 'podcasts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MicrophoneIcon className="h-4 w-4" />
            <span>Podcasts</span>
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
        {activeTab === 'summary' ? (
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
                Summary
              </h3>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {results.summary.summary}
                </p>
              </div>
            </div>

            {/* Key Moments */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Key Moments ({results.summary.key_moments.length})
              </h3>
              <div className="space-y-3">
                {results.summary.key_moments.map((moment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {moment.timestamp}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImportanceColor(moment.importance)}`}>
                            {moment.importance}
                          </span>
                        </div>
                        <h4 
                          className="font-medium text-gray-900 mb-1"
                          dangerouslySetInnerHTML={{ __html: moment.title }}
                        />
                        <div 
                          className="text-sm text-gray-600 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: moment.description }}
                        />
                      </div>
                      <StarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'transcript' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Full Transcript</h3>
            <TranscriptDisplay 
              transcript={results.transcript.text}
              duration={results.transcript.duration}
            />
          </div>
        ) : (
          <PodcastsTab results={results} />
        )}
        </div>
      </div>

      {/* Export Actions Card */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">
              Processing completed in {results.processing_time}s
            </div>
            {showCostEstimates && results.summary.total_duration && (
              <div className="text-xs text-gray-500">
                Estimated API cost based on {formatDuration(results.summary.total_duration)} of audio
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onExport('txt')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Export TXT
            </button>
            <button
              onClick={() => onExport('json')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Export JSON
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsDisplay