import React from 'react'
import { 
  DocumentTextIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { HistoryItem } from '../../hooks/useHistory'
import { AudioProcessingResponse } from '../../types'

interface HistoryItemListProps {
  items: HistoryItem[]
  onSelectItem: (results: AudioProcessingResponse) => void
  onDeleteItem: (id: string, event: React.MouseEvent) => void
  visibleItems: number
  onShowMore: () => void
}

const HistoryItemList: React.FC<HistoryItemListProps> = ({
  items,
  onSelectItem,
  onDeleteItem,
  visibleItems,
  onShowMore
}) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No history found</p>
      </div>
    )
  }

  return (
    <>
      {items.slice(0, visibleItems).map((item) => (
        <div
          key={item.id}
          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 group"
          onClick={() => onSelectItem(item.results)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-400" />
                {item.title || 'Untitled Audio'}
              </h4>
              <div className="flex items-center mt-1 text-xs text-gray-500 space-x-3">
                <span>{formatDate(item.timestamp)}</span>
                <span>•</span>
                <span>{formatDuration(item.duration)}</span>
                <span>•</span>
                <span>{item.wordCount.toLocaleString()} words</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-gray-200 rounded"
                title="View"
              >
                <EyeIcon className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={(e) => onDeleteItem(item.id, e)}
                className="p-1 hover:bg-red-100 rounded"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {items.length > visibleItems && (
        <button
          onClick={onShowMore}
          className="w-full py-3 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium"
        >
          Show {Math.min(10, items.length - visibleItems)} more
        </button>
      )}
    </>
  )
}

export default HistoryItemList