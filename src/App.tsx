import React, { useState, useEffect } from 'react'
import AudioUploader from './components/AudioUploader'
import ResultsDisplay from './components/ResultsDisplay'
import ApiKeyInput from './components/ApiKeyInput'
import Login from './components/Login'
import { AudioProcessingResponse } from './types'

function App() {
  const [results, setResults] = useState<AudioProcessingResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>(import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || '')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

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
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setResults(null)
  }

  const handleNewUpload = () => {
    setResults(null)
    setError('')
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
            <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!results ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Audio Transcription & Summarization
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload an audio file to get an accurate transcript and AI-generated summary with key moments using OpenAI Whisper and GPT.
              </p>
            </div>

            {error && (
              <div className="max-w-2xl mx-auto">
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
              </div>
            )}

            <AudioUploader 
              apiKey={apiKey}
              onProcessingComplete={handleProcessingComplete}
              onError={handleError}
            />
          </div>
        ) : (
          <div className="space-y-6">
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
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App