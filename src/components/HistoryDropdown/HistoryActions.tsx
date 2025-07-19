import React from 'react'
import { 
  TrashIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

interface HistoryActionsProps {
  historyCount: number
  showConfirmClear: boolean
  onClearClick: () => void
  onClearConfirm: () => void
  onClearCancel: () => void
  onRecoveryClick: () => void
  onDiagnosticClick: () => void
}

const HistoryActions: React.FC<HistoryActionsProps> = ({
  historyCount,
  showConfirmClear,
  onClearClick,
  onClearConfirm,
  onClearCancel,
  onRecoveryClick,
  onDiagnosticClick
}) => {
  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      {showConfirmClear ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Are you sure you want to clear all history? This cannot be undone.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={onClearConfirm}
              className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear All
            </button>
            <button
              onClick={onClearCancel}
              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">
              {historyCount} {historyCount === 1 ? 'item' : 'items'} stored
            </span>
            {historyCount > 0 && (
              <button
                onClick={onClearClick}
                className="text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Clear All
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onRecoveryClick}
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Recover History
            </button>
            <button
              onClick={onDiagnosticClick}
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
            >
              <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
              Diagnostic
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryActions