import { AudioProcessingResponse, TranscriptionResponse, SummaryResponse, KeyMoment } from '../types'

export async function processAudioWithOpenAI(file: File, apiKey: string): Promise<AudioProcessingResponse> {
  const startTime = Date.now()
  
  // Step 1: Transcribe audio with Whisper
  const transcript = await transcribeAudio(file, apiKey)
  
  // Step 2: Generate summary with GPT
  const summary = await generateSummary(transcript, apiKey)
  
  const processingTime = (Date.now() - startTime) / 1000
  
  return {
    transcript,
    summary,
    processing_time: Number(processingTime.toFixed(2))
  }
}

async function transcribeAudio(file: File, apiKey: string): Promise<TranscriptionResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Transcription failed: ${response.statusText}`)
  }

  const result = await response.json()
  return {
    text: result.text,
    language: result.language,
    duration: result.duration
  }
}

async function generateSummary(transcript: TranscriptionResponse, apiKey: string): Promise<SummaryResponse> {
  const prompt = `Analyze the following transcript and provide:
1. A concise summary (2-3 paragraphs)
2. Key moments with timestamps, titles, and descriptions

Please respond in JSON format with this structure:
{
    "summary": "Your summary here...",
    "key_moments": [
        {
            "timestamp": "00:05:30",
            "title": "Key point title",
            "description": "Brief description of what happens",
            "importance": "high|medium|low"
        }
    ]
}

Transcript to analyze:
${transcript.text}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing audio transcripts and extracting key insights. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Summary generation failed: ${response.statusText}`)
  }

  const result = await response.json()
  const content = result.choices[0].message.content
  
  try {
    const parsed = JSON.parse(content)
    return {
      summary: parsed.summary || 'Summary generation failed',
      key_moments: (parsed.key_moments || []).map((moment: any) => ({
        timestamp: moment.timestamp || '00:00:00',
        title: moment.title || 'Key Moment',
        description: moment.description || '',
        importance: moment.importance || 'medium'
      } as KeyMoment)),
      total_duration: transcript.duration,
      word_count: transcript.text.split(' ').length
    }
  } catch (e) {
    return {
      summary: content || 'Summary generation failed',
      key_moments: [],
      total_duration: transcript.duration,
      word_count: transcript.text.split(' ').length
    }
  }
}