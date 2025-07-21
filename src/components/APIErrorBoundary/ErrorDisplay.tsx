// Error display component for API error boundary
import React from 'react'
import { CloudIcon, ExclamationTriangleIcon, KeyIcon } from '@heroicons/react/24/outline'
import { APIErrorType } from './types'

interface ErrorDisplayProps {
  title: string
  description: string
  actionText: string
  apiErrorType: APIErrorType
  isRetryable: boolean
  canRetry: boolean
  retryCount: number
  maxRetries: number
  error: Error | null
  onRetry: () => void
  onReset: () => void
}

export default function ErrorDisplay({
  title,
  description,
  actionText,
  apiErrorType,
  isRetryable,
  canRetry,
  retryCount,
  maxRetries,
  error,
  onRetry,
  onReset
}: ErrorDisplayProps) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          {apiErrorType === 'auth_error' ? (
            <KeyIcon className="h-6 w-6 text-yellow-400" />
          ) : apiErrorType === 'network_error' ? (
            <CloudIcon className="h-6 w-6 text-yellow-400" />
          ) : (
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{description}</p>
            
            {apiErrorType === 'rate_limit' && (
              <p className="mt-2 text-xs">
                Suggestion: Wait 1-2 minutes before retrying, or try reducing the size of your request.
              </p>
            )}
            
            {apiErrorType === 'auth_error' && (
              <div className="mt-2 text-xs">
                <p>• Make sure your API key is correctly entered</p>
                <p>• Check that your API key has the necessary permissions</p>
                <p>• Verify your account is active and in good standing</p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium">
                  Technical details (development)
                </summary>
                <div className="mt-2 bg-yellow-100 rounded p-2 text-xs font-mono overflow-auto max-h-32">
                  <p className="text-yellow-800 mb-1">{error.toString()}</p>
                  {retryCount > 0 && (
                    <p className="text-yellow-700 mb-1">Retry attempt: {retryCount}/{maxRetries}</p>
                  )}
                </div>
              </details>
            )}
          </div>
          
          <div className="mt-4 flex space-x-2">
            {canRetry ? (
              <button
                onClick={onRetry}
                className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {actionText} ({maxRetries - retryCount} left)
              </button>
            ) : (
              <button
                onClick={onReset}
                className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {actionText}
              </button>
            )}
            
            <button
              onClick={onReset}
              className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Start Over
            </button>
            
            {apiErrorType === 'auth_error' && (
              <button
                onClick={() => {
                  // Navigate to settings or API key input
                  const event = new CustomEvent('show-api-settings')
                  window.dispatchEvent(event)
                }}
                className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Update API Key
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}