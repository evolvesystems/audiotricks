// Secure audio processor using API proxy
import { AudioProcessingResponse } from '../../types'
import { SummaryStyle } from '../../components/SummaryStyleSelector'
import { transcribeAudioSecure } from './transcription-secure'
import { generateSummarySecure } from './summary-secure'
import { logger } from '../logger'
import { GPTSettings } from './types'

type ProcessingStage = 'uploading' | 'transcribing' | 'summarizing' | 'complete'

/**
 * Main function to process audio with secure API proxy
 */
export async function processAudioWithOpenAISecure(
  file: File,
  summaryStyle: SummaryStyle = 'formal',
  outputLanguage: string = 'en',
  onProgress?: (stage: ProcessingStage, chunkProgress?: { current: number; total: number }) => void,
  gptSettings?: GPTSettings,
  signal?: AbortSignal
): Promise<AudioProcessingResponse> {
  let transcriptionResult

  try {
    // Stage 1: Upload/Transcribe
    if (onProgress) onProgress('transcribing')
    
    transcriptionResult = await transcribeAudioSecure(
      file, 
      signal,
      (current, total) => {
        if (onProgress) {
          onProgress('transcribing', { current, total })
        }
      }
    )

    // Check if aborted after transcription
    if (signal?.aborted) {
      throw new Error('Processing aborted')
    }

    // Stage 2: Summarize
    if (onProgress) onProgress('summarizing')
    
    const summary = await generateSummarySecure(
      transcriptionResult.text, 
      summaryStyle,
      outputLanguage,
      gptSettings
    )

    // Final result
    return {
      transcription: transcriptionResult.text,
      summary,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        duration: transcriptionResult.duration || 0,
        processingTime: 0, // Would need to calculate
        summaryStyle,
        outputLanguage,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error: any) {
    logger.error('Error processing audio:', error)
    
    // Enhance error messages
    if (error.message?.includes('401') || error.message?.includes('Incorrect API key')) {
      throw new Error('Invalid API key. Please check your OpenAI API key in the header.')
    }
    
    if (error.message?.includes('429')) {
      throw new Error('Rate limit exceeded. Please wait a minute before trying again.')
    }
    
    if (error.message?.includes('insufficient_quota')) {
      throw new Error('OpenAI quota exceeded. Please check your billing details on the OpenAI dashboard.')
    }

    if (error.message?.includes('model_not_found')) {
      throw new Error('The requested model is not available. Please try again later.')
    }

    throw error
  }
}