import React, { useState, useEffect } from 'react'
import AudioUploader from './components/AudioUploader'
import ResultsDisplay from './components/ResultsDisplay'
import ApiKeyInput from './components/ApiKeyInput'
import Login from './components/Login'
import Settings from './components/Settings'
import HeroSection from './components/HeroSection'
import HelpCenter from './components/HelpCenter'
import History from './components/History'
import QuickActions from './components/QuickActions'
import { AudioProcessingResponse } from './types'
import { useSettings } from './hooks/useSettings'
import { useHistory } from './hooks/useHistory'
import { Cog6ToothIcon, QuestionMarkCircleIcon, ClockIcon, HomeIcon } from '@heroicons/react/24/outline'

function App() {
  const [results, setResults] = useState<AudioProcessingResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>(import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || '')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { settings, updateSettings } = useSettings()
  const { history, addToHistory, removeFromHistory, clearHistory } = useHistory()

  useEffect(() => {
    // Check if already authenticated
    const isAuthed = sessionStorage.getItem('authenticated') === 'true'
    
    if (isAuthed) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleProcessingComplete = (result: AudioProcessingResponse) => {
    setResults(result)
    setError('')
    
    // Always add to history
    addToHistory(result)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setResults(null)
  }

  const handleNewUpload = () => {
    setResults(null)
    setError('')
    setShowHistory(false)
  }

  const handleExport = (format: 'txt' | 'json') => {
    if (!results) return

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'txt') {
      content = `TRANSCRIPT:\n\n${results.transcript.text}\n\nSUMMARY:\n\n${results.summary.summary}\n\nKEY MOMENTS:\n\n${results.summary.key_moments.map(moment => `${moment.timestamp} - ${moment.title}\n${moment.description}`).join('\n\n')}`
      filename = 'transcript-summary.txt'
      mimeType = 'text/plain'
    } else {
      content = JSON.stringify(results, null, 2)
      filename = 'transcript-summary.json'
      mimeType = 'application/json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">AudioTricks</h1>
            <div className="flex items-center space-x-4">
              {results && (
                <button
                  onClick={handleNewUpload}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  title="New Upload"
                >
                  <HomeIcon className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-md relative ${
                  showHistory 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="History"
              >
                <ClockIcon className="h-5 w-5" />
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 rounded-full text-xs text-white flex items-center justify-center min-w-[0.75rem] h-3 px-1">
                    {history.length > 99 ? '99+' : history.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Help"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Settings"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
              <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {!results ? (
          <>
            {!showHistory && <HeroSection />}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              {showHistory ? (
                <History
                  history={history}
                  onSelectItem={(item) => {
                    setResults(item)
                    setShowHistory(false)
                  }}
                  onDeleteItem={removeFromHistory}
                  onClearHistory={clearHistory}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content - Upload Area */}
                  <div className="lg:col-span-2 space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              Processing Error
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <AudioUploader 
                      apiKey={apiKey}
                      onProcessingComplete={handleProcessingComplete}
                      onError={handleError}
                      defaultSettings={settings}
                    />
                  </div>
                  
                  {/* Sidebar - Quick Actions */}
                  <div className="space-y-6">
                    <QuickActions 
                      onShowHistory={() => setShowHistory(true)}
                      onShowHelp={() => setShowHelp(true)}
                      historyCount={history.length}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {/* History Section - Also shown in results view */}
              {showHistory && (
                <History
                  history={history}
                  onSelectItem={(item) => {
                    setResults(item)
                  }}
                  onDeleteItem={removeFromHistory}
                  onClearHistory={clearHistory}
                />
              )}
              
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Results</h2>
                <button
                  onClick={handleNewUpload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Process New Audio
                </button>
              </div>
              
              <ResultsDisplay 
                results={results}
                onExport={handleExport}
                showCostEstimates={settings.showCostEstimates}
              />
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsChange={updateSettings}
        currentSettings={settings}
      />
      
      {/* Help Center */}
      <HelpCenter
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  )
}

export default App