import { useState, useEffect } from 'react'
import { WordTimestamp } from './useWordSelection'

interface UseTranscriptParsingProps {
  transcriptText: string
  totalDuration: number
}

export const useTranscriptParsing = ({ transcriptText, totalDuration }: UseTranscriptParsingProps) => {
  const [words, setWords] = useState<WordTimestamp[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!transcriptText) return

    const parseTranscriptToWords = () => {
      // Split into words and estimate timestamps
      const wordsArray = transcriptText.split(/\s+/).filter(word => word.length > 0)
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
  }, [transcriptText, totalDuration])

  const getEditedWords = () => {
    return words.map(word => ({
      word: word.word,
      deleted: word.deleted || false
    }))
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

  return {
    words,
    isLoading,
    setWords,
    getEditedWords,
    exportEditedTranscript
  }
}