// Error analysis utilities for API errors
import { APIErrorType } from './types'

export interface ErrorAnalysisResult {
  apiErrorType: APIErrorType
  isRetryable: boolean
}

/**
 * Analyzes an error to determine if it's API-related and what type
 */
export function analyzeAPIError(error: Error): ErrorAnalysisResult {
  const errorMessage = error.message?.toLowerCase() || ''
  const errorStack = error.stack?.toLowerCase() || ''
  
  // Check for specific API error patterns
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return { apiErrorType: 'rate_limit', isRetryable: true }
  }
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('401') || 
      errorMessage.includes('api key') || errorMessage.includes('invalid key')) {
    return { apiErrorType: 'auth_error', isRetryable: false }
  }
  
  if (errorMessage.includes('quota') || errorMessage.includes('billing') || 
      errorMessage.includes('credits') || errorMessage.includes('402')) {
    return { apiErrorType: 'quota_exceeded', isRetryable: false }
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || 
      errorMessage.includes('cors') || errorMessage.includes('connection')) {
    return { apiErrorType: 'network_error', isRetryable: true }
  }
  
  if (errorMessage.includes('503') || errorMessage.includes('502') || 
      errorMessage.includes('service unavailable') || errorMessage.includes('gateway')) {
    return { apiErrorType: 'service_unavailable', isRetryable: true }
  }
  
  if (errorMessage.includes('400') || errorMessage.includes('bad request') || 
      errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
    return { apiErrorType: 'invalid_request', isRetryable: false }
  }

  // Check if error is from API calls by looking at stack trace
  const isAPICall = errorStack.includes('openai') || errorStack.includes('elevenlabs') || 
                    errorStack.includes('fetch') || errorStack.includes('api')
  
  return { 
    apiErrorType: isAPICall ? 'unknown' : 'unknown', 
    isRetryable: isAPICall 
  }
}