// Error message configurations for different API error types
import { APIErrorType, ErrorMessageConfig } from './types'

export function getErrorMessage(
  apiErrorType: APIErrorType, 
  apiProvider?: 'openai' | 'elevenlabs' | 'unknown'
): ErrorMessageConfig {
  const provider = apiProvider || 'API'

  switch (apiErrorType) {
    case 'rate_limit':
      return {
        title: `${provider} Rate Limit Exceeded`,
        description: 'You have exceeded the API rate limit. Please wait a moment before trying again.',
        actionText: 'Wait and Retry'
      }
    
    case 'auth_error':
      return {
        title: `${provider} Authentication Error`,
        description: 'Your API key appears to be invalid or has expired. Please check your API key and try again.',
        actionText: 'Check API Key'
      }
    
    case 'quota_exceeded':
      return {
        title: `${provider} Quota Exceeded`,
        description: 'You have exceeded your API usage quota or billing limit. Please check your account.',
        actionText: 'Check Account'
      }
    
    case 'network_error':
      return {
        title: 'Network Connection Error',
        description: 'Unable to connect to the API service. Please check your internet connection.',
        actionText: 'Retry Connection'
      }
    
    case 'service_unavailable':
      return {
        title: `${provider} Service Unavailable`,
        description: 'The API service is temporarily unavailable. Please try again in a few moments.',
        actionText: 'Try Again Later'
      }
    
    case 'invalid_request':
      return {
        title: 'Invalid Request',
        description: 'The request to the API was invalid. This might be due to unsupported parameters or file format.',
        actionText: 'Check Input'
      }
    
    default:
      return {
        title: `${provider} Error`,
        description: 'An unexpected error occurred while communicating with the API service.',
        actionText: 'Try Again'
      }
  }
}