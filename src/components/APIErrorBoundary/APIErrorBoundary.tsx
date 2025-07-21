// Main API error boundary component - refactored to under 250 lines
import React, { Component, ErrorInfo } from 'react'
import { criticalError } from '../../utils/logger'
import { APIErrorBoundaryProps, APIErrorBoundaryState } from './types'
import { analyzeAPIError } from './errorAnalyzer'
import { getErrorMessage } from './errorMessages'
import ErrorDisplay from './ErrorDisplay'

/**
 * Specialized error boundary for API-related errors (OpenAI, ElevenLabs).
 * Provides API-specific error handling, retry logic, and user guidance.
 */
class APIErrorBoundary extends Component<APIErrorBoundaryProps, APIErrorBoundaryState> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: APIErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      apiErrorType: 'unknown',
      isRetryable: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<APIErrorBoundaryState> {
    const { apiErrorType, isRetryable } = analyzeAPIError(error)
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      apiErrorType,
      isRetryable
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log API-specific error with additional context
    criticalError('APIErrorBoundary caught an API error:', {
      error,
      errorInfo,
      apiErrorType: this.state.apiErrorType,
      apiProvider: this.props.apiProvider,
      isRetryable: this.state.isRetryable,
      retryCount: this.retryCount,
      networkStatus: navigator.onLine ? 'online' : 'offline'
    })
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.retryCount = 0
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      apiErrorType: 'unknown',
      isRetryable: false
    })
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      const { title, description, actionText } = getErrorMessage(
        this.state.apiErrorType, 
        this.props.apiProvider
      )
      const { isRetryable, apiErrorType, error } = this.state
      const canRetry = isRetryable && this.retryCount < this.maxRetries

      return (
        <ErrorDisplay
          title={title}
          description={description}
          actionText={actionText}
          apiErrorType={apiErrorType}
          isRetryable={isRetryable}
          canRetry={canRetry}
          retryCount={this.retryCount}
          maxRetries={this.maxRetries}
          error={error}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

export default APIErrorBoundary