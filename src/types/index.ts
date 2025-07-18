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

export interface TranscriptionResponse {
  text: string
  language?: string
  duration?: number
}

export interface KeyMoment {
  timestamp: string
  title: string
  description: string
  importance: 'high' | 'medium' | 'low'
}

export interface SummaryResponse {
  summary: string
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
}