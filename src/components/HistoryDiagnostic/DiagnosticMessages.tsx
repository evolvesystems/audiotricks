import React from 'react'
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface DiagnosticMessagesProps {
  issues: string[]
  warnings: string[]
  suggestions: string[]
}

const DiagnosticMessages: React.FC<DiagnosticMessagesProps> = ({ issues, warnings, suggestions }) => {
  return (
    <>
      {/* Issues */}
      {issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="font-semibold text-red-900">Critical Issues ({issues.length})</h3>
          </div>
          <ul className="space-y-1">
            {issues.map((issue, index) => (
              <li key={index} className="text-sm text-red-800">• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <InformationCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="font-semibold text-yellow-900">Warnings ({warnings.length})</h3>
          </div>
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-800">• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-semibold text-blue-900">Suggestions ({suggestions.length})</h3>
          </div>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-800">• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* No Issues */}
      {issues.length === 0 && warnings.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-semibold text-green-900">All Good!</h3>
          </div>
          <p className="text-sm text-green-800 mt-2">No critical issues found. Your history system is working properly.</p>
        </div>
      )}
    </>
  )
}

export default DiagnosticMessages