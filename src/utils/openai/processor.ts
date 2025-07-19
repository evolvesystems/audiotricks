import { AudioProcessingResponse } from '../../types'
import { SummaryStyle } from '../../components/SummaryStyleSelector'
import { GPTSettings } from './types'
import { transcribeAudio } from './transcription'
import { generateSummary } from './summary'

/**
 * Main function to process audio with OpenAI - transcribes then summarizes
 */
export async function processAudioWithOpenAI(
  file: File, 
  apiKey: string, 
  summaryStyle: SummaryStyle = 'formal',
  language: string = 'en',
  onProgress?: (stage: 'uploading' | 'transcribing' | 'summarizing', chunkProgress?: { current: number; total: number }) => void,
  gptSettings?: GPTSettings,
  signal?: AbortSignal
): Promise<AudioProcessingResponse> {
  const startTime = Date.now()
  
  // Step 1: Transcribe audio with Whisper
  onProgress?.('transcribing')
  const transcript = await transcribeAudio(file, apiKey, signal, (current, total) => {
    onProgress?.('transcribing', { current, total })
  })
  
  // Step 2: Generate summary with GPT
  onProgress?.('summarizing')
  const summary = await generateSummary(transcript, apiKey, summaryStyle, language, gptSettings, signal)
  
  const processingTime = (Date.now() - startTime) / 1000
  
  return {
    transcript,
    summary,
    processing_time: Number(processingTime.toFixed(2)),
    audioFile: file,
    fileSize: file.size
  }
}