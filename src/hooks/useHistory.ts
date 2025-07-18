import { useState, useEffect } from 'react'
import { AudioProcessingResponse } from '../types'

export interface HistoryItem {
  id: string
  timestamp: string
  title: string
  duration?: number
  wordCount: number
  language: string
  results: AudioProcessingResponse
}

const HISTORY_KEY = 'audioTricks_history'
const MAX_HISTORY_ITEMS = 50

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem(HISTORY_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          setHistory(parsed)
        }
      } catch (error) {
        console.error('Error loading history:', error)
      }
    }
    loadHistory()
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving history:', error)
    }
  }, [history])

  const addToHistory = (results: AudioProcessingResponse) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: generateTitle(results),
      duration: results.summary.total_duration,
      wordCount: results.summary.word_count,
      language: results.summary.language || 'en',
      results
    }

    setHistory(prev => {
      const updated = [newItem, ...prev]
      // Keep only the most recent items
      return updated.slice(0, MAX_HISTORY_ITEMS)
    })
  }

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }

  const clearHistory = () => {
    setHistory([])
  }

  const getHistoryItem = (id: string): HistoryItem | undefined => {
    return history.find(item => item.id === id)
  }

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryItem
  }
}

// Helper function to generate a title from the transcript or summary
function generateTitle(results: AudioProcessingResponse): string {
  // Try to extract a meaningful title from the summary
  const summary = results.summary.summary
  const firstSentence = summary.split('.')[0]
  
  if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
    return firstSentence.trim()
  }
  
  // If no good title from summary, use the first few words of transcript
  const transcriptWords = results.transcript.text.split(' ').slice(0, 10).join(' ')
  if (transcriptWords.length > 20) {
    return transcriptWords.substring(0, 50) + '...'
  }
  
  // Default title
  return `Audio Transcript ${new Date().toLocaleDateString()}`
}