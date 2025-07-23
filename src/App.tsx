import React, { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useAppState } from './components/App/useAppState'
import { useExport } from './components/App/useExport'
import { useSettings } from './hooks/useSettings'
import { useHistory } from './hooks/useHistory'
import { useApiKeys } from './hooks/useApiKeys'
import { apiProxy } from './services/apiProxy'
import { logger } from './utils/logger'
import AppHeader from './components/App/AppHeader'
import AppContent from './components/App/AppContent'
import Settings from './components/Settings'
import HelpCenter from './components/HelpCenter'
import ErrorBoundary from './components/ErrorBoundary'
import ApiKeyMigration from './components/ApiKeyMigration'
import Footer from './components/Footer'

function App() {
  // Use unified authentication context
  const { user, token, isAuthenticated, loading } = useAuth()
  
  // Use secure API key management
  const { hasKeys, saveApiKeys } = useApiKeys(token)
  
  // Temporary state for API keys (will be removed after full migration)
  const [apiKey, setApiKey] = useState<string>('')
  const [elevenLabsKey, setElevenLabsKey] = useState<string>('')
  
  const {
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
  } = useAppState()

  const { handleExport } = useExport()
  const { settings, updateSettings } = useSettings()
  const { history, addToHistory, removeFromHistory, clearHistory, refreshHistory } = useHistory()

  // Initialize API proxy with token
  useEffect(() => {
    apiProxy.setToken(token)
  }, [token])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Load API keys from localStorage for backward compatibility
  useEffect(() => {
    if (!hasKeys.hasOpenAI) {
      const localKey = localStorage.getItem('openai_api_key') || ''
      setApiKey(localKey)
    }
    if (!hasKeys.hasElevenLabs) {
      const localKey = localStorage.getItem('elevenlabs_api_key') || ''
      setElevenLabsKey(localKey)
    }
  }, [hasKeys])

  const handleRecoverHistory = (items: any[]) => {
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        if (item && item.results) {
          addToHistory(item.results)
        }
      })
    }
  }

  const handleReprocess = (newResults: any) => {
    logger.log('Handling reprocessed results')
    try {
      setResults(newResults)
      addToHistory(newResults, true) // Pass true to indicate this is a reprocess
    } catch (error) {
      logger.error('Error handling reprocessed results:', error)
      handleError(error as Error)
    }
  }

  const handleExportClick = (format: 'txt' | 'json' | 'pdf' | 'srt' | 'docx') => {
    if (results) {
      handleExport(results, format)
    }
  }

  const handleApiKeyChange = async (newKey: string) => {
    setApiKey(newKey)
    
    // Use secure storage for authenticated users
    if (isAuthenticated && token) {
      await saveApiKeys({ openai: newKey })
    } else {
      // Fall back to localStorage for guests
      localStorage.setItem('openai_api_key', newKey)
    }
  }

  const handleElevenLabsKeyChange = async (newKey: string) => {
    setElevenLabsKey(newKey)
    
    // Use secure storage for authenticated users
    if (isAuthenticated && token) {
      await saveApiKeys({ elevenLabs: newKey })
    } else {
      // Fall back to localStorage for guests
      localStorage.setItem('elevenlabs_api_key', newKey)
    }
  }

  const handleMigrationComplete = () => {
    logger.info('API key migration completed')
    // Refresh the UI or show success message
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* API Key Migration Helper */}
        <ApiKeyMigration
          token={token}
          isAuthenticated={isAuthenticated}
          onMigrationComplete={handleMigrationComplete}
        />
        
        <AppHeader
          apiKey={apiKey}
          elevenLabsKey={elevenLabsKey}
          isGuest={!isAuthenticated}
          token={token}
          hasSecureKeys={hasKeys}
          history={history}
          showHistory={showHistory}
          onApiKeyChange={handleApiKeyChange}
          onElevenLabsKeyChange={handleElevenLabsKeyChange}
          onHistoryToggle={() => setShowHistory(!showHistory)}
          onSelectHistoryItem={handleSelectHistoryItem}
          onDeleteHistoryItem={removeFromHistory}
          onClearHistory={clearHistory}
          onRecoverHistory={handleRecoverHistory}
          onHistoryChange={refreshHistory}
          onHistoryClose={() => setShowHistory(false)}
          onNewUpload={handleNewUpload}
          onShowHelp={() => setShowHelp(true)}
          onShowSettings={() => setShowSettings(true)}
        />
        
        <AppContent
          results={results}
          error={error}
          apiKey={apiKey}
          elevenLabsKey={elevenLabsKey}
          showQuickActions={showQuickActions}
          settings={settings}
          history={history}
          isGuest={!isAuthenticated}
          token={token}
          onProcessingComplete={handleProcessingComplete}
          onError={handleError}
          onExport={handleExportClick}
          onReprocess={handleReprocess}
          onToggleQuickActions={() => setShowQuickActions(!showQuickActions)}
          onNewUpload={handleNewUpload}
        />
        
        {showSettings && (
          <Settings
            settings={settings}
            onSettingsChange={updateSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
        
        {showHelp && (
          <HelpCenter onClose={() => setShowHelp(false)} />
        )}
        
        <Footer />
      </div>
    </ErrorBoundary>
  )
}

export default App