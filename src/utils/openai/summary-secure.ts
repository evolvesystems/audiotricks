// Secure summary generation using API proxy
import { SummaryStyle } from '../../components/SummaryStyleSelector'
import { apiProxy } from '../../services/apiProxy'
import { GPTSettings } from './types'
import { logger } from '../logger'

/**
 * Generate summary using secure API proxy
 */
export async function generateSummarySecure(
  transcript: string,
  summaryStyle: SummaryStyle = 'formal',
  outputLanguage: string = 'en',
  gptSettings?: GPTSettings
): Promise<string> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('No transcript provided for summarization')
  }

  try {
    const summary = await apiProxy.generateSummary(transcript, summaryStyle)
    return summary
  } catch (error: any) {
    logger.error('Error generating summary:', error)
    
    // Fall back to direct API call if proxy not available
    if (error.message?.includes('backend') || error.message?.includes('proxy')) {
      logger.warn('API proxy not available, falling back to direct OpenAI call')
      
      // For now, throw error indicating backend is required
      throw new Error('Summary generation requires backend API. Please ensure you are authenticated.')
    }
    
    throw error
  }
}