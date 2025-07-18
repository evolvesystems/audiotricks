import React, { useState } from 'react'
import { 
  ClockIcon, 
  DocumentTextIcon, 
  StarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { AudioProcessingResponse } from '../types'

interface ResultsDisplayProps {
  results: AudioProcessingResponse
  onExport: (format: 'txt' | 'json') => void
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onExport }) => {
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('summary')

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
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Processing Results</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>Duration: {formatDuration(results.summary.total_duration)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span>{results.summary.word_count} words</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex space-x-1 border-b border-gray-200">
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
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'summary' ? (
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4">
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
                        <h4 className="font-medium text-gray-900 mb-1">{moment.title}</h4>
                        <p className="text-sm text-gray-600">{moment.description}</p>
                      </div>
                      <StarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Full Transcript</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {results.transcript.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Processing completed in {results.processing_time}s
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
  )
}

export default ResultsDisplay