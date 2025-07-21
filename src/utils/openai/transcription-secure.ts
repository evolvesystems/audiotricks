// Secure transcription using API proxy service
import { TranscriptionResponse } from '../../types'
import { splitAudioFile, mergeTranscriptionResults } from '../audioSplitter'
import { MAX_FILE_SIZE } from './types'
import { logger } from '../logger'
import { apiProxy } from '../../services/apiProxy'

/**
 * Transcribes audio using secure API proxy
 */
export async function transcribeAudioSecure(
  file: File, 
  signal?: AbortSignal,
  onChunkProgress?: (current: number, total: number) => void
): Promise<TranscriptionResponse> {
  // Check if file is larger than 25MB (OpenAI's limit) and needs splitting
  if (file.size > MAX_FILE_SIZE) {
    logger.log(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit, splitting into chunks...`)
    
    try {
      return await transcribeWithSplittingSecure(file, signal, onChunkProgress)
    } catch (error) {
      logger.error('Error splitting/processing large audio file:', error)
      throw createTranscriptionError(error)
    }
  }
  
  // For normal-sized files, use the proxy service
  try {
    const result = await apiProxy.transcribeAudio({
      audioFile: file,
      language: 'en' // TODO: Make this configurable
    })
    
    return {
      text: result.text,
      duration: result.duration || 0
    }
  } catch (error) {
    throw createTranscriptionError(error)
  }
}

/**
 * Handles transcription of large files by splitting them into chunks
 */
async function transcribeWithSplittingSecure(
  file: File, 
  signal?: AbortSignal,
  onChunkProgress?: (current: number, total: number) => void
): Promise<TranscriptionResponse> {
  const splitResult = await splitAudioFile(file)
  const transcriptionResults = []
  
  logger.log(`Split into ${splitResult.chunks.length} chunks, total duration: ${splitResult.totalDuration.toFixed(2)}s`)
  
  // Process each chunk
  for (let i = 0; i < splitResult.chunks.length; i++) {
    const chunk = splitResult.chunks[i]
    logger.log(`Processing chunk ${i + 1}/${splitResult.chunks.length} (${(chunk.blob.size / 1024 / 1024).toFixed(2)}MB)`)
    
    // Report progress before processing chunk
    if (onChunkProgress) {
      onChunkProgress(i + 1, splitResult.chunks.length)
    }
    
    // Check if cancelled
    if (signal?.aborted) {
      throw new Error('Transcription aborted')
    }
    
    try {
      // Create a File object from the blob chunk
      const chunkFile = new File([chunk.blob], `chunk_${i}.mp3`, { type: chunk.blob.type })
      
      const result = await apiProxy.transcribeAudio({
        audioFile: chunkFile,
        language: 'en'
      })
      
      transcriptionResults.push({
        text: result.text,
        duration: chunk.duration
      })
    } catch (error) {
      logger.error(`Error transcribing chunk ${i + 1}:`, error)
      throw error
    }
  }
  
  // Merge all transcription results
  return mergeTranscriptionResults(transcriptionResults, splitResult.totalDuration)
}

function createTranscriptionError(error: any): Error {
  const message = error.message || 'Transcription failed'
  
  if (message.includes('401') || message.includes('Unauthorized') || message.includes('Incorrect API key')) {
    return new Error('Invalid API key. Please check your OpenAI API key and try again.')
  }
  
  if (message.includes('429') || message.includes('Rate limit')) {
    return new Error('OpenAI rate limit exceeded. Please wait a minute and try again.')
  }
  
  if (message.includes('503') || message.includes('Service Unavailable')) {
    return new Error('OpenAI service is temporarily unavailable. Please try again later.')
  }
  
  if (message.includes('Network') || message.includes('fetch')) {
    return new Error('Network error. Please check your internet connection and try again.')
  }
  
  if (message.includes('aborted') || message.includes('AbortError')) {
    return new Error('Transcription was cancelled.')
  }
  
  return new Error(`Transcription failed: ${message}`)
}