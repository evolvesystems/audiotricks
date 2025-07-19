import { TranscriptionResponse } from '../../types'
import { splitAudioFile, mergeTranscriptionResults } from '../audioSplitter'
import { MAX_FILE_SIZE } from './types'
import { logger } from '../logger'

/**
 * Transcribes audio using OpenAI Whisper, automatically handling large files by splitting
 */
export async function transcribeAudio(
  file: File, 
  apiKey: string, 
  signal?: AbortSignal,
  onChunkProgress?: (current: number, total: number) => void
): Promise<TranscriptionResponse> {
  // Check if file is larger than 25MB (OpenAI's limit) and needs splitting
  if (file.size > MAX_FILE_SIZE) {
    logger.log(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit, splitting into chunks...`)
    
    try {
      return await transcribeWithSplitting(file, apiKey, signal, onChunkProgress)
    } catch (error) {
      logger.error('Error splitting/processing large audio file:', error)
      throw createTranscriptionError(error)
    }
  }
  
  // For normal-sized files, use the original method
  return await transcribeAudioChunk(file, apiKey, signal)
}

/**
 * Handles transcription of large files by splitting them into chunks
 */
async function transcribeWithSplitting(
  file: File, 
  apiKey: string, 
  signal?: AbortSignal,
  onChunkProgress?: (current: number, total: number) => void
): Promise<TranscriptionResponse> {
  const splitResult = await splitAudioFile(file)
  const transcriptionResults = []
  
  logger.log(`Split into ${splitResult.chunks.length} chunks, total duration: ${splitResult.totalDuration.toFixed(2)}s`)
  
  // Process each chunk with better error handling and progress reporting
  for (let i = 0; i < splitResult.chunks.length; i++) {
    const chunk = splitResult.chunks[i]
    logger.log(`Processing chunk ${i + 1}/${splitResult.chunks.length} (${(chunk.blob.size / 1024 / 1024).toFixed(2)}MB)`)
    
    // Report progress before processing chunk
    onChunkProgress?.(i, splitResult.chunks.length)
    
    try {
      const chunkResult = await transcribeAudioChunk(chunk.blob, apiKey, signal)
      transcriptionResults.push(chunkResult)
      logger.log(`✓ Chunk ${i + 1} completed successfully`)
      
      // Report progress after successful chunk completion
      onChunkProgress?.(i + 1, splitResult.chunks.length)
    } catch (chunkError) {
      logger.error(`✗ Chunk ${i + 1} failed:`, chunkError)
      // For now, we'll skip failed chunks and continue
      transcriptionResults.push({
        text: `[Chunk ${i + 1} failed to process]`,
        segments: [],
        duration: chunk.endTime - chunk.startTime
      })
      
      // Still report progress even for failed chunks
      onChunkProgress?.(i + 1, splitResult.chunks.length)
    }
  }
  
  // Merge results
  const mergedResult = mergeTranscriptionResults(transcriptionResults, splitResult.chunks)
  
  return {
    text: mergedResult.text,
    segments: mergedResult.segments,
    duration: splitResult.totalDuration
  }
}

/**
 * Transcribes a single audio chunk using OpenAI Whisper API
 */
export async function transcribeAudioChunk(file: File, apiKey: string, signal?: AbortSignal): Promise<any> {
  const formData = new FormData()
  
  // Check if this is a URL submission
  if ((file as any).isUrl && (file as any).originalUrl) {
    const audioUrl = (file as any).originalUrl
    
    try {
      const response = await fetch(audioUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch audio from URL')
      }
      const blob = await response.blob()
      const audioFile = new File([blob], 'audio.mp3', { type: blob.type || 'audio/mpeg' })
      formData.append('file', audioFile)
    } catch (error) {
      throw new Error('Unable to fetch audio from URL. Please download and upload the file directly.')
    }
  } else {
    formData.append('file', file)
  }
  
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData,
    signal
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Transcription failed: ${response.statusText}`)
  }

  const result = await response.json()
  return {
    text: result.text,
    language: result.language,
    duration: result.duration,
    segments: result.segments || []
  }
}

/**
 * Creates appropriate error messages for transcription failures
 */
function createTranscriptionError(error: any): Error {
  if (error.message && error.message.includes('decode')) {
    return new Error('Failed to decode audio file. Please ensure the file is a valid audio format and try again.')
  } else if (error.message && error.message.includes('memory')) {
    return new Error('File too large for browser memory. Please try a smaller file or compress your audio.')
  } else {
    return new Error('Failed to process large audio file. Please try a smaller file or compress your audio.')
  }
}