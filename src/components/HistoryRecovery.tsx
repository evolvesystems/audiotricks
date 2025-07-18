import React, { useState } from 'react'
import { 
  ArrowPathIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { recoverHistory, listAllLocalStorageKeys, inspectLocalStorageKey } from '../utils/historyRecovery'
import { HistoryItem } from '../hooks/useHistory'

interface HistoryRecoveryProps {
  onRecoveredItems: (items: HistoryItem[]) => void
  onClose: () => void
}

const HistoryRecovery: React.FC<HistoryRecoveryProps> = ({ onRecoveredItems, onClose }) => {
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveredItems, setRecoveredItems] = useState<HistoryItem[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [allKeys, setAllKeys] = useState<string[]>([])
  const [inspectedKey, setInspectedKey] = useState<string | null>(null)

  const handleRecover = async () => {
    setIsRecovering(true)
    try {
      const items = recoverHistory()
      setRecoveredItems(items)
      
      if (items.length > 0) {
        // Merge with existing history
        onRecoveredItems(items)
      }
    } catch (error) {
      console.error('Recovery failed:', error)
    } finally {
      setIsRecovering(false)
    }
  }

  const handleShowDetails = () => {
    setShowDetails(true)
    const keys = listAllLocalStorageKeys()
    setAllKeys(keys)
    console.log('All localStorage keys:', keys)
  }

  const handleInspectKey = (key: string) => {
    setInspectedKey(key)
    inspectLocalStorageKey(key)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">History Recovery</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Recovery Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Lost History Recovery
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  This tool will search your browser's localStorage for any lost AudioTricks history data.
                  It will attempt to recover transcripts, summaries, and processing results from various storage formats.
                </p>
              </div>
            </div>
          </div>

          {/* Recovery Actions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRecover}
                disabled={isRecovering}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isRecovering ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Recovering...</span>
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Recover Lost History</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShowDetails}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <EyeIcon className="h-4 w-4" />
                <span>Show Technical Details</span>
              </button>
            </div>

            {/* Recovery Results */}
            {recoveredItems.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Recovery Successful!
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      Found and recovered {recoveredItems.length} items. They have been added to your history.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recovered Items Preview */}
            {recoveredItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Recovered Items</h3>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                  {recoveredItems.map((item, index) => (
                    <div key={item.id} className="p-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.wordCount} words • {item.duration ? `${Math.round(item.duration / 60)}m` : 'Unknown duration'}
                          </p>
                        </div>
                        <DocumentTextIcon className="h-4 w-4 text-gray-400 ml-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Details */}
            {showDetails && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Technical Details</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">All localStorage Keys</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {allKeys.map(key => (
                      <div key={key} className="flex items-center justify-between">
                        <code className="text-xs text-gray-700">{key}</code>
                        <button
                          onClick={() => handleInspectKey(key)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Inspect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Recovery Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Check browser console for detailed recovery logs</li>
                    <li>• Recovery searches for data in multiple storage formats</li>
                    <li>• Duplicates are automatically removed</li>
                    <li>• If recovery fails, try inspecting individual keys</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistoryRecovery