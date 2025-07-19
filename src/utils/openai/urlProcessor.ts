import { AudioProcessingResponse } from '../../types'
import { SummaryStyle } from '../../components/SummaryStyleSelector'
import { GPTSettings } from './types'
import { processAudioWithOpenAI } from './processor'
import { logger } from '../logger'

/**
 * Processes audio from a URL by downloading it and then processing with OpenAI
 */
export async function processAudioFromUrl(
  url: string, 
  apiKey: string, 
  summaryStyle: SummaryStyle = 'formal',
  language: string = 'en',
  onProgress?: (stage: 'uploading' | 'transcribing' | 'summarizing', chunkProgress?: { current: number; total: number }) => void,
  gptSettings?: GPTSettings,
  signal?: AbortSignal,
  onFileSize?: (size: number) => void
): Promise<AudioProcessingResponse> {
  try {
    let blob: Blob
    let fileSize: number | undefined
    
    // Try direct fetch first
    try {
      const response = await fetch(url, { signal })
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      blob = await response.blob()
      fileSize = blob.size
      onFileSize?.(fileSize)
    } catch (directError: any) {
      if (signal?.aborted) throw new Error('aborted')
      logger.warn('Direct fetch failed, trying proxy:', directError)
      
      blob = await tryProxyUrls(url, signal, onProgress, onFileSize)
    }
    
    const file = new File([blob!], url.split('/').pop() || 'audio.mp3', { type: blob!.type || 'audio/mpeg' })
    
    // Check file size
    if (file.size > 150 * 1024 * 1024) {
      throw new Error('Audio file is too large. Maximum size is 150MB.')
    }
    
    // Process with existing function
    onProgress?.('transcribing')
    const result = await processAudioWithOpenAI(file, apiKey, summaryStyle, language, onProgress, gptSettings, signal)
    
    // Add file size to the result for display
    return {
      ...result,
      audioFile: file,
      fileSize: file.size
    }
  } catch (error: any) {
    logger.error('Audio fetch error:', error)
    throw error
  }
}

/**
 * Attempts to fetch audio using various CORS proxy services
 */
async function tryProxyUrls(
  url: string, 
  signal?: AbortSignal, 
  onProgress?: (stage: 'uploading' | 'transcribing' | 'summarizing') => void,
  onFileSize?: (size: number) => void
): Promise<Blob> {
  const proxyUrls = [
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`,
    `https://proxy.cors.sh/${url}`
  ]
  
  for (const proxyUrl of proxyUrls) {
    try {
      onProgress?.('uploading')
      const proxyResponse = await fetch(proxyUrl, { signal })
      if (proxyResponse.ok) {
        const blob = await proxyResponse.blob()
        onFileSize?.(blob.size)
        return blob
      }
    } catch (proxyError) {
      if (signal?.aborted) throw new Error('aborted')
      logger.warn(`Proxy ${proxyUrl} failed:`, proxyError)
    }
  }
  
  const isDomainIssue = url.includes('evolvepreneur.net') || url.includes('cdn')
  throw new Error(
    'Cannot access this URL due to CORS restrictions.\n\n' +
    'This usually happens with:\n' +
    '• Files from certain podcast hosts\n' +
    '• Private or authenticated URLs\n' +
    '• Some CDN services (like this one)\n\n' +
    (isDomainIssue 
      ? 'This appears to be a CDN-hosted file. The server doesn\'t allow direct browser access.\n\n'
      : ''
    ) +
    'Solutions:\n' +
    '1. Right-click the link and "Save As" to download the file\n' +
    '2. Then upload it directly using the file upload option\n' +
    '3. The file will process normally once uploaded directly'
  )
}