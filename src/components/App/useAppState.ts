import { useState } from 'react'
import { AudioProcessingResponse } from '../../types'

export const useAppState = () => {
  const [results, setResults] = useState<AudioProcessingResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)

  const handleProcessingComplete = (newResults: AudioProcessingResponse) => {
    setResults(newResults)
    setError('')
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setResults(null)
  }

  const handleSelectHistoryItem = (item: AudioProcessingResponse) => {
    setResults(item)
    setShowHistory(false)
  }

  const handleNewUpload = () => {
    setResults(null)
    setError('')
    setShowHistory(false)
  }

  return {
    results,
    setResults,
    error,
    showSettings,
    setShowSettings,
    showHelp,
    setShowHelp,
    showHistory,
    setShowHistory,
    showQuickActions,
    setShowQuickActions,
    handleProcessingComplete,
    handleError,
    handleSelectHistoryItem,
    handleNewUpload
  }
}