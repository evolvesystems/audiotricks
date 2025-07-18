import React, { useState } from 'react'
import { AudioProcessingResponse } from '../types'

interface PodcastsTabProps {
  results: AudioProcessingResponse
}

const PodcastsTab: React.FC<PodcastsTabProps> = ({ results }) => {
  const [summaryContent, setSummaryContent] = useState(results.summary.summary)
  const [keyMoments, setKeyMoments] = useState(
    results.summary.key_moments.map(moment => ({
      ...moment,
      content: `${moment.title}\n${moment.description}`
    }))
  )

  const formatText = (text: string, format: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return text

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()
    if (!selectedText) return text

    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'heading':
        formattedText = `## ${selectedText}`
        break
      case 'bullet':
        formattedText = `• ${selectedText}`
        break
      default:
        return text
    }

    const before = text.substring(0, range.startOffset)
    const after = text.substring(range.endOffset)
    return before + formattedText + after
  }

  const handleFormat = (section: 'summary' | 'moment', format: string, momentIndex?: number) => {
    if (section === 'summary') {
      const textarea = document.getElementById('summary-textarea') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = summaryContent.substring(start, end)
        
        if (selectedText) {
          let formattedText = ''
          switch (format) {
            case 'bold':
              formattedText = `**${selectedText}**`
              break
            case 'italic':
              formattedText = `*${selectedText}*`
              break
            case 'heading':
              formattedText = `## ${selectedText}`
              break
            case 'bullet':
              formattedText = `• ${selectedText}`
              break
          }
          
          const newContent = summaryContent.substring(0, start) + formattedText + summaryContent.substring(end)
          setSummaryContent(newContent)
        }
      }
    } else if (section === 'moment' && momentIndex !== undefined) {
      const textarea = document.getElementById(`moment-textarea-${momentIndex}`) as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = keyMoments[momentIndex].content.substring(start, end)
        
        if (selectedText) {
          let formattedText = ''
          switch (format) {
            case 'bold':
              formattedText = `**${selectedText}**`
              break
            case 'italic':
              formattedText = `*${selectedText}*`
              break
            case 'heading':
              formattedText = `## ${selectedText}`
              break
            case 'bullet':
              formattedText = `• ${selectedText}`
              break
          }
          
          const newContent = keyMoments[momentIndex].content.substring(0, start) + formattedText + keyMoments[momentIndex].content.substring(end)
          const newMoments = [...keyMoments]
          newMoments[momentIndex] = { ...newMoments[momentIndex], content: newContent }
          setKeyMoments(newMoments)
        }
      }
    }
  }

  const FormatToolbar = ({ section, momentIndex }: { section: 'summary' | 'moment', momentIndex?: number }) => (
    <div className="flex space-x-2 mb-2">
      <button
        onClick={() => handleFormat(section, 'bold', momentIndex)}
        className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded font-bold"
        title="Bold"
      >
        B
      </button>
      <button
        onClick={() => handleFormat(section, 'italic', momentIndex)}
        className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded italic"
        title="Italic"
      >
        I
      </button>
      <button
        onClick={() => handleFormat(section, 'heading', momentIndex)}
        className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        title="Heading"
      >
        H
      </button>
      <button
        onClick={() => handleFormat(section, 'bullet', momentIndex)}
        className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        title="Bullet Point"
      >
        •
      </button>
    </div>
  )

  const renderMarkdown = (text: string) => {
    // Simple markdown renderer
    return text
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-lg font-semibold mt-2 mb-1">{line.substring(3)}</h3>
        }
        // Bold
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        line = line.replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Bullet points
        if (line.startsWith('• ')) {
          return <li key={i} className="ml-4">{line.substring(2)}</li>
        }
        
        return line ? <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} /> : <br key={i} />
      })
  }

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Podcast Summary</h3>
        
        <div className="space-y-4">
          <div>
            <FormatToolbar section="summary" />
            <textarea
              id="summary-textarea"
              value={summaryContent}
              onChange={(e) => setSummaryContent(e.target.value)}
              className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Edit your podcast summary..."
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
            <div className="p-4 bg-gray-50 rounded-md prose prose-sm max-w-none">
              {renderMarkdown(summaryContent)}
            </div>
          </div>
        </div>
      </div>

      {/* Key Moments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Moments</h3>
        
        <div className="space-y-6">
          {keyMoments.map((moment, index) => (
            <div key={index} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
              <div className="flex items-center mb-3">
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {moment.timestamp}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <FormatToolbar section="moment" momentIndex={index} />
                  <textarea
                    id={`moment-textarea-${index}`}
                    value={moment.content}
                    onChange={(e) => {
                      const newMoments = [...keyMoments]
                      newMoments[index] = { ...newMoments[index], content: e.target.value }
                      setKeyMoments(newMoments)
                    }}
                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Edit this key moment..."
                  />
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Preview:</h5>
                  <div className="p-4 bg-gray-50 rounded-md prose prose-sm max-w-none">
                    {renderMarkdown(moment.content)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const exportData = {
              summary: summaryContent,
              keyMoments: keyMoments.map(m => ({
                timestamp: m.timestamp,
                content: m.content
              }))
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