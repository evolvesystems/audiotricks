import React, { useState, useEffect } from 'react'
import { AudioProcessingResponse } from '../types'
import RichTextEditor from './RichTextEditor'

interface PodcastsTabProps {
  results: AudioProcessingResponse
}

const PodcastsTab2: React.FC<PodcastsTabProps> = ({ results }) => {
  const [showTimestamps, setShowTimestamps] = useState(true)
  
  // Handle missing results or summary
  if (!results || !results.summary) {
    return (
      <div className="p-4 text-center text-gray-500">
        No summary data available
      </div>
    )
  }
  
  // Function to generate HTML content
  const generateHtmlContent = (includeTimestamps: boolean) => {
    let html = ''
    
    // Handle missing summary text
    if (!results.summary.summary) {
      return '<p class="text-gray-500">No summary available</p>'
    }
    
    // Extract summary and takeaways
    const summaryParts = results.summary.summary.split('Takeaways:')
    const mainSummary = summaryParts[0].trim()
    const takeawaysText = summaryParts[1] || ''
    
    // Add Summary Section
    html += '<h2 class="text-xl font-bold text-gray-900 mb-4">Summary</h2>\n'
    const summaryParagraphs = mainSummary.split('\n\n').filter(p => p.trim())
    summaryParagraphs.forEach(paragraph => {
      html += `<p class="mb-4 text-gray-700">${paragraph.trim()}</p>\n`
    })
    
    // Add Takeaways Section if present
    if (takeawaysText) {
      html += '\n<h2 class="text-xl font-bold text-gray-900 mt-6 mb-4">Key Takeaways</h2>\n'
      html += '<ul class="list-disc ml-6 space-y-2">\n'
      
      const takeaways = takeawaysText
        .split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.trim().substring(1).trim())
      
      takeaways.forEach(takeaway => {
        html += `  <li class="text-gray-700">${takeaway}</li>\n`
      })
      
      html += '</ul>\n'
    }
    
    // Add Key Moments Section
    html += '\n<h2 class="text-xl font-bold text-gray-900 mt-6 mb-4">Key Moments</h2>\n'
    
    // Check if key_moments exists and is an array
    if (results.summary.key_moments && Array.isArray(results.summary.key_moments)) {
      results.summary.key_moments.forEach((moment, index) => {
      const title = moment.title.replace(/\*\*/g, '') // Remove any markdown formatting
      const description = moment.description.replace(/\*\*/g, '')
      
      if (includeTimestamps) {
        html += `<h3 class="font-semibold text-gray-900 mt-4 mb-2"><strong>${title}</strong> [${moment.timestamp}]</h3>\n`
      } else {
        html += `<h3 class="font-semibold text-gray-900 mt-4 mb-2"><strong>${title}</strong></h3>\n`
      }
      
      html += `<p class="text-gray-700 mb-4">${description}</p>\n`
      
        if (index < results.summary.key_moments.length - 1) {
          html += '\n'
        }
      })
    } else {
      html += '<p class="text-gray-500">No key moments available</p>\n'
    }
    
    return html
  }
  
  const [content, setContent] = useState(generateHtmlContent(showTimestamps))
  
  // Update content when timestamp toggle changes
  useEffect(() => {
    setContent(generateHtmlContent(showTimestamps))
  }, [showTimestamps])
  
  // Handle export
  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'podcast-content.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Combined Content Editor */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Complete Podcast Content</h3>
          <div className="flex items-center space-x-4">
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
        </div>
        
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Edit your podcast content..."
          height="h-96"
        />
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export Formatted Content
          </button>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Tips for Editing</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• The content is displayed in HTML format by default for better formatting control</li>
          <li>• Use the preview mode to see how your content will look when published</li>
          <li>• Toggle timestamps on/off to include or exclude them from key moments</li>
          <li>• Click "Convert to MD" to switch to Markdown format if needed</li>
          <li>• All sections (Summary, Takeaways, and Key Moments) are included in one editor</li>
        </ul>
      </div>
    </div>
  )
}

export default PodcastsTab2