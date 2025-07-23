import React, { useState } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

interface TranscriptDisplayProps {
  transcript: string
  duration?: number
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcript, duration }) => {
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [displayMode, setDisplayMode] = useState<'paragraphs' | 'sentences' | 'raw'>('paragraphs')

  // Handle null/undefined transcript
  if (!transcript) {
    return (
      <div className="p-4 text-center text-gray-500">
        No transcript available
      </div>
    )
  }

  // Parse transcript for timestamps (format: [00:00:00] or similar)
  const parseTranscript = (text: string) => {
    const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g
    const segments: { timestamp?: string; text: string }[] = []
    let lastIndex = 0
    let match

    while ((match = timestampRegex.exec(text)) !== null) {
      if (lastIndex < match.index) {
        const prevText = text.substring(lastIndex, match.index).trim()
        if (prevText && segments.length > 0) {
          segments[segments.length - 1].text += ' ' + prevText
        }
      }
      segments.push({
        timestamp: match[1],
        text: ''
      })
      lastIndex = match.index + match[0].length
    }

    // Get any remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex).trim()
      if (segments.length > 0) {
        segments[segments.length - 1].text += ' ' + remainingText
      } else {
        segments.push({ text: remainingText })
      }
    }

    return segments.length > 0 ? segments : [{ text }]
  }

  const formatTranscript = () => {
    const segments = parseTranscript(transcript)
    
    switch (displayMode) {
      case 'paragraphs':
        // Group into paragraphs based on pauses or every 3-4 segments
        const paragraphs: typeof segments[] = []
        let currentParagraph: typeof segments = []
        
        segments.forEach((segment, index) => {
          currentParagraph.push(segment)
          if ((index + 1) % 4 === 0 || index === segments.length - 1) {
            paragraphs.push([...currentParagraph])
            currentParagraph = []
          }
        })
        
        return paragraphs.map((para, pIndex) => (
          <div key={pIndex} className="mb-4">
            {para.map((segment, sIndex) => (
              <span key={`${pIndex}-${sIndex}`}>
                {showTimestamps && segment.timestamp && (
                  <span className="text-xs text-blue-600 font-mono mr-2">
                    [{segment.timestamp}]
                  </span>
                )}
                <span>{segment.text}</span>
                {sIndex < para.length - 1 && ' '}
              </span>
            ))}
          </div>
        ))

      case 'sentences':
        // Split by sentences
        return segments.map((segment, index) => {
          const sentences = segment.text.match(/[^.!?]+[.!?]+/g) || [segment.text]
          return (
            <div key={index} className="mb-2">
              {showTimestamps && segment.timestamp && (
                <span className="text-xs text-blue-600 font-mono mr-2">
                  [{segment.timestamp}]
                </span>
              )}
              {sentences.map((sentence, sIndex) => (
                <span key={`${index}-${sIndex}`}>{sentence.trim()} </span>
              ))}
            </div>
          )
        })

      case 'raw':
        // Show raw text with optional timestamps
        return (
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {showTimestamps ? transcript : transcript.replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, '')}
          </pre>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center space-x-4">
          {/* Display Mode */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Format:</span>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="raw">Raw</option>
            </select>
          </div>

          {/* Timestamp Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showTimestamps}
              onChange={(e) => setShowTimestamps(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Show timestamps</span>
          </label>
        </div>

        {duration && (
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
          </div>
        )}
      </div>

      {/* Transcript Content */}
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
        {formatTranscript()}
      </div>
    </div>
  )
}

export default TranscriptDisplay