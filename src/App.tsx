import React from 'react'
import { useAuthentication } from './components/App/useAuthentication'
import { useAppState } from './components/App/useAppState'
import { useExport } from './components/App/useExport'
import { useSettings } from './hooks/useSettings'
import { useHistory } from './hooks/useHistory'
import { logger } from './utils/logger'
import AppHeader from './components/App/AppHeader'
import AppContent from './components/App/AppContent'
import LoginCard from './components/LoginCard'
import Settings from './components/Settings'
import HelpCenter from './components/HelpCenter'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const {
    isAuthenticated,
    isGuest,
    showLogin,
    apiKey,
    elevenLabsKey,
    handleLogin,
    handleLogout,
    handleApiKeyChange,
    handleElevenLabsKeyChange
  } = useAuthentication()

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

  const handleRecoverHistory = (items: any[]) => {
    items.forEach(item => {
      addToHistory(item.results)
    })
  }

  const handleReprocess = (newResults: any) => {
    logger.log('Handling reprocessed results')
    try {
      setResults(newResults)
      addToHistory(newResults, true) // Pass true to indicate this is a reprocess
      logger.log('Reprocessed results saved to history')
    } catch (error) {
      logger.error('Error saving reprocessed results:', error)
      alert('Failed to save reprocessed results. Please try again.')
    }
  }

  const handleExportWrapper = (format: 'txt' | 'json') => {
    if (results) {
      handleExport(results, format)
    }
  }

  if (!isAuthenticated) {
    return (
      <LoginCard
        onLogin={handleLogin}
        showLogin={showLogin}
        onClose={() => {}}
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <AppHeader
        apiKey={apiKey}
        elevenLabsKey={elevenLabsKey}
        isGuest={isGuest}
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
        onLogout={handleLogout}
      />

      <AppContent
        results={results}
        error={error}
        apiKey={apiKey}
        elevenLabsKey={elevenLabsKey}
        settings={settings}
        showQuickActions={showQuickActions}
        onProcessingComplete={(newResults) => {
          handleProcessingComplete(newResults)
          addToHistory(newResults)
        }}
        onError={handleError}
        onExport={handleExportWrapper}
        onReprocess={handleReprocess}
        onCloseQuickActions={() => setShowQuickActions(false)}
      />

      {/* Modal Overlays */}
      {showSettings && (
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          currentSettings={settings}
          onSettingsChange={updateSettings}
        />
      )}

      {showHelp && (
        <HelpCenter
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />
      )}
      </div>
    </ErrorBoundary>
  )
}

export default App