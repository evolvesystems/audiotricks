import { useState } from 'react'
import { AudioProcessingResponse } from '../../types'
import { generateSummary } from '../../utils/openai'
import { SummaryStyle } from '../SummaryStyleSelector'
import { GPTSettings } from '../../utils/openai'
import { logger } from '../../utils/logger'

interface UseReprocessingProps {
  results: AudioProcessingResponse
  onReprocess?: (newResults: AudioProcessingResponse) => void
}

export const useReprocessing = ({ results, onReprocess }: UseReprocessingProps) => {
  const [showReprocessModal, setShowReprocessModal] = useState(false)
  const [isReprocessing, setIsReprocessing] = useState(false)

  const handleReprocess = async (summaryStyle: SummaryStyle, language: string, gptSettings: GPTSettings) => {
    logger.log('Starting reprocess with:', { summaryStyle, language, gptSettings })
    
    if (!onReprocess) {
      logger.error('No onReprocess handler provided')
      alert('Reprocess functionality is not available')
      return
    }
    
    setIsReprocessing(true)
    setShowReprocessModal(false)
    
    try {
      const apiKey = localStorage.getItem('openai_api_key') || ''
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please add your API key in the header.')
      }
      
      logger.log('Generating new summary...')
      
      // Generate new summary using existing transcript
      const newSummary = await generateSummary(
        results.transcript, 
        apiKey, 
        summaryStyle, 
        language, 
        gptSettings
      )
      
      logger.log('New summary generated:', newSummary)
      
      // Create new results with updated summary
      const newResults: AudioProcessingResponse = {
        ...results,
        summary: newSummary,
        processing_time: results.processing_time, // Keep original processing time
        originalId: results.originalId || results.id // Preserve original ID for history updates
      }
      
      onReprocess(newResults)
      logger.log('Reprocess completed successfully')
    } catch (error: any) {
      logger.error('Reprocess failed:', error)
      const errorMessage = error.message || 'Failed to reprocess audio. Please try again.'
      alert(errorMessage)
    } finally {
      setIsReprocessing(false)
    }
  }

  return {
    showReprocessModal,
    setShowReprocessModal,
    isReprocessing,
    handleReprocess
  }
}