import FormData from 'form-data';
import { ApiKeyService } from '../security/api-key.service';
import { StorageService } from '../storage/storage.service';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-handler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
  format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
}

export interface SummaryOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface SummaryResult {
  summary: string;
  model: string;
  tokensUsed: number;
  cost: number;
}

export class OpenAIService {
  private apiKeyService: ApiKeyService;
  private storageService: StorageService;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKeyService = new ApiKeyService();
    this.storageService = new StorageService();
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  async transcribeAudio(
    userId: string,
    audioUrl: string,
    uploadId: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    let apiKeyId: string | undefined;

    try {
      // Get API key
      const apiKey = await this.apiKeyService.getKey(userId, 'openai');
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Get API key record for logging
      const apiKeyRecord = await prisma.apiKeyManagement.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: 'openai'
          }
        }
      });
      apiKeyId = apiKeyRecord?.id;

      // Download audio file
      logger.info('Downloading audio for transcription', { uploadId });
      const audioBuffer = await this.downloadAudioFromUrl(audioUrl);

      // Create form data
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg'
      });
      formData.append('model', 'whisper-1');
      
      if (options.language) {
        formData.append('language', options.language);
      }
      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }
      if (options.temperature !== undefined) {
        formData.append('temperature', options.temperature.toString());
      }
      if (options.format) {
        formData.append('response_format', options.format);
      } else {
        formData.append('response_format', 'verbose_json');
      }

      // Make API request
      logger.info('Calling OpenAI Whisper API', { uploadId });
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        logger.error('OpenAI API error', { uploadId, error, status: response.status });
        
        // Log failed usage
        if (apiKeyId) {
          await this.apiKeyService.logUsage(
            apiKeyId,
            '/audio/transcriptions',
            'POST',
            response.status,
            responseTime,
            undefined,
            undefined,
            error
          );
        }

        throw new Error(`OpenAI API error: ${error}`);
      }

      const result = await response.json() as any;

      // Calculate approximate tokens (rough estimate)
      const tokensUsed = Math.ceil(result.text.length / 4);
      const cost = tokensUsed * 0.00001; // Approximate cost

      // Log successful usage
      if (apiKeyId) {
        await this.apiKeyService.logUsage(
          apiKeyId,
          '/audio/transcriptions',
          'POST',
          200,
          responseTime,
          tokensUsed,
          cost
        );
      }

      // Format result
      const transcriptionResult: TranscriptionResult = {
        text: result.text,
        language: result.language,
        duration: result.duration
      };

      if (result.segments) {
        transcriptionResult.segments = result.segments.map((seg: any) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text
        }));
      }

      if (result.words) {
        transcriptionResult.words = result.words.map((word: any) => ({
          word: word.word,
          start: word.start,
          end: word.end,
          confidence: word.confidence
        }));
      }

      logger.info('Transcription completed', {
        uploadId,
        duration: result.duration,
        language: result.language,
        responseTime
      });

      return transcriptionResult;

    } catch (error) {
      logger.error('Transcription failed', { userId, uploadId, error });
      throw new Error(`Transcription failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Generate summary using GPT
   */
  async generateSummary(
    userId: string,
    text: string,
    uploadId: string,
    options: SummaryOptions = {}
  ): Promise<SummaryResult> {
    const startTime = Date.now();
    let apiKeyId: string | undefined;

    try {
      // Get API key
      const apiKey = await this.apiKeyService.getKey(userId, 'openai');
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Get API key record for logging
      const apiKeyRecord = await prisma.apiKeyManagement.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: 'openai'
          }
        }
      });
      apiKeyId = apiKeyRecord?.id;

      const model = options.model || 'gpt-3.5-turbo';
      const maxTokens = options.maxTokens || 500;
      const temperature = options.temperature || 0.7;

      const systemPrompt = options.systemPrompt || `You are a helpful assistant that creates concise summaries of transcribed audio content. 
Focus on the key points and main ideas. Structure the summary with:
- Main topics discussed
- Key takeaways
- Important details or action items
Keep the summary clear and well-organized.`;

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Please summarize the following transcription:\n\n${text}`
        }
      ];

      // Make API request
      logger.info('Calling OpenAI Chat API for summary', { uploadId, model });
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          n: 1
        })
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        logger.error('OpenAI API error', { uploadId, error, status: response.status });
        
        // Log failed usage
        if (apiKeyId) {
          await this.apiKeyService.logUsage(
            apiKeyId,
            '/chat/completions',
            'POST',
            response.status,
            responseTime,
            undefined,
            undefined,
            error
          );
        }

        throw new Error(`OpenAI API error: ${error}`);
      }

      const result = await response.json() as any;
      const summary = result.choices[0].message.content;
      const tokensUsed = result.usage.total_tokens;

      // Calculate cost based on model
      let cost = 0;
      if (model === 'gpt-3.5-turbo') {
        cost = (result.usage.prompt_tokens * 0.0015 + result.usage.completion_tokens * 0.002) / 1000;
      } else if (model === 'gpt-4') {
        cost = (result.usage.prompt_tokens * 0.03 + result.usage.completion_tokens * 0.06) / 1000;
      }

      // Log successful usage
      if (apiKeyId) {
        await this.apiKeyService.logUsage(
          apiKeyId,
          '/chat/completions',
          'POST',
          200,
          responseTime,
          tokensUsed,
          cost
        );
      }

      logger.info('Summary generated', {
        uploadId,
        model,
        tokensUsed,
        cost,
        responseTime
      });

      return {
        summary,
        model,
        tokensUsed,
        cost
      };

    } catch (error) {
      logger.error('Summary generation failed', { userId, uploadId, error });
      throw new Error(`Summary generation failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Download audio from URL
   */
  private async downloadAudioFromUrl(url: string): Promise<Buffer> {
    try {
      // If it's a storage URL, use the storage service
      if (url.includes('digitaloceanspaces.com') || url.includes('cdn.')) {
        const key = this.extractKeyFromUrl(url);
        return await this.storageService.downloadFile(key);
      }

      // Otherwise, download directly
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer;
    } catch (error) {
      logger.error('Failed to download audio', { url, error });
      throw new Error(`Failed to download audio: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Extract storage key from URL
   */
  private extractKeyFromUrl(url: string): string {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Remove leading slash
    if (path.startsWith('/')) {
      return path.substring(1);
    }
    
    return path;
  }

  /**
   * Analyze transcription for insights
   */
  async analyzeTranscription(
    userId: string,
    text: string,
    uploadId: string,
    analysisType: 'sentiment' | 'topics' | 'entities' | 'custom',
    customPrompt?: string
  ): Promise<any> {
    const options: SummaryOptions = {
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.5
    };

    switch (analysisType) {
      case 'sentiment':
        options.systemPrompt = `Analyze the sentiment of the following text. Provide:
- Overall sentiment (positive, negative, neutral)
- Sentiment score (0-100)
- Key emotional indicators
- Notable sentiment shifts`;
        break;

      case 'topics':
        options.systemPrompt = `Extract and analyze the main topics from the following text. Provide:
- List of main topics with brief descriptions
- Topic relevance scores
- Relationships between topics
- Suggested tags or categories`;
        break;

      case 'entities':
        options.systemPrompt = `Extract named entities from the following text. Identify:
- People mentioned
- Organizations
- Locations
- Dates and times
- Products or services
- Technical terms`;
        break;

      case 'custom':
        if (!customPrompt) {
          throw new Error('Custom prompt required for custom analysis');
        }
        options.systemPrompt = customPrompt;
        break;
    }

    const result = await this.generateSummary(userId, text, uploadId, options);
    
    return {
      type: analysisType,
      analysis: result.summary,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost
    };
  }
}