import React, { useState } from 'react'
import { 
  StarIcon,
  ChevronDownIcon, 
  ChevronUpIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { KeyMoment } from '../../types'
import { sanitizeHtml } from '../../utils/sanitize'

interface KeyMomentsTimelineProps {
  keyMoments: KeyMoment[]
}

const getImportanceColor = (importance: string) => {
  switch (importance) {
    case 'high': return 'from-red-500 to-red-600'
    case 'medium': return 'from-yellow-500 to-yellow-600'
    case 'low': return 'from-green-500 to-green-600'
    default: return 'from-gray-500 to-gray-600'
  }
}

const getImportanceIcon = (importance: string) => {
  switch (importance) {
    case 'high': return '!'
    case 'medium': return '→'
    case 'low': return '✓'
    default: return '•'
  }
}

const KeyMomentsTimeline: React.FC<KeyMomentsTimelineProps> = ({ keyMoments }) => {
  const [expandedMoment, setExpandedMoment] = useState<number | null>(null)

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <StarIcon className="h-7 w-7 mr-3 text-purple-600" />
        Key Moments Timeline
      </h2>
      <div className="space-y-4">
        {keyMoments.map((moment, index) => (
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
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(moment.title) }}
                  />
                  {expandedMoment === index && (
                    <div 
                      className="text-gray-700 mt-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(moment.description) }}
                    />
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className={`transform transition-transform duration-300 ${
                    expandedMoment === index ? 'rotate-180' : ''
                  }`}>
                    {expandedMoment === index ? (
                      <ChevronUpIcon className="h-6 w-6 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KeyMomentsTimeline