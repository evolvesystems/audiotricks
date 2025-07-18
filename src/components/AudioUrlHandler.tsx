import React, { useState } from 'react'
import { LinkIcon, CloudArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface AudioUrlHandlerProps {
  onFileReady: (file: File) => void
  disabled?: boolean
}

const AudioUrlHandler: React.FC<AudioUrlHandlerProps> = ({ onFileReady, disabled }) => {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAlternative, setShowAlternative] = useState(false)

  const handleDirectFetch = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // First, try a HEAD request to check if the resource is accessible
      const checkResponse = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
      
      // If no error thrown, try actual fetch
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const fileName = url.split('/').pop() || 'audio.mp3'
      const file = new File([blob], fileName, { type: blob.type || 'audio/mpeg' })

      if (file.size > 100 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 100MB.')
      }

      onFileReady(file)
      setUrl('')
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError('Unable to fetch from this URL due to CORS restrictions')
      setShowAlternative(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAIDirectSubmit = () => {
    // OpenAI can fetch URLs directly - pass the URL as a special file
    const urlFile = new File([url], 'url.txt', { type: 'text/plain' })
    // Add a custom property to indicate this is a URL
    (urlFile as any).isUrl = true
    (urlFile as any).originalUrl = url
    onFileReady(urlFile)
    setUrl('')
    setShowAlternative(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError('')
              setShowAlternative(false)
            }}
            placeholder="Enter audio file URL (e.g., https://example.com/audio.mp3)"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled || isLoading}
          />
        </div>
        <button
          onClick={handleDirectFetch}
          disabled={disabled || isLoading || !url.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Fetching...' : 'Fetch Audio'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showAlternative && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Alternative Method</h4>
          <p className="text-sm text-blue-800 mb-3">
            We can send the URL directly to OpenAI's servers, which can access it without CORS restrictions.
          </p>
          <button
            onClick={handleOpenAIDirectSubmit}
            disabled={disabled || !url.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloudArrowDownIcon className="h-5 w-5" />
            <span>Process URL via OpenAI</span>
          </button>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>Supported formats: MP3, WAV, M4A, FLAC, OGG (max 100MB)</p>
        <p className="text-xs">Files over 25MB will be automatically split for processing</p>
        <p>Note: Some URLs may be blocked by CORS. We'll offer alternatives if needed.</p>
      </div>
    </div>
  )
}

export default AudioUrlHandler