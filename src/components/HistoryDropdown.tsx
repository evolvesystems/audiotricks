import React, { useState, useRef, useEffect } from 'react'
import { HistoryItem } from '../hooks/useHistory'
import { AudioProcessingResponse } from '../types'
import HistoryRecovery from './HistoryRecovery'
import HistoryDiagnostic from './HistoryDiagnostic'
import HistoryHeader from './HistoryDropdown/HistoryHeader'
import HistoryItemList from './HistoryDropdown/HistoryItemList'
import HistoryActions from './HistoryDropdown/HistoryActions'

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


  const handleSelectItem = (results: AudioProcessingResponse) => {
    onSelectItem(results)
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
        <HistoryHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClose={onClose}
        />

        <div className="max-h-96 overflow-y-auto">
          <HistoryItemList
            items={filteredHistory}
            onSelectItem={handleSelectItem}
            onDeleteItem={handleDeleteItem}
            visibleItems={visibleItems}
            onShowMore={showMoreItems}
          />
        </div>

        <HistoryActions
          historyCount={history.length}
          showConfirmClear={showConfirmClear}
          onClearClick={() => setShowConfirmClear(true)}
          onClearConfirm={handleClearHistory}
          onClearCancel={() => setShowConfirmClear(false)}
          onRecoveryClick={() => setShowRecovery(true)}
          onDiagnosticClick={() => setShowDiagnostic(true)}
        />
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