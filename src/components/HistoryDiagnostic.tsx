import React, { useState, useEffect } from 'react'
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { performHistoryDiagnostic, repairHistory, cleanupHistory, DiagnosticResult } from '../utils/historyDiagnostic'

interface HistoryDiagnosticProps {
  isOpen: boolean
  onClose: () => void
  onHistoryChange: () => void
}

const HistoryDiagnostic: React.FC<HistoryDiagnosticProps> = ({ isOpen, onClose, onHistoryChange }) => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [repairResult, setRepairResult] = useState<string | null>(null)
  const [cleanupResult, setCleanupResult] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      runDiagnostic()
    }
  }, [isOpen])

  const runDiagnostic = async () => {
    setIsRunning(true)
    setRepairResult(null)
    setCleanupResult(null)
    
    try {
      // Add small delay to show loading
      await new Promise(resolve => setTimeout(resolve, 500))
      const result = performHistoryDiagnostic()
      setDiagnostic(result)
    } catch (error) {
      console.error('Diagnostic failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleRepair = async () => {
    setIsRunning(true)
    try {
      const result = repairHistory()
      setRepairResult(result.message)
      if (result.success) {
        onHistoryChange()
        // Re-run diagnostic
        await runDiagnostic()
      }
    } catch (error) {
      setRepairResult(`Repair failed: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleCleanup = async () => {
    setIsRunning(true)
    try {
      const result = cleanupHistory()
      setCleanupResult(result.message)
      if (result.success) {
        // Re-run diagnostic
        await runDiagnostic()
      }
    } catch (error) {
      setCleanupResult(`Cleanup failed: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">History System Diagnostic</h2>
              <p className="text-sm text-gray-500">Analyze and repair history data issues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Running State */}
          {isRunning && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Running diagnostic...</span>
            </div>
          )}

          {/* Diagnostic Results */}
          {diagnostic && !isRunning && (
            <>
              {/* Data Integrity */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Data Integrity Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{diagnostic.dataIntegrity.totalItems}</div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{diagnostic.dataIntegrity.validItems}</div>
                    <div className="text-sm text-gray-600">Valid Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{diagnostic.dataIntegrity.invalidItems}</div>
                    <div className="text-sm text-gray-600">Invalid Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{diagnostic.dataIntegrity.corruptedItems}</div>
                    <div className="text-sm text-gray-600">Corrupted Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{diagnostic.dataIntegrity.duplicateItems}</div>
                    <div className="text-sm text-gray-600">Duplicate Items</div>
                  </div>
                </div>
              </div>

              {/* Storage Analysis */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Storage Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{diagnostic.storageAnalysis.totalKeys}</div>
                    <div className="text-sm text-gray-600">Total Keys</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{diagnostic.storageAnalysis.historyKeys.length}</div>
                    <div className="text-sm text-gray-600">History Keys</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(diagnostic.storageAnalysis.storageUsage / 1024)}KB
                    </div>
                    <div className="text-sm text-gray-600">Storage Used</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${diagnostic.storageAnalysis.quotaExceeded ? 'text-red-600' : 'text-green-600'}`}>
                      {diagnostic.storageAnalysis.quotaExceeded ? 'YES' : 'NO'}
                    </div>
                    <div className="text-sm text-gray-600">Quota Exceeded</div>
                  </div>
                </div>
                
                {diagnostic.storageAnalysis.historyKeys.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Found History Keys:</h4>
                    <div className="flex flex-wrap gap-2">
                      {diagnostic.storageAnalysis.historyKeys.map(key => (
                        <code key={key} className="px-2 py-1 bg-gray-200 rounded text-xs">{key}</code>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Issues */}
              {diagnostic.issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="font-semibold text-red-900">Critical Issues ({diagnostic.issues.length})</h3>
                  </div>
                  <ul className="space-y-1">
                    {diagnostic.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-red-800">• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {diagnostic.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <h3 className="font-semibold text-yellow-900">Warnings ({diagnostic.warnings.length})</h3>
                  </div>
                  <ul className="space-y-1">
                    {diagnostic.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-800">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {diagnostic.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-blue-900">Suggestions ({diagnostic.suggestions.length})</h3>
                  </div>
                  <ul className="space-y-1">
                    {diagnostic.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-blue-800">• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* No Issues */}
              {diagnostic.issues.length === 0 && diagnostic.warnings.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <h3 className="font-semibold text-green-900">All Good!</h3>
                  </div>
                  <p className="text-sm text-green-800 mt-2">No critical issues found. Your history system is working properly.</p>
                </div>
              )}

              {/* Action Results */}
              {repairResult && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Repair Result</h4>
                  <p className="text-sm text-gray-700">{repairResult}</p>
                </div>
              )}

              {cleanupResult && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Cleanup Result</h4>
                  <p className="text-sm text-gray-700">{cleanupResult}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Re-run Diagnostic</span>
            </button>
            
            {diagnostic && (diagnostic.issues.length > 0 || diagnostic.dataIntegrity.invalidItems > 0) && (
              <button
                onClick={handleRepair}
                disabled={isRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <WrenchScrewdriverIcon className="h-4 w-4" />
                <span>Repair Issues</span>
              </button>
            )}
            
            {diagnostic && diagnostic.storageAnalysis.historyKeys.length > 1 && (
              <button
                onClick={handleCleanup}
                disabled={isRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                <span>Cleanup Legacy Data</span>
              </button>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default HistoryDiagnostic