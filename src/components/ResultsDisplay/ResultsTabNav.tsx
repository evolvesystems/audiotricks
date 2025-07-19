import React from 'react'
import { 
  DocumentTextIcon, 
  MicrophoneIcon,
  SparklesIcon,
  ScissorsIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface ResultsTabNavProps {
  activeTab: 'overview' | 'transcript' | 'podcasts' | 'editor'
  onTabChange: (tab: 'overview' | 'transcript' | 'podcasts' | 'editor') => void
  isReprocessing: boolean
  onReprocessClick: () => void
}

const ResultsTabNav: React.FC<ResultsTabNavProps> = ({ 
  activeTab, 
  onTabChange, 
  isReprocessing, 
  onReprocessClick 
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: SparklesIcon },
    { id: 'transcript', label: 'Transcript', icon: DocumentTextIcon },
    { id: 'podcasts', label: 'Edit & Export', icon: MicrophoneIcon },
    { id: 'editor', label: 'Audio Editor', icon: ScissorsIcon }
  ] as const

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <nav className="flex -mb-px space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative min-w-0 overflow-hidden py-2 px-1 text-sm font-medium text-center hover:text-gray-700 focus:z-10 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </nav>
          
          <button
            onClick={onReprocessClick}
            disabled={isReprocessing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>{isReprocessing ? 'Reprocessing...' : 'Reprocess'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultsTabNav