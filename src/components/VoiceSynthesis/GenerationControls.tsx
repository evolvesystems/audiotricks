import React from 'react'
import { 
  PlayIcon, 
  PauseIcon,
  ArrowDownTrayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface GenerationControlsProps {
  wordCount: number
  estimatedCost: number
  previewText: string
  isGenerating: boolean
  progress: number
  generatedAudio: Blob | null
  isPlaying: boolean
  canGenerate: boolean
  onGenerate: () => void
  onTogglePlayback: () => void
  onDownload: () => void
}

const GenerationControls: React.FC<GenerationControlsProps> = ({
  wordCount,
  estimatedCost,
  previewText,
  isGenerating,
  progress,
  generatedAudio,
  isPlaying,
  canGenerate,
  onGenerate,
  onTogglePlayback,
  onDownload
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Generate Voice</h3>
        <div className="text-sm text-gray-500">
          {wordCount} words • ~${estimatedCost.toFixed(2)} estimated cost
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preview Text (first 200 characters):</h4>
          <p className="text-sm text-gray-700">
            {previewText.substring(0, 200)}
            {previewText.length > 200 && '...'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating... {Math.round(progress * 100)}%</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              <span>Generate Voice</span>
            </>
          )}
        </button>

        {generatedAudio && (
          <>
            <button
              onClick={onTogglePlayback}
              className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={onDownload}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>Download</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default GenerationControls