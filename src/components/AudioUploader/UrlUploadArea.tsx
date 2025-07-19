import React from 'react'
import { LinkIcon } from '@heroicons/react/24/outline'

interface UrlUploadAreaProps {
  audioUrl: string
  onUrlChange: (url: string) => void
  onSubmit: () => void
  isProcessing: boolean
  hasApiKey: boolean
}

const UrlUploadArea: React.FC<UrlUploadAreaProps> = ({
  audioUrl,
  onUrlChange,
  onSubmit,
  isProcessing,
  hasApiKey
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="url"
            value={audioUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="Enter audio file URL (e.g., https://example.com/audio.mp3)"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isProcessing || !hasApiKey}
          />
        </div>
        <button
          type="submit"
          disabled={isProcessing || !hasApiKey || !audioUrl.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Process URL'}
        </button>
      </div>
      
      <div className="text-xs text-gray-500">
        <p>Supported formats: MP3, WAV, M4A, FLAC, OGG, OPUS (max 150MB)</p>
        <p className="text-xs">Files over 150MB will be automatically split for processing</p>
        <p>Note: Some URLs may be blocked by CORS. We'll offer alternatives if needed.</p>
      </div>
    </form>
  )
}

export default UrlUploadArea