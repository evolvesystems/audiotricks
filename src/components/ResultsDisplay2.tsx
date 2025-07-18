import React, { useState } from 'react'
import { 
  ClockIcon, 
  DocumentTextIcon, 
  StarIcon,
  ArrowDownTrayIcon,
  MicrophoneIcon,
  SparklesIcon,
  LightBulbIcon,
  ChartBarIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  BookOpenIcon,
  ScissorsIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { AudioProcessingResponse } from '../types'
import { generateSummary } from '../utils/openai'
import { SummaryStyle } from './SummaryStyleSelector'
import { GPTSettings } from '../utils/openai'
import PodcastsTab from './PodcastsTab'
import TranscriptDisplay from './TranscriptDisplay'
import CostEstimate from './CostEstimate'
import AudioPlayer from './AudioPlayer'
import AudioEditor from './AudioEditor'
import ReprocessModal from './ReprocessModal'

interface ResultsDisplayProps {
  results: AudioProcessingResponse
  onExport: (format: 'txt' | 'json') => void
  showCostEstimates?: boolean
  onReprocess?: (newResults: AudioProcessingResponse) => void
}

const ResultsDisplay2: React.FC<ResultsDisplayProps> = ({ results, onExport, showCostEstimates = true, onReprocess }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'podcasts' | 'editor'>('overview')
  const [expandedMoment, setExpandedMoment] = useState<number | null>(null)
  const [showReprocessModal, setShowReprocessModal] = useState(false)
  const [isReprocessing, setIsReprocessing] = useState(false)

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high': return '🔥'
      case 'medium': return '⭐'
      case 'low': return '💡'
      default: return '•'
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'from-red-500 to-orange-500'
      case 'medium': return 'from-yellow-500 to-amber-500'
      case 'low': return 'from-green-500 to-emerald-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Extract takeaways from summary
  const extractTakeaways = (summary: string): string[] => {
    const takeawaySection = summary.split('Takeaways:')[1]
    
    if (!takeawaySection) {
      // Try alternative formats
      const altSection = summary.split('Key Takeaways:')[1] || summary.split('TAKEAWAYS:')[1]
      if (!altSection) return []
      
      return altSection
        .split('\n')
        .filter(line => {
          const trimmed = line.trim()
          return trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)
        })
        .map(line => {
          const trimmed = line.trim()
          return trimmed.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
        })
        .filter(takeaway => takeaway.length > 0)
    }
    
    return takeawaySection
      .split('\n')
      .filter(line => {
        const trimmed = line.trim()
        return trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)
      })
      .map(line => {
        const trimmed = line.trim()
        return trimmed.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
      })
      .filter(takeaway => takeaway.length > 0)
  }

  // Extract main summary (before takeaways)
  let summaryParts = results.summary.summary.split('Takeaways:')
  if (summaryParts.length === 1) {
    summaryParts = results.summary.summary.split('Key Takeaways:')
  }
  if (summaryParts.length === 1) {
    summaryParts = results.summary.summary.split('TAKEAWAYS:')
  }
  
  const summaryText = summaryParts[0].trim()
  const takeaways = extractTakeaways(results.summary.summary)

  const handleReprocess = async (summaryStyle: SummaryStyle, language: string, gptSettings: GPTSettings) => {
    if (!onReprocess) return
    
    setIsReprocessing(true)
    setShowReprocessModal(false)
    
    try {
      const apiKey = localStorage.getItem('openai_api_key') || ''
      if (!apiKey) {
        throw new Error('API key not found')
      }
      
      // Generate new summary using existing transcript
      const newSummary = await generateSummary(
        results.transcript, 
        apiKey, 
        summaryStyle, 
        language, 
        gptSettings
      )
      
      // Create new results with updated summary
      const newResults: AudioProcessingResponse = {
        ...results,
        summary: newSummary,
        processing_time: results.processing_time // Keep original processing time
      }
      
      onReprocess(newResults)
    } catch (error) {
      console.error('Reprocess error:', error)
      alert('Failed to reprocess audio. Please try again.')
    } finally {
      setIsReprocessing(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Hero Stats Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-3xl font-bold">{formatDuration(results.summary.total_duration)}</div>
            <div className="text-sm opacity-80">Duration</div>
            {showCostEstimates && results.summary.total_duration && (
              <div className="text-xs opacity-70 mt-1">
                ${((results.summary.total_duration / 60) * 0.006 + ((results.summary.total_duration / 60) * 200 / 1000) * 0.01).toFixed(3)} cost
              </div>
            )}
          </div>
          <div className="text-center">
            <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-3xl font-bold">{results.summary.word_count.toLocaleString()}</div>
            <div className="text-sm opacity-80">Words</div>
          </div>
          <div className="text-center">
            <StarIcon className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-3xl font-bold">{results.summary.key_moments.length}</div>
            <div className="text-sm opacity-80">Key Moments</div>
          </div>
          <div className="text-center">
            <LightBulbIcon className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-3xl font-bold">{takeaways.length}</div>
            <div className="text-sm opacity-80">Takeaways</div>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {(results.audioUrl || results.audioFile) && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3">
            <h3 className="text-white font-semibold flex items-center">
              <PlayCircleIcon className="h-5 w-5 mr-2" />
              Audio Playback
            </h3>
          </div>
          <div className="p-6">
            <AudioPlayer 
              audioUrl={results.audioUrl}
              audioFile={results.audioFile}
              title="Original Recording"
              transcript={results.transcript.text}
              showSubtitles={false}
            />
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-sm font-medium text-center hover:bg-gray-50 focus:z-10 ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 mr-1" />
                Overview
              </span>
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-sm font-medium text-center hover:bg-gray-50 focus:z-10 ${
                activeTab === 'transcript'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                Transcript
              </span>
            </button>
            <button
              onClick={() => setActiveTab('podcasts')}
              className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-sm font-medium text-center hover:bg-gray-50 focus:z-10 ${
                activeTab === 'podcasts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center">
                <MicrophoneIcon className="h-4 w-4 mr-1" />
                Edit & Export
              </span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-sm font-medium text-center hover:bg-gray-50 focus:z-10 ${
                activeTab === 'editor'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center">
                <ScissorsIcon className="h-4 w-4 mr-1" />
                Audio Editor
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' ? (
            <div className="space-y-8">
              {/* Summary Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <BookOpenIcon className="h-7 w-7 mr-3 text-blue-600" />
                  Executive Summary
                </h2>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
                  <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
                    <p dangerouslySetInnerHTML={{ __html: summaryText.replace(/\n\n/g, '</p><p>') }} />
                  </div>
                </div>
              </div>

              {/* Takeaways Section */}
              {takeaways.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <LightBulbIcon className="h-7 w-7 mr-3 text-yellow-600" />
                    Key Takeaways
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {takeaways.map((takeaway, index) => (
                      <div 
                        key={index} 
                        className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-5 border border-yellow-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start">
                          <CheckCircleIcon className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-800 leading-relaxed">{takeaway}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Moments Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <StarIcon className="h-7 w-7 mr-3 text-purple-600" />
                  Key Moments Timeline
                </h2>
                <div className="space-y-4">
                  {results.summary.key_moments.map((moment, index) => (
                    <div 
                      key={index} 
                      className={`relative bg-white rounded-xl border-2 transition-all duration-300 ${
                        expandedMoment === index 
                          ? 'border-purple-300 shadow-lg' 
                          : 'border-gray-200 hover:border-purple-200 hover:shadow-md'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedMoment(expandedMoment === index ? null : index)}
                        className="w-full text-left p-6"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${getImportanceColor(moment.importance)} text-white text-lg`}>
                                {getImportanceIcon(moment.importance)}
                              </span>
                              <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-full">
                                {moment.timestamp}
                              </span>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                moment.importance === 'high' 
                                  ? 'bg-red-100 text-red-700' 
                                  : moment.importance === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {moment.importance.toUpperCase()}
                              </span>
                            </div>
                            <h3 
                              className="text-lg font-semibold text-gray-900 mb-2"
                              dangerouslySetInnerHTML={{ __html: moment.title }}
                            />
                            {expandedMoment === index && (
                              <div 
                                className="mt-3 text-gray-700 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: moment.description }}
                              />
                            )}
                          </div>
                          <ChartBarIcon className={`h-5 w-5 text-gray-400 ml-4 transition-transform ${
                            expandedMoment === index ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'transcript' ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Full Transcript</h2>
              <div className="bg-gray-50 rounded-xl p-8">
                <TranscriptDisplay 
                  transcript={results.transcript.text}
                  duration={results.transcript.duration}
                />
              </div>
            </div>
          ) : activeTab === 'editor' ? (
            <AudioEditor results={results} />
          ) : (
            <PodcastsTab results={results} />
          )}
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
            <p className="text-sm text-gray-500 mt-1">
              Download your transcript and summary in your preferred format
            </p>
          </div>
          <div className="flex space-x-3">
            {onReprocess && (
              <button
                onClick={() => setShowReprocessModal(true)}
                disabled={isReprocessing}
                className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {isReprocessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Re-processing...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Re-process
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => onExport('txt')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2 text-gray-400" />
              Export as TXT
            </button>
            <button
              onClick={() => onExport('json')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2 text-gray-400" />
              Export as JSON
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 flex items-center">
          <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
          Processing completed in {results.processing_time}s
        </div>
      </div>

      {/* Reprocess Modal */}
      <ReprocessModal
        isOpen={showReprocessModal}
        onClose={() => setShowReprocessModal(false)}
        onReprocess={handleReprocess}
        isProcessing={isReprocessing}
        currentSettings={{
          summaryStyle: 'formal' as SummaryStyle,
          language: results.summary.language || 'en',
          gptSettings: {
            temperature: 0.3,
            maxTokens: 2000
          }
        }}
      />
    </div>
  )
}

export default ResultsDisplay2