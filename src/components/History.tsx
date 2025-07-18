import React, { useState } from 'react'
import { 
  ClockIcon, 
  DocumentTextIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { HistoryItem } from '../hooks/useHistory'
import { AudioProcessingResponse } from '../types'

interface HistoryProps {
  history: HistoryItem[]
  onSelectItem: (results: AudioProcessingResponse) => void
  onDeleteItem: (id: string) => void
  onClearHistory: () => void
}

const History: React.FC<HistoryProps> = ({ 
  history, 
  onSelectItem, 
  onDeleteItem, 
  onClearHistory 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const filteredHistory = history.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.results.transcript.text.toLowerCase().includes(searchLower) ||
      item.results.summary.summary.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No History Yet</h3>
        <p className="text-gray-500">
          Your processed audio transcripts will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">History</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {history.length} item{history.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowConfirmClear(true)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* History Items */}
      <div className="max-h-96 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No matches found for "{searchTerm}"
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate pr-4">
                      {item.title}
                    </h3>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatDate(item.timestamp)}</span>
                      <span className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatDuration(item.duration)}
                      </span>
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-3 w-3 mr-1" />
                        {item.wordCount} words
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onSelectItem(item.results)}
                      className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Clear Dialog */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Clear All History?
            </h3>
            <p className="text-gray-500 mb-6">
              This will permanently delete all {history.length} saved transcript{history.length !== 1 ? 's' : ''}. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory()
                  setShowConfirmClear(false)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default History