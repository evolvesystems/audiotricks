import { PrismaClient } from '@prisma/client';
import { OpenAIService } from '../integrations/openai.service';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

/**
 * Audio content analysis service using OpenAI GPT
 */
export class AnalysisService {
  private prisma: PrismaClient;
  private openAIService: OpenAIService;

  constructor() {
    this.prisma = new PrismaClient();
    this.openAIService = new OpenAIService();
  }

  /**
   * Perform content analysis on transcribed text
   */
  async performAnalysis(job: any): Promise<any> {
    try {
      logger.info('Starting content analysis', { jobId: job.id });

      if (!job.transcriptionData?.text) {
        throw new Error('No transcription data available for analysis');
      }

      // Update job status
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'analyzing',
          updatedAt: new Date()
        }
      });

      // Get API key for analysis
      const apiKey = await this.getOpenAIKey(job.userId, job.workspaceId);
      if (!apiKey) {
        throw new Error('No OpenAI API key available for analysis');
      }

      const transcriptionText = job.transcriptionData.text;
      
      // Perform comprehensive analysis
      const analysisPrompt = this.buildAnalysisPrompt(transcriptionText, job.config);
      
      const analysisResult = await this.openAIService.generateCompletion({
        apiKey: apiKey,
        model: job.config?.analysisModel || 'gpt-4',
        prompt: analysisPrompt,
        maxTokens: job.config?.maxTokens || 2000,
        temperature: job.config?.temperature || 0.3
      });

      // Extract structured data from analysis
      const structuredAnalysis = this.parseAnalysisResult(analysisResult.text);

      // Update job with analysis results
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'analyzed',
          analysisData: {
            ...structuredAnalysis,
            rawAnalysis: analysisResult.text,
            tokens: analysisResult.usage
          },
          updatedAt: new Date()
        }
      });

      logger.info('Content analysis completed', { 
        jobId: job.id,
        topics: structuredAnalysis.topics?.length || 0,
        sentiment: structuredAnalysis.sentiment
      });

      return structuredAnalysis;
    } catch (error) {
      logger.error('Content analysis failed:', error);
      
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorMessage: getErrorMessage(error),
          updatedAt: new Date()
        }
      });

      throw new Error(`Analysis failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Perform summarization on transcribed text
   */
  async performSummarization(job: any): Promise<any> {
    try {
      logger.info('Starting summarization', { jobId: job.id });

      if (!job.transcriptionData?.text) {
        throw new Error('No transcription data available for summarization');
      }

      // Update job status
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'summarizing',
          updatedAt: new Date()
        }
      });

      // Get API key for summarization
      const apiKey = await this.getOpenAIKey(job.userId, job.workspaceId);
      if (!apiKey) {
        throw new Error('No OpenAI API key available for summarization');
      }

      const transcriptionText = job.transcriptionData.text;
      
      // Build summarization prompt
      const summaryPrompt = this.buildSummarizationPrompt(transcriptionText, job.config);
      
      const summaryResult = await this.openAIService.generateCompletion({
        apiKey: apiKey,
        model: job.config?.summaryModel || 'gpt-4',
        prompt: summaryPrompt,
        maxTokens: job.config?.summaryMaxTokens || 500,
        temperature: job.config?.summaryTemperature || 0.3
      });

      // Update job with summary results
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'summarized',
          summaryData: {
            summary: summaryResult.text,
            tokens: summaryResult.usage,
            length: summaryResult.text.length
          },
          updatedAt: new Date()
        }
      });

      logger.info('Summarization completed', { 
        jobId: job.id,
        summaryLength: summaryResult.text.length
      });

      return {
        summary: summaryResult.text,
        tokens: summaryResult.usage
      };
    } catch (error) {
      logger.error('Summarization failed:', error);
      
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorMessage: getErrorMessage(error),
          updatedAt: new Date()
        }
      });

      throw new Error(`Summarization failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Build analysis prompt based on configuration
   */
  private buildAnalysisPrompt(text: string, config: any = {}): string {
    const analysisTypes = config.analysisTypes || ['summary', 'topics', 'sentiment', 'entities'];
    
    let prompt = `Please analyze the following transcribed audio content and provide:\n\n`;
    
    if (analysisTypes.includes('summary')) {
      prompt += `1. SUMMARY: A concise summary of the main points\n`;
    }
    
    if (analysisTypes.includes('topics')) {
      prompt += `2. TOPICS: Key topics and themes discussed\n`;
    }
    
    if (analysisTypes.includes('sentiment')) {
      prompt += `3. SENTIMENT: Overall sentiment analysis (positive/negative/neutral)\n`;
    }
    
    if (analysisTypes.includes('entities')) {
      prompt += `4. ENTITIES: Important people, places, organizations mentioned\n`;
    }
    
    if (analysisTypes.includes('action_items')) {
      prompt += `5. ACTION ITEMS: Any action items or tasks mentioned\n`;
    }
    
    prompt += `\nTranscribed Content:\n${text}\n\n`;
    prompt += `Please format your response with clear sections for each analysis type requested.`;
    
    return prompt;
  }

  /**
   * Build summarization prompt
   */
  private buildSummarizationPrompt(text: string, config: any = {}): string {
    const summaryStyle = config.summaryStyle || 'concise';
    const summaryLength = config.summaryLength || 'medium';
    
    let prompt = `Please provide a ${summaryStyle} ${summaryLength} summary of the following transcribed audio content:\n\n`;
    prompt += `${text}\n\n`;
    prompt += `Summary should be well-structured and capture the main points discussed.`;
    
    return prompt;
  }

  /**
   * Parse structured analysis result from AI response
   */
  private parseAnalysisResult(analysisText: string): any {
    try {
      const analysis: any = {
        summary: '',
        topics: [],
        sentiment: 'neutral',
        entities: {},
        actionItems: []
      };

      // Extract summary
      const summaryMatch = analysisText.match(/(?:SUMMARY|Summary):\s*(.*?)(?=\n\s*(?:\d+\.|[A-Z]+:|$))/s);
      if (summaryMatch) {
        analysis.summary = summaryMatch[1].trim();
      }

      // Extract topics
      analysis.topics = this.extractTopics(analysisText);

      // Extract sentiment
      const sentimentMatch = analysisText.match(/(?:SENTIMENT|Sentiment):\s*(positive|negative|neutral)/i);
      if (sentimentMatch) {
        analysis.sentiment = sentimentMatch[1].toLowerCase();
      }

      // Extract entities
      analysis.entities = this.extractEntities(analysisText);

      return analysis;
    } catch (error) {
      logger.error('Error parsing analysis result:', error);
      return {
        summary: analysisText,
        topics: [],
        sentiment: 'neutral',
        entities: {},
        actionItems: []
      };
    }
  }

  /**
   * Extract topics from analysis text
   */
  private extractTopics(analysisText: string): string[] {
    const topics: string[] = [];
    
    // Look for topics section
    const topicsMatch = analysisText.match(/(?:TOPICS|Topics):\s*(.*?)(?=\n\s*(?:\d+\.|[A-Z]+:|$))/s);
    if (topicsMatch) {
      const topicsText = topicsMatch[1];
      const topicLines = topicsText.split('\n').filter(line => line.trim());
      
      topicLines.forEach(line => {
        const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
        if (cleanLine) {
          topics.push(cleanLine);
        }
      });
    }
    
    return topics;
  }

  /**
   * Extract entities from analysis text
   */
  private extractEntities(analysisText: string): Record<string, string[]> {
    const entities: Record<string, string[]> = {
      people: [],
      places: [],
      organizations: []
    };

    // Look for entities section
    const entitiesMatch = analysisText.match(/(?:ENTITIES|Entities):\s*(.*?)(?=\n\s*(?:\d+\.|[A-Z]+:|$))/s);
    if (entitiesMatch) {
      const entitiesText = entitiesMatch[1];
      
      // Extract people
      const peopleMatch = entitiesText.match(/(?:People|PEOPLE):\s*(.*?)(?=\n\s*(?:Places|Organizations|$))/s);
      if (peopleMatch) {
        entities.people = this.parseEntityList(peopleMatch[1]);
      }
      
      // Extract places
      const placesMatch = entitiesText.match(/(?:Places|PLACES):\s*(.*?)(?=\n\s*(?:Organizations|$))/s);
      if (placesMatch) {
        entities.places = this.parseEntityList(placesMatch[1]);
      }
      
      // Extract organizations
      const orgsMatch = entitiesText.match(/(?:Organizations|ORGANIZATIONS):\s*(.*?)$/s);
      if (orgsMatch) {
        entities.organizations = this.parseEntityList(orgsMatch[1]);
      }
    }

    return entities;
  }

  /**
   * Parse comma-separated entity list
   */
  private parseEntityList(text: string): string[] {
    return text.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * Get OpenAI API key for user/workspace
   */
  private async getOpenAIKey(userId: string, workspaceId?: string | null): Promise<string | null> {
    try {
      // First try workspace-level API key
      if (workspaceId) {
        const workspaceKey = await this.prisma.apiKey.findFirst({
          where: {
            workspaceId,
            service: 'openai',
            isActive: true
          },
          orderBy: { createdAt: 'desc' }
        });

        if (workspaceKey) {
          return workspaceKey.encryptedKey; // This would be decrypted in practice
        }
      }

      // Fallback to user-level API key
      const userKey = await this.prisma.apiKey.findFirst({
        where: {
          userId,
          service: 'openai',
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return userKey ? userKey.encryptedKey : null;
    } catch (error) {
      logger.error('Error getting OpenAI API key:', error);
      return null;
    }
  }
}