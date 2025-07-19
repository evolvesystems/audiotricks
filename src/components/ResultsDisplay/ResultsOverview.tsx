import React from 'react'
import { 
  ClockIcon, 
  DocumentTextIcon, 
  StarIcon
} from '@heroicons/react/24/outline'
import { AudioProcessingResponse } from '../../types'
import AudioPlayer from '../AudioPlayer'
import CostEstimate from '../CostEstimate'
import SummarySection from './SummarySection'
import KeyMomentsTimeline from './KeyMomentsTimeline'

interface ResultsOverviewProps {
  results: AudioProcessingResponse
  showCostEstimates?: boolean
}

const ResultsOverview: React.FC<ResultsOverviewProps> = ({ results, showCostEstimates = true }) => {
  return (
    <div className="space-y-8">
      {/* Audio Player and Metadata */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <AudioPlayer
            audioUrl={results.audioUrl || ''}
            title={results.title || 'Audio Playback'}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Duration</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {results.duration ? `${Math.floor(results.duration / 60)}:${String(Math.floor(results.duration % 60)).padStart(2, '0')}` : '--:--'}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Words</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {results.wordCount?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <StarIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Language</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {results.language?.toUpperCase() || 'EN'}
            </p>
          </div>
          
          {showCostEstimates && (
            <div className="bg-gray-50 rounded-lg p-4">
              <CostEstimate 
                duration={results.duration || 0} 
                wordCount={results.wordCount || 0}
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <SummarySection summary={results.summary} />

      {/* Key Moments Timeline */}
      {results.summary?.key_moments && results.summary.key_moments.length > 0 && (
        <KeyMomentsTimeline keyMoments={results.summary.key_moments} />
      )}
    </div>
  )
}

export default ResultsOverview