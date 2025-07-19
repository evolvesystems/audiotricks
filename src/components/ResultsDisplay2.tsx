import React, { useState } from 'react'
import { AudioProcessingResponse } from '../types'
import ResultsOverview from './ResultsDisplay/ResultsOverview'
import ResultsTabNav from './ResultsDisplay/ResultsTabNav'
import { useReprocessing } from './ResultsDisplay/useReprocessing'
import PodcastsTab from './PodcastsTab'
import TranscriptDisplay from './TranscriptDisplay'
import AudioEditor from './AudioEditor'
import ReprocessModal from './ReprocessModal'

interface ResultsDisplayProps {
  results: AudioProcessingResponse
  onExport: (format: 'txt' | 'json') => void
  showCostEstimates?: boolean
  onReprocess?: (newResults: AudioProcessingResponse) => void
  elevenLabsKey: string
  currentSettings?: any // Pass current user settings
}

const ResultsDisplay2: React.FC<ResultsDisplayProps> = ({ 
  results, 
  onExport, 
  showCostEstimates = true, 
  onReprocess, 
  elevenLabsKey, 
  currentSettings 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'podcasts' | 'editor'>('overview')
  
  const {
    showReprocessModal,
    setShowReprocessModal,
    isReprocessing,
    handleReprocess
  } = useReprocessing({ results, onReprocess })

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ResultsOverview
            results={results}
            showCostEstimates={showCostEstimates}
            onExport={onExport}
          />
        )
      case 'transcript':
        return (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <TranscriptDisplay 
              transcript={results.transcript.text} 
              duration={results.transcript.duration} 
            />
          </div>
        )
      case 'podcasts':
        return (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <PodcastsTab results={results} />
          </div>
        )
      case 'editor':
        return (
          <AudioEditor
            results={results}
            elevenLabsKey={elevenLabsKey}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <ResultsTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isReprocessing={isReprocessing}
        onReprocessClick={() => setShowReprocessModal(true)}
      />
      
      <div className="min-h-[400px]">
        {renderActiveTab()}
      </div>

      {/* Reprocess Modal */}
      {showReprocessModal && (
        <ReprocessModal
          isOpen={showReprocessModal}
          onClose={() => setShowReprocessModal(false)}
          onReprocess={handleReprocess}
          isProcessing={isReprocessing}
          currentSettings={{
            summaryStyle: currentSettings?.summaryStyle || 'formal',
            language: currentSettings?.outputLanguage || 'en',
            gptSettings: {
              temperature: currentSettings?.temperature || 0.3,
              maxTokens: currentSettings?.maxTokens || 2000
            }
          }}
        />
      )}
    </div>
  )
}

export default ResultsDisplay2