/**
 * Audio file splitting utilities to handle files larger than 25MB
 * for OpenAI Whisper API processing
 */

export interface AudioChunk {
  blob: Blob
  startTime: number
  endTime: number
  chunkIndex: number
  totalChunks: number
}

export interface SplitAudioResult {
  chunks: AudioChunk[]
  totalDuration: number
  originalSize: number
}

/**
 * Split audio file into chunks that fit within OpenAI's 25MB limit
 */
export async function splitAudioFile(file: File): Promise<SplitAudioResult> {
  const MAX_CHUNK_SIZE = 24 * 1024 * 1024 // 24MB to be safe
  
  // If file is already under limit, return as single chunk
  if (file.size <= MAX_CHUNK_SIZE) {
    const audioContext = new AudioContext()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    return {
      chunks: [{
        blob: file,
        startTime: 0,
        endTime: audioBuffer.duration,
        chunkIndex: 0,
        totalChunks: 1
      }],
      totalDuration: audioBuffer.duration,
      originalSize: file.size
    }
  }

  // For large files, we need to split them
  const audioContext = new AudioContext()
  const arrayBuffer = await file.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  
  // Estimate how many chunks we need based on file size
  const estimatedChunks = Math.ceil(file.size / MAX_CHUNK_SIZE)
  const chunkDuration = audioBuffer.duration / estimatedChunks
  
  const chunks: AudioChunk[] = []
  const sampleRate = audioBuffer.sampleRate
  const numberOfChannels = audioBuffer.numberOfChannels
  
  for (let i = 0; i < estimatedChunks; i++) {
    const startTime = i * chunkDuration
    const endTime = Math.min((i + 1) * chunkDuration, audioBuffer.duration)
    
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(endTime * sampleRate)
    const chunkLength = endSample - startSample
    
    // Create new audio buffer for this chunk
    const chunkBuffer = audioContext.createBuffer(
      numberOfChannels,
      chunkLength,
      sampleRate
    )
    
    // Copy audio data for this chunk
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const originalChannelData = audioBuffer.getChannelData(channel)
      const chunkChannelData = chunkBuffer.getChannelData(channel)
      
      for (let sample = 0; sample < chunkLength; sample++) {
        chunkChannelData[sample] = originalChannelData[startSample + sample]
      }
    }
    
    // Convert audio buffer to blob
    const blob = await audioBufferToBlob(chunkBuffer, file.type)
    
    chunks.push({
      blob,
      startTime,
      endTime,
      chunkIndex: i,
      totalChunks: estimatedChunks
    })
  }
  
  return {
    chunks,
    totalDuration: audioBuffer.duration,
    originalSize: file.size
  }
}

/**
 * Convert AudioBuffer to Blob
 */
async function audioBufferToBlob(audioBuffer: AudioBuffer, mimeType: string): Promise<Blob> {
  const numberOfChannels = audioBuffer.numberOfChannels
  const length = audioBuffer.length
  const sampleRate = audioBuffer.sampleRate
  
  // Create WAV file
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
  const view = new DataView(arrayBuffer)
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length * numberOfChannels * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * 2, true)
  view.setUint16(32, numberOfChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, length * numberOfChannels * 2, true)
  
  // Convert float samples to 16-bit PCM
  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]))
      view.setInt16(offset, sample * 0x7FFF, true)
      offset += 2
    }
  }
  
  return new Blob([arrayBuffer], { type: mimeType || 'audio/wav' })
}

/**
 * Merge transcription results from multiple chunks
 */
export function mergeTranscriptionResults(results: any[], chunks: AudioChunk[]): any {
  if (results.length === 1) {
    return results[0]
  }
  
  let mergedText = ''
  let mergedSegments: any[] = []
  let timeOffset = 0
  
  results.forEach((result, index) => {
    const chunk = chunks[index]
    
    // Add space between chunks
    if (index > 0) {
      mergedText += ' '
    }
    
    mergedText += result.text
    
    // Merge segments with adjusted timestamps
    if (result.segments) {
      result.segments.forEach((segment: any) => {
        mergedSegments.push({
          ...segment,
          start: segment.start + chunk.startTime,
          end: segment.end + chunk.startTime
        })
      })
    }
    
    timeOffset += chunk.endTime - chunk.startTime
  })
  
  return {
    text: mergedText,
    segments: mergedSegments,
    duration: chunks[chunks.length - 1].endTime
  }
}