// Type definitions for APIErrorBoundary
import { ReactNode, ErrorInfo } from 'react'

export interface APIErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  apiProvider?: 'openai' | 'elevenlabs' | 'unknown'
}

export interface APIErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  apiErrorType: APIErrorType
  isRetryable: boolean
}

export type APIErrorType = 
  | 'rate_limit'
  | 'auth_error'
  | 'quota_exceeded'
  | 'network_error'
  | 'service_unavailable'
  | 'invalid_request'
  | 'unknown'

export interface ErrorMessageConfig {
  title: string
  description: string
  actionText: string
}