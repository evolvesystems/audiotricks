import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { criticalError } from '../utils/logger'
import DebugInfo from './DebugInfo'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
  showDebug: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      showDebug: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    criticalError('ErrorBoundary caught an error:', { error, errorInfo })
    
    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleAutoRetry = () => {
    setTimeout(() => {
      this.handleReset()
    }, 1000)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Something went wrong
                </h2>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-4">
                We encountered an unexpected error. The error has been logged and we'll look into it.
                {this.state.retryCount > 0 && (
                  <span className="block mt-2 text-xs text-gray-500">
                    Retry attempts: {this.state.retryCount}
                  </span>
                )}
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-gray-700 font-medium mb-2">
                    Error details (development only)
                  </summary>
                  <div className="bg-gray-100 rounded p-3 text-xs font-mono overflow-auto">
                    <p className="text-red-600 mb-2">{this.state.error.toString()}</p>
                    {this.state.errorInfo && (
                      <pre className="text-gray-600 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex flex-col space-y-2">
                {this.state.retryCount < 3 && (
                  <button
                    onClick={this.handleAutoRetry}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Auto Retry in 1 second
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => this.setState({ showDebug: true })}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Debug Info
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <DebugInfo
            isVisible={this.state.showDebug}
            onClose={() => this.setState({ showDebug: false })}
          />
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary