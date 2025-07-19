import { useState, useEffect, useCallback, useRef } from 'react'
import { AudioProcessingResponse } from '../types'
import { 
  saveHistoryToStorage, 
  loadHistoryFromStorage, 
  clearHistoryStorage,
  getHistoryStorageInfo 
} from '../utils/historyStorage'
import { logger } from '../utils/logger'

export interface HistoryItem {
  id: string
  timestamp: string
  title: string
  duration?: number
  wordCount: number
  language: string
  results: AudioProcessingResponse
}

const MAX_HISTORY_ITEMS = 50
const SAVE_DEBOUNCE_MS = 1000

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      setIsLoading(true)
      const loadedHistory = loadHistoryFromStorage()
      setHistory(loadedHistory)
    } catch (error) {
      logger.error('Failed to load history:', error)
      setHistory([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced save function
  const saveToLocalStorage = useCallback((data: HistoryItem[]) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set a new timeout for saving
    saveTimeoutRef.current = setTimeout(() => {
      try {
        saveHistoryToStorage(data)
      } catch (error) {
        logger.error('Failed to save history:', error)
      }
    }, SAVE_DEBOUNCE_MS)
  }, [])

  // Auto-save when history changes
  useEffect(() => {
    if (!isLoading && history.length > 0) {
      saveToLocalStorage(history)
    }
  }, [history, isLoading, saveToLocalStorage])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const addToHistory = useCallback((results: AudioProcessingResponse, isReprocess: boolean = false) => {
    const itemId = isReprocess && results.originalId ? results.originalId : Date.now().toString()
    
    // Ensure the results have an ID for future reprocessing
    const updatedResults = {
      ...results,
      id: itemId,
      originalId: results.originalId || itemId
    }
    
    const newItem: HistoryItem = {
      id: itemId,
      timestamp: new Date().toISOString(),
      title: results.title || 'Untitled Audio',
      duration: results.duration,
      wordCount: results.wordCount || 0,
      language: results.language || 'en',
      results: updatedResults
    }

    setHistory(prev => {
      if (isReprocess) {
        // Update existing item
        const existingIndex = prev.findIndex(item => item.id === newItem.id)
        if (existingIndex !== -1) {
          const updated = [...prev]
          updated[existingIndex] = newItem
          return updated
        }
      }

      // Add new item at the beginning
      const updated = [newItem, ...prev]
      
      // Keep only the most recent MAX_HISTORY_ITEMS
      if (updated.length > MAX_HISTORY_ITEMS) {
        return updated.slice(0, MAX_HISTORY_ITEMS)
      }
      
      return updated
    })
  }, [])

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    clearHistoryStorage()
  }, [])

  const refreshHistory = useCallback(() => {
    try {
      const loadedHistory = loadHistoryFromStorage()
      setHistory(loadedHistory)
    } catch (error) {
      logger.error('Failed to refresh history:', error)
    }
  }, [])

  const getStorageInfo = useCallback(() => {
    return getHistoryStorageInfo()
  }, [])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    refreshHistory,
    isLoading,
    storageInfo: getStorageInfo()
  }
}