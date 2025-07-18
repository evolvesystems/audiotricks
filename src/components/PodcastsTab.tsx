import React, { useState, useEffect } from 'react'
import { AudioProcessingResponse } from '../types'
import RichTextEditor from './RichTextEditor'

interface PodcastsTabProps {
  results: AudioProcessingResponse
}

const PodcastsTab: React.FC<PodcastsTabProps> = ({ results }) => {
  // Extract summary and takeaways
  // Try multiple takeaway delimiters
  let summaryParts = results.summary.summary.split('Takeaways:')
  if (summaryParts.length === 1) {
    summaryParts = results.summary.summary.split('Key Takeaways:')
  }
  if (summaryParts.length === 1) {
    summaryParts = results.summary.summary.split('TAKEAWAYS:')
  }
  
  const mainSummary = summaryParts[0].trim()
  const takeawaysText = summaryParts[1] || ''
  
  // Convert to HTML format by default
  const convertToHtml = (text: string) => {
    const paragraphs = text.split('\n\n').filter(p => p.trim())
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n')
  }
  
  const takeawaysHtml = () => {
    if (!takeawaysText) return ''
    
    // Try multiple bullet point formats
    const takeaways = takeawaysText
      .split('\n')
      .filter(line => {
        const trimmed = line.trim()
        return trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)
      })
      .map(line => {
        const trimmed = line.trim()
        // Remove bullet points and numbers
        return trimmed.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
      })
      .filter(takeaway => takeaway.length > 0)
    
    if (takeaways.length === 0) {
      // If no bullet points found, treat the whole takeaways section as paragraphs
      const paragraphs = takeawaysText.split('\n\n').filter(p => p.trim())
      if (paragraphs.length > 0) {
        return '<h3>Key Takeaways</h3>\n' + 
          paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n')
      }
      return ''
    }
    
    return '<h3>Key Takeaways</h3>\n<ul>\n' + 
      takeaways.map(t => `  <li>${t}</li>`).join('\n') + 
      '\n</ul>'
  }
  
  const [summaryContent, setSummaryContent] = useState(
    convertToHtml(mainSummary) + (takeawaysText ? '\n\n' + takeawaysHtml() : '')
  )
  const [showTimestamps, setShowTimestamps] = useState(true)
  
  // Helper function to convert HTML to markdown-like format for editing
  const htmlToEditableFormat = (html: string): string => {
    return html
      .replace(/<strong>/g, '**')
      .replace(/<\/strong>/g, '**')
      .replace(/<em>/g, '*')
      .replace(/<\/em>/g, '*')
      .replace(/<code>/g, '`')
      .replace(/<\/code>/g, '`')
      .replace(/<[^>]+>/g, '') // Remove any other HTML tags
  }
  
  // Convert key moments to HTML format
  const keyMomentsToHtml = (includeTimestamps: boolean) => {
    return results.summary.key_moments
      .map(moment => {
        const titleText = moment.title.replace(/\*\*/g, '')
        const descText = moment.description.replace(/\*\*/g, '')
        
        if (includeTimestamps) {
          return `<h3>${titleText} [${moment.timestamp}]</h3>\n<p>${descText}</p>`
        } else {
          return `<h3>${titleText}</h3>\n<p>${descText}</p>`
        }
      })
      .join('\n\n')
  }
  
  const [keyMomentsContent, setKeyMomentsContent] = useState(keyMomentsToHtml(showTimestamps))

  // Update key moments when timestamp toggle changes
  useEffect(() => {
    setKeyMomentsContent(keyMomentsToHtml(showTimestamps))
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
          defaultViewMode="preview"
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
          defaultViewMode="preview"
        />
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Podcast Content</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    h3 { margin-top: 1.5em; }
    p { margin-bottom: 1em; }
    ul { margin-bottom: 1em; }
    li { margin-bottom: 0.5em; }
  </style>
</head>
<body>
  <h1>Podcast Summary</h1>
  ${summaryContent}
  
  <h2>Key Moments</h2>
  ${keyMomentsContent}
</body>
</html>`
            const blob = new Blob([htmlContent], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'podcast-content.html'
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Export as HTML
        </button>
      </div>
    </div>
  )
}

export default PodcastsTab