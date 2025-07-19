import React from 'react'
import { 
  SparklesIcon,
  LightBulbIcon,
  ChartBarIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { SummaryResponse } from '../../types'

interface SummarySectionProps {
  summary: SummaryResponse | undefined
}

const SummarySection: React.FC<SummarySectionProps> = ({ summary }) => {
  if (!summary) return null

  const formatSummaryText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    return lines.map((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('#')) {
        const level = trimmed.match(/^#+/)?.[0].length || 1
        const text = trimmed.replace(/^#+\s*/, '')
        const Tag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements
        return <Tag key={idx} className={`font-bold text-gray-900 ${level === 1 ? 'text-lg' : 'text-base'} mb-2`}>{text}</Tag>
      }
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return <li key={idx} className="ml-4 text-gray-700">{trimmed.substring(1).trim()}</li>
      }
      if (trimmed.startsWith('>')) {
        return <blockquote key={idx} className="border-l-4 border-gray-300 pl-4 italic text-gray-600">{trimmed.substring(1).trim()}</blockquote>
      }
      return <p key={idx} className="text-gray-700 mb-3">{trimmed}</p>
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <SparklesIcon className="h-7 w-7 mr-3 text-blue-600" />
        Summary
      </h2>
      
      {/* Main Summary */}
      {summary.summary && (
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpenIcon className="h-5 w-5 mr-2 text-blue-600" />
            Summary
          </h3>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            {formatSummaryText(summary.summary)}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {summary.takeaways && summary.takeaways.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-green-600" />
            Key Takeaways
          </h3>
          <ul className="space-y-3">
            {summary.takeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 leading-relaxed">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SummarySection