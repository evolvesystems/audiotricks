import React, { useState, useRef, useEffect } from 'react'
import { 
  ClockIcon, 
  DocumentTextIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { HistoryItem } from '../hooks/useHistory'
import { AudioProcessingResponse } from '../types'
import HistoryRecovery from './HistoryRecovery'
import HistoryDiagnostic from './HistoryDiagnostic'

interface HistoryDropdownProps {
  history: HistoryItem[]
  onSelectItem: (results: AudioProcessingResponse) => void
  onDeleteItem: (id: string) => void
  onClearHistory: () => void
  onRecoverHistory: (items: HistoryItem[]) => void
  onHistoryChange: () => void
  isOpen: boolean
  onClose: () => void
}

const HistoryDropdown: React.FC<HistoryDropdownProps> = ({ 
  history, 
  onSelectItem, 
  onDeleteItem, 
  onClearHistory,
  onRecoverHistory,
  onHistoryChange,
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [visibleItems, setVisibleItems] = useState(10)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

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

  const handleSelectItem = (item: HistoryItem) => {
    onSelectItem(item.results)
    onClose()
  }

  const handleDeleteItem = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onDeleteItem(id)
  }

  const handleClearHistory = () => {
    onClearHistory()
    setShowConfirmClear(false)
    onClose()
  }

  const showMoreItems = () => {
    setVisibleItems(prev => prev + 10)
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-12 right-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
      <div ref={dropdownRef}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">History</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* History Items */}
        <div className="max-h-96 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No matching items found' : 'No history items yet'}
            </div>
          ) : (
            <>
              {filteredHistory.slice(0, visibleItems).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <DocumentTextIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-500">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                        {item.title}
                      </h4>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatDuration(item.duration)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DocumentTextIcon className="h-3 w-3" />
                          <span>{item.wordCount.toLocaleString()} words</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1 hover:bg-red-100 rounded-md ml-2"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Show More Button */}
              {filteredHistory.length > visibleItems && (
                <button
                  onClick={showMoreItems}
                  className="w-full p-3 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-200 flex items-center justify-center space-x-2"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                  <span>Show {Math.min(10, filteredHistory.length - visibleItems)} more</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            {showConfirmClear ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Are you sure you want to clear all history?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleClearHistory}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setShowRecovery(true)}
                  className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center justify-center space-x-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Recover Lost History</span>
                </button>
                <button
                  onClick={() => setShowDiagnostic(true)}
                  className="w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md flex items-center justify-center space-x-2"
                >
                  <WrenchScrewdriverIcon className="h-4 w-4" />
                  <span>Run Diagnostic</span>
                </button>
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  Clear All History
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* History Recovery Modal */}
      {showRecovery && (
        <HistoryRecovery
          onRecoveredItems={(items) => {
            onRecoverHistory(items)
            setShowRecovery(false)
          }}
          onClose={() => setShowRecovery(false)}
        />
      )}
      
      {/* History Diagnostic Modal */}
      {showDiagnostic && (
        <HistoryDiagnostic
          isOpen={showDiagnostic}
          onClose={() => setShowDiagnostic(false)}
          onHistoryChange={onHistoryChange}
        />
      )}
    </div>
  )
}

export default HistoryDropdown