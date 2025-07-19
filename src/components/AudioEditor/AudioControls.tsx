import React from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  TrashIcon,
  ArrowUturnLeftIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface AudioControlsProps {
  isPlaying: boolean
  currentTime: number
  totalDuration: number
  selectedWordsCount: number
  onTogglePlayPause: () => void
  onDeleteSelected: () => void
  onUndoDelete: () => void
  onSelectAll: () => void
  onSelectNone: () => void
  onExportTranscript: () => void
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void
  formatTime: (seconds: number) => string
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  currentTime,
  totalDuration,
  selectedWordsCount,
  onTogglePlayPause,
  onDeleteSelected,
  onUndoDelete,
  onSelectAll,
  onSelectNone,
  onExportTranscript,
  onProgressClick,
  formatTime
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Audio Progress Bar */}
      <div className="mb-4">
        <div 
          className="relative h-2 bg-gray-300 rounded-full cursor-pointer overflow-hidden"
          onClick={onProgressClick}
        >
          <div 
            className="absolute h-full bg-blue-600 rounded-full transition-all duration-100"
            style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onTogglePlayPause}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          onClick={onDeleteSelected}
          disabled={selectedWordsCount === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrashIcon className="h-5 w-5" />
          <span>Delete Selected ({selectedWordsCount})</span>
        </button>

        <button
          onClick={onUndoDelete}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
          <span>Undo All</span>
        </button>

        <button
          onClick={onSelectAll}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <span>Select All</span>
        </button>

        <button
          onClick={onSelectNone}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          <span>Select None</span>
        </button>

        <button
          onClick={onExportTranscript}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          <span>Export Edited</span>
        </button>
      </div>
    </div>
  )
}

export default AudioControls