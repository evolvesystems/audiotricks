// API proxy service for secure API calls through backend
import { logger } from '../utils/logger';

interface TranscriptionRequest {
  audioFile: File;
  prompt?: string;
  language?: string;
}

interface TranscriptionResponse {
  text: string;
  duration?: number;
}

interface TextToSpeechRequest {
  text: string;
  voice: string;
  model?: string;
}

class ApiProxyService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async makeProxyRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/proxy${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(error.message || `API request failed with status ${response.status}`);
    }

    return response.json();
  }

  async transcribeAudio(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('audio', request.audioFile);
    if (request.prompt) formData.append('prompt', request.prompt);
    if (request.language) formData.append('language', request.language);

    try {
      // Try backend proxy first
      return await this.makeProxyRequest<TranscriptionResponse>('/openai/transcription', {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      // Fall back to direct API call if backend not ready
      logger.warn('Backend proxy not available, falling back to direct API call');
      
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        throw new Error('OpenAI API key not found');
      }

      const openAIFormData = new FormData();
      openAIFormData.append('file', request.audioFile);
      openAIFormData.append('model', 'whisper-1');
      if (request.prompt) openAIFormData.append('prompt', request.prompt);
      if (request.language) openAIFormData.append('language', request.language);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: openAIFormData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Transcription failed' } }));
        throw new Error(error.error?.message || 'Transcription failed');
      }

      return response.json();
    }
  }

  async generateSummary(transcript: string, summaryType: string): Promise<string> {
    try {
      // Try backend proxy first
      const response = await this.makeProxyRequest<{ summary: string }>('/openai/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript, summaryType })
      });
      
      return response.summary;
    } catch (error) {
      // Fall back to direct API call if backend not ready
      logger.warn('Backend proxy not available, falling back to direct API call');
      
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        throw new Error('OpenAI API key not found');
      }

      // Implementation would go here for direct OpenAI API call
      // For now, throw error to indicate backend is required
      throw new Error('Summary generation requires backend API proxy');
    }
  }

  async textToSpeech(request: TextToSpeechRequest): Promise<ArrayBuffer> {
    try {
      // Try backend proxy first
      const response = await fetch('/api/proxy/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Text-to-speech request failed');
      }

      return response.arrayBuffer();
    } catch (error) {
      // Fall back to direct API call if backend not ready
      logger.warn('Backend proxy not available, falling back to direct API call');
      
      const apiKey = localStorage.getItem('elevenlabs_api_key');
      if (!apiKey) {
        throw new Error('ElevenLabs API key not found');
      }

      // Implementation would go here for direct ElevenLabs API call
      // For now, throw error to indicate backend is required
      throw new Error('Text-to-speech requires backend API proxy');
    }
  }
}

export const apiProxy = new ApiProxyService();