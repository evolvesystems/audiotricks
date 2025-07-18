export interface ElevenLabsVoice {
  voice_id: string
  name: string
  preview_url: string
  category: string
  language: string
  description: string
  gender: 'male' | 'female' | 'neutral'
  age: 'young' | 'middle_aged' | 'old'
  accent: string
  use_case: string
}

export interface ElevenLabsSettings {
  stability: number // 0-1
  similarity_boost: number // 0-1
  style: number // 0-1
  use_speaker_boost: boolean
}

export const DEFAULT_ELEVENLABS_SETTINGS: ElevenLabsSettings = {
  stability: 0.5,
  similarity_boost: 0.8,
  style: 0.0,
  use_speaker_boost: true
}

// Popular ElevenLabs voices (will be fetched from API in production)
export const POPULAR_VOICES: ElevenLabsVoice[] = [
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    preview_url: '',
    category: 'premade',
    language: 'en',
    description: 'American, Young, Female',
    gender: 'female',
    age: 'young',
    accent: 'american',
    use_case: 'narration'
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    preview_url: '',
    category: 'premade',
    language: 'en',
    description: 'American, Young, Male',
    gender: 'male',
    age: 'young',
    accent: 'american',
    use_case: 'narration'
  },
  {
    voice_id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    preview_url: '',
    category: 'premade',
    language: 'en',
    description: 'American, Young, Female',
    gender: 'female',
    age: 'young',
    accent: 'american',
    use_case: 'narration'
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    preview_url: '',
    category: 'premade',
    language: 'en',
    description: 'American, Young, Male',
    gender: 'male',
    age: 'young',
    accent: 'american',
    use_case: 'narration'
  },
  {
    voice_id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    preview_url: '',
    category: 'premade',
    language: 'en',
    description: 'American, Middle-aged, Male',
    gender: 'male',
    age: 'middle_aged',
    accent: 'american',
    use_case: 'narration'
  },
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    preview_url: '',
    category: 'premade',
    language: 'en',
    description: 'American, Middle-aged, Male',
    gender: 'male',
    age: 'middle_aged',
    accent: 'american',
    use_case: 'narration'
  }
]

export async function getElevenLabsVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch voices')
    }
    
    const data = await response.json()
    
    return data.voices.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      preview_url: voice.preview_url,
      category: voice.category,
      language: voice.labels?.language || 'en',
      description: voice.labels?.description || '',
      gender: voice.labels?.gender || 'neutral',
      age: voice.labels?.age || 'middle_aged',
      accent: voice.labels?.accent || 'american',
      use_case: voice.labels?.use_case || 'general'
    }))
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error)
    return POPULAR_VOICES // Fallback to popular voices
  }
}

export async function generateSpeechWithElevenLabs(
  text: string,
  voiceId: string,
  apiKey: string,
  settings: ElevenLabsSettings = DEFAULT_ELEVENLABS_SETTINGS
): Promise<Blob> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style,
        use_speaker_boost: settings.use_speaker_boost
      }
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail?.message || `Speech generation failed: ${response.statusText}`)
  }

  return response.blob()
}

export async function generateSpeechFromTranscript(
  transcript: string,
  voiceId: string,
  apiKey: string,
  settings: ElevenLabsSettings = DEFAULT_ELEVENLABS_SETTINGS,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  // Split transcript into chunks for better processing
  const maxChunkSize = 5000 // ElevenLabs has text limits
  const chunks: string[] = []
  
  let currentChunk = ''
  const sentences = transcript.split(/[.!?]+/)
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = sentence
    } else {
      currentChunk += sentence + '. '
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  // Generate speech for each chunk
  const audioBlobs: Blob[] = []
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    onProgress?.(i / chunks.length)
    
    try {
      const audioBlob = await generateSpeechWithElevenLabs(chunk, voiceId, apiKey, settings)
      audioBlobs.push(audioBlob)
    } catch (error) {
      console.error(`Error generating speech for chunk ${i + 1}:`, error)
      throw error
    }
  }
  
  onProgress?.(1)
  
  // Combine all audio blobs
  const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' })
  return combinedBlob
}