const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

// Helper to handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Helper to parse request path
const getEndpoint = (event) => {
  const path = event.path.replace('/api/processing', '').replace('/.netlify/functions/processing', '');
  return path || '/';
};

// Helper to verify user token
const verifyUserToken = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.replace('Bearer ', '');
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate unique job ID
const generateJobId = () => {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get API key from user or environment
const getApiKey = async (userId, keyType = 'openai') => {
  try {
    // First try to get from user's encrypted storage
    const userKey = await prisma.userApiKey.findFirst({
      where: { userId, provider: keyType }
    });

    if (userKey) {
      // In production, decrypt the key
      return userKey.encryptedKey; // For now, assuming it's not encrypted
    }

    // Fall back to environment variable (for system keys)
    if (keyType === 'openai') {
      return process.env.OPENAI_API_KEY;
    }

    throw new Error(`No ${keyType} API key found`);
  } catch (error) {
    throw new Error(`Failed to get ${keyType} API key: ${error.message}`);
  }
};

// Transcribe audio using OpenAI Whisper
const transcribeAudio = async (filePath, apiKey, options = {}) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('Audio file not found');
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', options.model || 'whisper-1');
    
    if (options.language && options.language !== 'auto') {
      formData.append('language', options.language);
    }
    
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }
    
    if (options.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }

    formData.append('response_format', options.format || 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      transcript: result.text,
      language: result.language,
      duration: result.duration,
      segments: result.segments || [],
      confidence: result.segments ? 
        result.segments.reduce((avg, seg) => avg + (seg.avg_logprob || 0), 0) / result.segments.length : 
        undefined
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// Summarize text using OpenAI GPT
const summarizeText = async (text, apiKey, options = {}) => {
  try {
    const prompt = options.systemPrompt || `Please provide a concise summary of the following transcript. Extract key points, important decisions, and action items if any.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: `Transcript to summarize:\n\n${text}`
          }
        ],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      summary: result.choices[0]?.message?.content || '',
      tokensUsed: result.usage?.total_tokens || 0,
      cost: (result.usage?.total_tokens || 0) * 0.000002 // Rough estimate
    };
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
};

// Analyze text for insights
const analyzeText = async (text, apiKey, options = {}) => {
  try {
    const prompt = `Analyze the following transcript and provide:
1. Key topics discussed
2. Sentiment analysis
3. Speaker insights (if multiple speakers)
4. Action items or decisions made
5. Overall emotional tone

Format your response as JSON with these keys: topics, sentiment, speakerInsights, actionItems, emotionalTone`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: options.maxTokens || 1500,
        temperature: options.temperature || 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '{}';
    
    try {
      const analysis = JSON.parse(content);
      return {
        ...analysis,
        tokensUsed: result.usage?.total_tokens || 0,
        cost: (result.usage?.total_tokens || 0) * 0.000002
      };
    } catch (parseError) {
      // If JSON parsing fails, return raw content
      return {
        rawAnalysis: content,
        tokensUsed: result.usage?.total_tokens || 0,
        cost: (result.usage?.total_tokens || 0) * 0.000002
      };
    }
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
};

// Process job queue (simulate background processing)
const processJob = async (jobId) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { upload: true }
  });

  if (!job || !job.upload) {
    throw new Error('Job or upload not found');
  }

  try {
    // Update job to processing
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'processing',
        progress: 10
      }
    });

    const apiKey = await getApiKey(job.userId, 'openai');
    let results = {};

    // Step 1: Transcription
    if (job.type === 'transcription' || job.config?.operations?.includes('transcribe')) {
      await prisma.job.update({
        where: { id: jobId },
        data: { progress: 30 }
      });

      const transcriptionResult = await transcribeAudio(
        job.upload.storageUrl,
        apiKey,
        {
          language: job.config?.language,
          model: job.config?.model,
          temperature: job.config?.temperature,
          format: job.config?.format
        }
      );

      results.transcription = transcriptionResult;
    }

    // Step 2: Summary
    if (job.type === 'summary' || job.config?.operations?.includes('summarize')) {
      await prisma.job.update({
        where: { id: jobId },
        data: { progress: 60 }
      });

      if (results.transcription?.transcript) {
        const summaryResult = await summarizeText(
          results.transcription.transcript,
          apiKey,
          {
            model: job.config?.model,
            maxTokens: job.config?.maxTokens,
            temperature: job.config?.temperature,
            systemPrompt: job.config?.systemPrompt
          }
        );

        results.summary = summaryResult;
      }
    }

    // Step 3: Analysis
    if (job.type === 'analysis' || job.config?.operations?.includes('analyze')) {
      await prisma.job.update({
        where: { id: jobId },
        data: { progress: 80 }
      });

      if (results.transcription?.transcript) {
        const analysisResult = await analyzeText(
          results.transcription.transcript,
          apiKey,
          {
            model: job.config?.model,
            maxTokens: job.config?.maxTokens,
            temperature: job.config?.temperature
          }
        );

        results.analysis = analysisResult;
      }
    }

    // Complete the job
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        results: results,
        completedAt: new Date()
      }
    });

    return results;
  } catch (error) {
    // Mark job as failed
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: error.message
      }
    });

    throw error;
  }
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const endpoint = getEndpoint(event);
    const method = event.httpMethod;
    
    // Verify user authentication for all endpoints
    const decoded = verifyUserToken(event);
    const userId = decoded.userId;

    // Start processing
    if (endpoint === '/start' && method === 'POST') {
      const { uploadId, jobType, options = {} } = JSON.parse(event.body);
      
      if (!uploadId || !jobType) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Upload ID and job type are required' })
        };
      }

      // Verify upload exists and belongs to user
      const upload = await prisma.upload.findFirst({
        where: { id: uploadId, userId }
      });

      if (!upload) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Upload not found' })
        };
      }

      if (upload.status !== 'completed') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Upload not completed yet' })
        };
      }

      const jobId = generateJobId();
      
      // Create processing job
      const job = await prisma.job.create({
        data: {
          id: jobId,
          type: jobType,
          status: 'queued',
          progress: 0,
          userId,
          uploadId,
          projectId: upload.workspaceId, // Use workspace as project for now
          fileName: upload.filename,
          fileSize: upload.fileSize,
          config: options
        }
      });

      // Start processing in background (simulate async processing)
      // In production, this would be queued to a proper job queue like Bull/Redis
      setTimeout(async () => {
        try {
          await processJob(jobId);
        } catch (error) {
          console.error(`Background job ${jobId} failed:`, error);
        }
      }, 1000); // Start after 1 second

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          job: {
            jobId: job.id,
            status: job.status,
            progress: job.progress
          }
        })
      };
    }

    // Get job status
    if (endpoint.match(/^\/job\/[^\/]+$/) && method === 'GET') {
      const jobId = endpoint.split('/')[2];
      
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId },
        include: {
          project: { select: { name: true } },
          upload: { select: { filename: true } }
        }
      });

      if (!job) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Job not found' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          result: job.results,
          error: job.error,
          createdAt: job.createdAt,
          completedAt: job.completedAt
        })
      };
    }

    // List jobs
    if (endpoint === '/jobs' && method === 'GET') {
      const params = new URLSearchParams(event.queryStringParameters || {});
      const page = parseInt(params.get('page') || '1');
      const limit = parseInt(params.get('limit') || '20');
      const offset = (page - 1) * limit;
      const status = params.get('status');
      const jobType = params.get('jobType');
      const workspaceId = params.get('workspaceId');

      const where = { userId };
      if (status) where.status = status;
      if (jobType) where.type = jobType;
      if (workspaceId) where.projectId = workspaceId;

      const [jobs, totalJobs] = await Promise.all([
        prisma.job.findMany({
          where,
          include: {
            project: { select: { name: true } },
            upload: { select: { filename: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.job.count({ where })
      ]);

      const totalPages = Math.ceil(totalJobs / limit);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          data: jobs.map(job => ({
            id: job.id,
            type: job.type,
            status: job.status,
            progress: job.progress,
            fileName: job.fileName,
            projectName: job.project?.name || 'Default Project',
            createdAt: job.createdAt,
            completedAt: job.completedAt,
            error: job.error
          })),
          pagination: {
            page,
            limit,
            total: totalJobs,
            pages: totalPages
          }
        })
      };
    }

    // Cancel job
    if (endpoint.match(/^\/job\/[^\/]+$/) && method === 'DELETE') {
      const jobId = endpoint.split('/')[2];
      
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId }
      });

      if (!job) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Job not found' })
        };
      }

      if (['completed', 'failed'].includes(job.status)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Cannot cancel completed or failed job' })
        };
      }

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'cancelled',
          error: 'Cancelled by user'
        }
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      };
    }

    // Retry failed job
    if (endpoint.match(/^\/job\/[^\/]+\/retry$/) && method === 'POST') {
      const jobId = endpoint.split('/')[2];
      
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId }
      });

      if (!job) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Job not found' })
        };
      }

      if (job.status !== 'failed') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Only failed jobs can be retried' })
        };
      }

      // Reset job status
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'queued',
          progress: 0,
          error: null,
          results: null
        }
      });

      // Restart processing
      setTimeout(async () => {
        try {
          await processJob(jobId);
        } catch (error) {
          console.error(`Retry job ${jobId} failed:`, error);
        }
      }, 1000);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          job: {
            jobId: job.id,
            status: 'queued',
            progress: 0
          }
        })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Processing endpoint not found' })
    };

  } catch (error) {
    console.error('Processing function error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};