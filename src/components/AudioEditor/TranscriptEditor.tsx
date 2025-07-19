import React, { useRef, useEffect } from 'react'
import { WordTimestamp } from './useWordSelection'

interface TranscriptEditorProps {
  words: WordTimestamp[]
  currentTime: number
  selectedWords: Set<number>
  onWordClick: (wordIndex: number, isCtrlClick: boolean, isShiftClick: boolean, event: React.MouseEvent) => void
  onWordMouseDown: (wordIndex: number, event: React.MouseEvent) => void
  onWordMouseEnter: (wordIndex: number) => void
  formatTime: (seconds: number) => string
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  words,
  currentTime,
  selectedWords,
  onWordClick,
  onWordMouseDown,
  onWordMouseEnter,
  formatTime
}) => {
  const editorRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current word
  useEffect(() => {
    const currentWordIndex = words.findIndex(
      word => !word.deleted && currentTime >= word.start && currentTime <= word.end
    )
    
    if (currentWordIndex !== -1 && editorRef.current) {
      const wordElement = editorRef.current.querySelector(`[data-word-index="${currentWordIndex}"]`)
      if (wordElement) {
        wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentTime, words])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Interactive Transcript</h4>
        <p className="text-sm text-gray-600">
          Click words to seek to that position. Multiple selection methods:
          <br />• <strong>Drag</strong>: Click and drag to select a range of words
          <br />• <strong>Shift+Click</strong>: Select from last selected word to clicked word
          <br />• <strong>Ctrl+Click</strong>: Add/remove individual words to selection
        </p>
      </div>

      <div 
        ref={editorRef}
        className="prose prose-lg max-w-none leading-relaxed"
        style={{ maxHeight: '400px', overflowY: 'auto' }}
      >
        {words.map((word, index) => {
          const isCurrentWord = currentTime >= word.start && currentTime <= word.end
          const isSelected = selectedWords.has(index)
          const isDeleted = word.deleted
          
          return (
            <span
              key={index}
              data-word-index={index}
              className={`
                inline-block px-1 py-0.5 mx-0.5 rounded cursor-pointer transition-all duration-200
                ${isDeleted 
                  ? 'bg-red-200 text-red-800 line-through opacity-50' 
                  : isCurrentWord 
                    ? 'bg-blue-200 text-blue-900 font-semibold' 
                    : isSelected 
                      ? 'bg-yellow-200 text-yellow-900' 
                      : 'hover:bg-gray-100'
                }
              `}
              onClick={(e) => onWordClick(index, e.ctrlKey || e.metaKey, e.shiftKey, e)}
              onMouseDown={(e) => onWordMouseDown(index, e)}
              onMouseEnter={() => onWordMouseEnter(index)}
              title={`${formatTime(word.start)} - ${formatTime(word.end)}`}
            >
              {word.word}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default TranscriptEditor