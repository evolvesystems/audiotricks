import React, { useState, useEffect } from 'react'
import { 
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { performHistoryDiagnostic, repairHistory, cleanupHistory, DiagnosticResult } from '../utils/historyDiagnostic'
import DataIntegrityCard from './HistoryDiagnostic/DataIntegrityCard'
import StorageAnalysisCard from './HistoryDiagnostic/StorageAnalysisCard'
import DiagnosticMessages from './HistoryDiagnostic/DiagnosticMessages'

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
              <DataIntegrityCard dataIntegrity={diagnostic.dataIntegrity} />

              <StorageAnalysisCard storageAnalysis={diagnostic.storageAnalysis} />

              <DiagnosticMessages 
                issues={diagnostic.issues}
                warnings={diagnostic.warnings}
                suggestions={diagnostic.suggestions}
              />

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