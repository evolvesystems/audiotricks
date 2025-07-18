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
        
        // Migration: Check for old audioTricksResults and migrate
        const oldResults = localStorage.getItem('audioTricksResults')
        if (oldResults && (!stored || JSON.parse(stored).length === 0)) {
          try {
            const oldData = JSON.parse(oldResults)
            if (Array.isArray(oldData) && oldData.length > 0) {
              // Convert old format to new history format
              const migratedHistory = oldData.map((item: any, index: number) => ({
                id: item.id || Date.now().toString() + index,
                timestamp: item.timestamp || new Date().toISOString(),
                title: item.transcript?.text?.substring(0, 100) + '...' || 'Migrated Audio',
                duration: item.summary?.total_duration,
                wordCount: item.summary?.word_count || 0,
                language: item.summary?.language || 'en',
                results: {
                  transcript: item.transcript || { text: '' },
                  summary: item.summary || { summary: '', key_moments: [], word_count: 0 },
                  processing_time: item.processing_time || 0,
                  audioUrl: item.audioUrl,
                  audioFile: undefined // Remove any file references
                }
              }))
              
              setHistory(migratedHistory)
              // Save migrated data
              localStorage.setItem(HISTORY_KEY, JSON.stringify(migratedHistory))
              console.log('Migrated', migratedHistory.length, 'items from old storage format')
              
              // Optional: Remove old data after successful migration
              // localStorage.removeItem('audioTricksResults')
            }
          } catch (migrationError) {
            console.error('Error migrating old data:', migrationError)
          }
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
      if (history.length > 0) {
        console.log('Saving', history.length, 'items to history')
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving history:', error)
      
      // Check if it's a quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded!')
      }
    }
  }, [history])

  const addToHistory = (results: AudioProcessingResponse, isReprocess: boolean = false) => {
    // Remove File object before storing (can't be serialized)
    const sanitizedResults = {
      ...results,
      audioFile: undefined  // Remove File object
    }
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: generateTitle(results),
      duration: results.summary.total_duration,
      wordCount: results.summary.word_count,
      language: results.summary.language || 'en',
      results: sanitizedResults
    }

    setHistory(prev => {
      if (isReprocess && prev.length > 0) {
        // Update the most recent item (which should be the original)
        const updated = [...prev]
        updated[0] = {
          ...updated[0],
          title: generateTitle(results),
          wordCount: results.summary.word_count,
          language: results.summary.language || 'en',
          results: sanitizedResults,
          timestamp: new Date().toISOString() // Update timestamp to show it was reprocessed
        }
        return updated
      } else {
        // Add new item for original processing
        const updated = [newItem, ...prev]
        return updated.slice(0, MAX_HISTORY_ITEMS)
      }
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