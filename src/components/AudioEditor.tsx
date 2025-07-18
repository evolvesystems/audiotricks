import React, { useState, useRef, useEffect } from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  ScissorsIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline'
import { AudioProcessingResponse } from '../types'

interface WordTimestamp {
  word: string
  start: number
  end: number
  selected?: boolean
  deleted?: boolean
}

interface AudioEditorProps {
  results: AudioProcessingResponse
}

const AudioEditor: React.FC<AudioEditorProps> = ({ results }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [words, setWords] = useState<WordTimestamp[]>([])
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set())
  const [audioSrc, setAudioSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Initialize audio source
  useEffect(() => {
    if (results.audioUrl) {
      setAudioSrc(results.audioUrl)
    } else if (results.audioFile) {
      const url = URL.createObjectURL(results.audioFile)
      setAudioSrc(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [results.audioUrl, results.audioFile])

  // Parse transcript into words with estimated timestamps
  useEffect(() => {
    if (!results.transcript.text) return

    const parseTranscriptToWords = () => {
      const text = results.transcript.text
      const totalDuration = results.summary.total_duration || 0
      
      // Split into words and estimate timestamps
      const wordsArray = text.split(/\s+/).filter(word => word.length > 0)
      const estimatedWords: WordTimestamp[] = []
      
      // Better estimation: account for word length and pauses
      const averageWordsPerSecond = 2.5 // More realistic speaking rate
      const estimatedDuration = Math.max(totalDuration, wordsArray.length / averageWordsPerSecond)
      
      wordsArray.forEach((word, index) => {
        // Estimate based on word length and position
        const wordLength = word.length
        const baseTimePerWord = estimatedDuration / wordsArray.length
        const adjustedTimePerWord = baseTimePerWord * (0.5 + (wordLength / 10)) // Longer words take more time
        
        const startTime = index * baseTimePerWord
        const endTime = startTime + adjustedTimePerWord
        
        estimatedWords.push({
          word: word, // Keep original with punctuation
          start: startTime,
          end: Math.min(endTime, estimatedDuration), // Don't exceed total duration
          selected: false,
          deleted: false
        })
      })
      
      setWords(estimatedWords)
      setIsLoading(false)
    }

    parseTranscriptToWords()
  }, [results.transcript.text, results.summary.total_duration])

  // Audio playback controls
  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (audio) {
      setCurrentTime(audio.currentTime)
      
      // Highlight current word (only non-deleted words)
      const currentWordIndex = words.findIndex(
        word => !word.deleted && audio.currentTime >= word.start && audio.currentTime <= word.end
      )
      
      if (currentWordIndex !== -1 && editorRef.current) {
        const wordElement = editorRef.current.querySelector(`[data-word-index="${currentWordIndex}"]`)
        if (wordElement) {
          wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
  }

  const seekToWord = (wordIndex: number) => {
    const audio = audioRef.current
    if (audio && words[wordIndex]) {
      audio.currentTime = words[wordIndex].start
      setCurrentTime(words[wordIndex].start)
    }
  }

  const handleWordClick = (wordIndex: number, isCtrlClick: boolean = false, isShiftClick: boolean = false, event: React.MouseEvent) => {
    // Don't process click if we just finished dragging
    if (isDragging) {
      return
    }
    
    if (isShiftClick && selectedWords.size > 0) {
      // Range selection - select from last selected to current
      const selectedArray = Array.from(selectedWords)
      const lastSelected = Math.max(...selectedArray)
      const start = Math.min(lastSelected, wordIndex)
      const end = Math.max(lastSelected, wordIndex)
      
      const newSelected = new Set(selectedWords)
      for (let i = start; i <= end; i++) {
        newSelected.add(i)
      }
      setSelectedWords(newSelected)
    } else if (isCtrlClick) {
      // Multi-select mode
      const newSelected = new Set(selectedWords)
      if (newSelected.has(wordIndex)) {
        newSelected.delete(wordIndex)
      } else {
        newSelected.add(wordIndex)
      }
      setSelectedWords(newSelected)
    } else {
      // Single select and seek
      setSelectedWords(new Set([wordIndex]))
      seekToWord(wordIndex)
    }
  }

  const handleWordMouseDown = (wordIndex: number, event: React.MouseEvent) => {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      return // Don't start drag for modifier keys
    }
    
    event.preventDefault() // Prevent text selection
    setIsDragging(true)
    setDragStartIndex(wordIndex)
    setSelectedWords(new Set([wordIndex]))
  }

  const handleWordMouseEnter = (wordIndex: number) => {
    if (isDragging && dragStartIndex !== null) {
      const start = Math.min(dragStartIndex, wordIndex)
      const end = Math.max(dragStartIndex, wordIndex)
      
      const newSelected = new Set<number>()
      for (let i = start; i <= end; i++) {
        newSelected.add(i)
      }
      setSelectedWords(newSelected)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStartIndex(null)
  }

  // Add mouse up listener to document
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const deleteSelectedWords = () => {
    if (selectedWords.size === 0) return
    
    const newWords = words.map((word, index) => ({
      ...word,
      deleted: selectedWords.has(index) ? true : word.deleted
    }))
    
    setWords(newWords)
    setSelectedWords(new Set())
  }

  const undoDelete = () => {
    const newWords = words.map(word => ({
      ...word,
      deleted: false
    }))
    setWords(newWords)
    setSelectedWords(new Set())
  }

  const selectAllWords = () => {
    const allWordIndexes = words
      .map((_, index) => index)
      .filter(index => !words[index].deleted)
    setSelectedWords(new Set(allWordIndexes))
  }

  const selectNoneWords = () => {
    setSelectedWords(new Set())
  }

  const exportEditedTranscript = () => {
    const editedText = words
      .filter(word => !word.deleted)
      .map(word => word.word)
      .join(' ')
    
    const blob = new Blob([editedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'edited-transcript.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading audio editor...</div>
      </div>
    )
  }

  // Check if we have audio source
  if (!audioSrc) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <ScissorsIcon className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Audio Editor Not Available</h3>
              <p className="text-yellow-700 mt-1">
                The audio editor requires the original audio file. This feature is only available for newly processed audio, not for items from history.
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                To use the audio editor, please upload and process a new audio file.
              </p>
            </div>
          </div>
        </div>
        
        {/* Still show the transcript as read-only */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Read-Only Transcript</h4>
          <div className="prose prose-lg max-w-none leading-relaxed bg-gray-50 p-4 rounded-lg">
            {results.transcript.text}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Audio Player Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Audio Editor</h3>
          <div className="text-sm text-gray-500">
            {formatTime(currentTime)} / {formatTime(results.summary.total_duration || 0)}
          </div>
        </div>

        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Audio Progress Bar */}
        <div className="mb-4">
          <div 
            className="relative h-2 bg-gray-300 rounded-full cursor-pointer overflow-hidden"
            onClick={(e) => {
              const audio = audioRef.current
              if (!audio) return
              
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const percentage = x / rect.width
              const newTime = percentage * (results.summary.total_duration || 0)
              
              audio.currentTime = newTime
              setCurrentTime(newTime)
            }}
          >
            <div 
              className="absolute h-full bg-blue-600 rounded-full transition-all duration-100"
              style={{ width: `${(results.summary.total_duration || 0) > 0 ? (currentTime / (results.summary.total_duration || 0)) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlayPause}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={deleteSelectedWords}
            disabled={selectedWords.size === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrashIcon className="h-5 w-5" />
            <span>Delete Selected ({selectedWords.size})</span>
          </button>

          <button
            onClick={undoDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <ArrowUturnLeftIcon className="h-5 w-5" />
            <span>Undo All</span>
          </button>

          <button
            onClick={selectAllWords}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <span>Select All</span>
          </button>

          <button
            onClick={selectNoneWords}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            <span>Select None</span>
          </button>

          <button
            onClick={exportEditedTranscript}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export Edited</span>
          </button>
        </div>
      </div>

      {/* Interactive Transcript Editor */}
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
                onClick={(e) => handleWordClick(index, e.ctrlKey || e.metaKey, e.shiftKey, e)}
                onMouseDown={(e) => handleWordMouseDown(index, e)}
                onMouseEnter={() => handleWordMouseEnter(index)}
                title={`${formatTime(word.start)} - ${formatTime(word.end)}`}
              >
                {word.word}
              </span>
            )
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {words.filter(w => !w.deleted).length}
            </div>
            <div className="text-sm text-gray-600">Words Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {words.filter(w => w.deleted).length}
            </div>
            <div className="text-sm text-gray-600">Words Deleted</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {selectedWords.size}
            </div>
            <div className="text-sm text-gray-600">Words Selected</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioEditor