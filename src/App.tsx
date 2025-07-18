import React, { useState, useEffect } from 'react'
import AudioUploader from './components/AudioUploader'
import ResultsDisplay2 from './components/ResultsDisplay2'
import ApiKeyInput from './components/ApiKeyInput'
import Login from './components/Login'
import LoginCard from './components/LoginCard'
import Settings from './components/Settings'
import HeroSection from './components/HeroSection'
import HelpCenter from './components/HelpCenter'
import History from './components/History'
import HistoryDropdown from './components/HistoryDropdown'
import QuickActions from './components/QuickActions'
import { AudioProcessingResponse } from './types'
import { useSettings } from './hooks/useSettings'
import { useHistory } from './hooks/useHistory'
import { Cog6ToothIcon, QuestionMarkCircleIcon, ClockIcon, HomeIcon, ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline'

function App() {
  const [results, setResults] = useState<AudioProcessingResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('openai_api_key') || '')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true) // Default to authenticated
  const [isGuest, setIsGuest] = useState<boolean>(true) // Default to guest mode
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const { settings, updateSettings } = useSettings()
  const { history, addToHistory, removeFromHistory, clearHistory } = useHistory()

  useEffect(() => {
    // Check if user has logged in with password before (persists permanently)
    const isAuthed = localStorage.getItem('admin_authenticated') === 'true'
    
    if (isAuthed) {
      // User previously logged in with password - use ENV keys (persists permanently)
      setIsAuthenticated(true)
      setIsGuest(false)
      const envKey = import.meta.env.VITE_OPENAI_API_KEY
      if (envKey) {
        setApiKey(envKey)
      }
    } else {
      // Default to guest mode (must use own keys)
      setIsAuthenticated(true)
      setIsGuest(true)
      // Only use localStorage keys for guests
      const localKey = localStorage.getItem('openai_api_key')
      if (localKey) {
        setApiKey(localKey)
      }
    }
  }, [])

  const handleProcessingComplete = (result: AudioProcessingResponse) => {
    setResults(result)
    setError('')
    
    // Always add to history
    addToHistory(result)
  }

  const handleReprocess = (newResults: AudioProcessingResponse) => {
    setResults(newResults)
    setError('')
    
    // Update the existing history item instead of creating a new one
    addToHistory(newResults, true) // isReprocess = true
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

  const handleLogin = (guestMode: boolean = false) => {
    setIsAuthenticated(true)
    setIsGuest(guestMode)
    setShowLogin(false)
    
    // If logged in (not guest), use ENV keys and save admin status permanently
    if (!guestMode) {
      localStorage.setItem('admin_authenticated', 'true')
      const envKey = import.meta.env.VITE_OPENAI_API_KEY
      if (envKey) {
        setApiKey(envKey)
      }
    }
  }

  const handleLogout = () => {
    // Clear admin authentication
    localStorage.removeItem('admin_authenticated')
    
    // Reset state to guest mode
    setIsAuthenticated(true)
    setIsGuest(true)
    setResults(null)
    setError('')
    
    // Clear API key (force user to enter their own)
    setApiKey('')
    
    // Keep any locally stored keys for when they return to guest mode
    const localKey = localStorage.getItem('openai_api_key')
    if (localKey) {
      setApiKey(localKey)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">AudioTricks</h1>
              {isGuest && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Using Own Keys
                </span>
              )}
              {!isGuest && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Using Admin Keys
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNewUpload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="New Upload"
              >
                <HomeIcon className="h-5 w-5" />
              </button>
              <div className="relative">
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
                
                <HistoryDropdown
                  history={history}
                  onSelectItem={(item) => {
                    setResults(item)
                    setShowHistory(false)
                  }}
                  onDeleteItem={removeFromHistory}
                  onClearHistory={clearHistory}
                  isOpen={showHistory}
                  onClose={() => setShowHistory(false)}
                />
              </div>
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
              <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} isGuest={isGuest} />
              
              {isGuest ? (
                <button
                  onClick={() => setShowLogin(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  title="Login for enhanced features"
                >
                  <UserIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  title="Logout and clear data"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {!results ? (
          <>
            <HeroSection />
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <div className="space-y-6">
                <div className="text-center mb-8 animate-fadeIn">
                  <h1 className="text-4xl font-bold gradient-text mb-2">
                    Your Audio Analysis
                  </h1>
                  <p className="text-gray-600">
                    Comprehensive insights extracted from your audio content
                  </p>
                </div>
                
                <ResultsDisplay2 
                  results={results}
                  onExport={handleExport}
                  showCostEstimates={settings.showCostEstimates}
                  onReprocess={handleReprocess}
                />
              </div>
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

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Enhanced Access</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <LoginCard onLogin={handleLogin} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App