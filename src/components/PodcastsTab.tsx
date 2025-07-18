import React, { useState, useEffect } from 'react'
import { AudioProcessingResponse } from '../types'
import RichTextEditor from './RichTextEditor'

interface PodcastsTabProps {
  results: AudioProcessingResponse
}

const PodcastsTab: React.FC<PodcastsTabProps> = ({ results }) => {
  const [summaryContent, setSummaryContent] = useState(results.summary.summary)
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [keyMomentsContent, setKeyMomentsContent] = useState(
    results.summary.key_moments
      .map(moment => showTimestamps 
        ? `**${moment.timestamp}** - ${moment.title}\n${moment.description}`
        : `**${moment.title}**\n${moment.description}`)
      .join('\n\n')
  )

  // Update key moments when timestamp toggle changes
  useEffect(() => {
    setKeyMomentsContent(
      results.summary.key_moments
        .map(moment => {
          if (showTimestamps) {
            return `**${moment.title}** [${moment.timestamp}]\n${moment.description}`
          } else {
            return `**${moment.title}**\n${moment.description}`
          }
        })
        .join('\n\n')
    )
  }, [showTimestamps, results.summary.key_moments])


  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Podcast Summary</h3>
        
        <RichTextEditor
          content={summaryContent}
          onChange={setSummaryContent}
          placeholder="Edit your podcast summary..."
          height="h-48"
        />
      </div>

      {/* Key Moments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Key Moments</h3>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showTimestamps}
              onChange={(e) => setShowTimestamps(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-gray-700">Show timestamps</span>
          </label>
        </div>
        
        <RichTextEditor
          content={keyMomentsContent}
          onChange={setKeyMomentsContent}
          placeholder="Edit your key moments..."
          height="h-96"
        />
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const exportData = {
              summary: summaryContent,
              keyMoments: keyMomentsContent
            }
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'podcast-content.json'
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Export Formatted Content
        </button>
      </div>
    </div>
  )
}

export default PodcastsTab