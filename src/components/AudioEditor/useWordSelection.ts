import { useState, useEffect } from 'react'

export interface WordTimestamp {
  word: string
  start: number
  end: number
  selected?: boolean
  deleted?: boolean
}

interface UseWordSelectionProps {
  words: WordTimestamp[]
  onWordsUpdate: (words: WordTimestamp[]) => void
  onSeekToWord: (wordIndex: number) => void
}

export const useWordSelection = ({ words, onWordsUpdate, onSeekToWord }: UseWordSelectionProps) => {
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)

  const handleWordClick = (wordIndex: number, isCtrlClick: boolean = false, isShiftClick: boolean = false, _event: React.MouseEvent) => {
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
      onSeekToWord(wordIndex)
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

  const deleteSelectedWords = () => {
    if (selectedWords.size === 0) return
    
    const newWords = words.map((word, index) => ({
      ...word,
      deleted: selectedWords.has(index) ? true : word.deleted
    }))
    
    onWordsUpdate(newWords)
    setSelectedWords(new Set())
  }

  const undoDelete = () => {
    const newWords = words.map(word => ({
      ...word,
      deleted: false
    }))
    onWordsUpdate(newWords)
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

  // Add mouse up listener to document
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return {
    selectedWords,
    isDragging,
    handleWordClick,
    handleWordMouseDown,
    handleWordMouseEnter,
    deleteSelectedWords,
    undoDelete,
    selectAllWords,
    selectNoneWords
  }
}