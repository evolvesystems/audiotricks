export interface User {
  username: string
  role: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
}

export interface TranscriptionSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

export interface TranscriptionResponse {
  text: string
  language?: string
  duration?: number
  segments?: TranscriptionSegment[]
}

export interface KeyMoment {
  timestamp: string
  title: string
  description: string
  importance: 'high' | 'medium' | 'low'
}

export interface SummaryResponse {
  summary: string
  takeaways: string[]
  key_moments: KeyMoment[]
  total_duration?: number
  word_count: number
  language?: string
}

export interface AudioProcessingResponse {
  transcript: TranscriptionResponse
  summary: SummaryResponse
  processing_time: number
  audioUrl?: string
  audioFile?: File
  fileSize?: number
  id?: string
  originalId?: string
  title?: string
  duration?: number
  wordCount?: number
  language?: string
}