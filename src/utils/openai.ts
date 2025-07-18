import { AudioProcessingResponse, TranscriptionResponse, SummaryResponse, KeyMoment } from '../types'
import { splitAudioFile, mergeTranscriptionResults } from './audioSplitter'
import { SummaryStyle } from '../components/SummaryStyleSelector'

export interface GPTSettings {
  temperature?: number
  maxTokens?: number
}

export async function processAudioFromUrl(
  url: string, 
  apiKey: string, 
  summaryStyle: SummaryStyle = 'formal',
  language: string = 'en',
  onProgress?: (stage: 'uploading' | 'transcribing' | 'summarizing') => void,
  gptSettings?: GPTSettings
): Promise<AudioProcessingResponse> {
  const startTime = Date.now()
  
  try {
    let blob: Blob
    let usedProxy = false
    
    // Try direct fetch first
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      blob = await response.blob()
    } catch (directError: any) {
      console.warn('Direct fetch failed, trying proxy:', directError)
      
      // Try using a public CORS proxy
      const proxyUrls = [
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      ]
      
      let proxySuccess = false
      for (const proxyUrl of proxyUrls) {
        try {
          onProgress?.('uploading')
          const proxyResponse = await fetch(proxyUrl)
          if (proxyResponse.ok) {
            blob = await proxyResponse.blob()
            usedProxy = true
            proxySuccess = true
            console.log('Successfully fetched via proxy')
            break
          }
        } catch (proxyError) {
          console.warn(`Proxy ${proxyUrl} failed:`, proxyError)
        }
      }
      
      if (!proxySuccess) {
        throw new Error(
          'Cannot access this URL. The audio file is blocked by CORS restrictions. ' +
          'Please download the file to your computer and upload it directly.'
        )
      }
    }
    
    const file = new File([blob!], url.split('/').pop() || 'audio.mp3', { type: blob!.type || 'audio/mpeg' })
    
    // Check file size
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('Audio file is too large. Maximum size is 100MB.')
    }
    
    // Step 2: Process with existing function
    return processAudioWithOpenAI(file, apiKey, summaryStyle, language, onProgress, gptSettings)
  } catch (error: any) {
    console.error('Audio fetch error:', error)
    // Pass through the error message
    throw error
  }
}

export async function processAudioWithOpenAI(
  file: File, 
  apiKey: string, 
  summaryStyle: SummaryStyle = 'formal',
  language: string = 'en',
  onProgress?: (stage: 'uploading' | 'transcribing' | 'summarizing') => void,
  gptSettings?: GPTSettings
): Promise<AudioProcessingResponse> {
  const startTime = Date.now()
  
  // Step 1: Transcribe audio with Whisper
  onProgress?.('transcribing')
  const transcript = await transcribeAudio(file, apiKey)
  
  // Step 2: Generate summary with GPT
  onProgress?.('summarizing')
  const summary = await generateSummary(transcript, apiKey, summaryStyle, language, gptSettings)
  
  const processingTime = (Date.now() - startTime) / 1000
  
  return {
    transcript,
    summary,
    processing_time: Number(processingTime.toFixed(2)),
    audioFile: file
  }
}

async function transcribeAudio(file: File, apiKey: string): Promise<TranscriptionResponse> {
  // Check if file is larger than 25MB and needs splitting
  const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
  
  if (file.size > MAX_FILE_SIZE) {
    console.log(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit, splitting into chunks...`)
    
    try {
      const splitResult = await splitAudioFile(file)
      const transcriptionResults = []
      
      // Process each chunk
      for (let i = 0; i < splitResult.chunks.length; i++) {
        const chunk = splitResult.chunks[i]
        console.log(`Processing chunk ${i + 1}/${splitResult.chunks.length} (${(chunk.blob.size / 1024 / 1024).toFixed(2)}MB)`)
        
        const chunkResult = await transcribeAudioChunk(chunk.blob, apiKey)
        transcriptionResults.push(chunkResult)
      }
      
      // Merge results
      const mergedResult = mergeTranscriptionResults(transcriptionResults, splitResult.chunks)
      
      return {
        text: mergedResult.text,
        segments: mergedResult.segments,
        duration: splitResult.totalDuration
      }
    } catch (error) {
      console.error('Error splitting/processing large audio file:', error)
      throw new Error('Failed to process large audio file. Please try a smaller file or compress your audio.')
    }
  }
  
  // For normal-sized files, use the original method
  return await transcribeAudioChunk(file, apiKey)
}

async function transcribeAudioChunk(file: File, apiKey: string): Promise<any> {
  const formData = new FormData()
  
  // Check if this is a URL submission
  if ((file as any).isUrl && (file as any).originalUrl) {
    // For URLs, we need to fetch the audio first or use a different approach
    const audioUrl = (file as any).originalUrl
    
    try {
      // Try to fetch the audio file
      const response = await fetch(audioUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch audio from URL')
      }
      const blob = await response.blob()
      const audioFile = new File([blob], 'audio.mp3', { type: blob.type || 'audio/mpeg' })
      formData.append('file', audioFile)
    } catch (error) {
      // If direct fetch fails, we can try sending the URL to a transcription service
      // that can handle URLs directly (some APIs support this)
      throw new Error('Unable to fetch audio from URL. Please download and upload the file directly.')
    }
  } else {
    formData.append('file', file)
  }
  
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

export async function generateSummary(
  transcript: TranscriptionResponse, 
  apiKey: string, 
  summaryStyle: SummaryStyle = 'formal',
  language: string = 'en',
  gptSettings?: GPTSettings
): Promise<SummaryResponse> {
  const styleInstructions = {
    formal: 'Use a formal, technical, and analytical tone. Be precise and professional.',
    creative: 'Use a creative, friendly, and engaging tone. Make it interesting and accessible.',
    conversational: 'Use a natural, casual, and conversational tone. Write as if explaining to a friend.'
  }
  
  const languageMap: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese'
  }
  const prompt = `You are an expert content analyst specializing in extracting actionable insights from audio content. Analyze the following transcript and provide a comprehensive summary with key takeaways.

Instructions:

1. SUMMARY (2-3 detailed paragraphs):
   - ${styleInstructions[summaryStyle]}
   - Structure: Introduction → Main Points → Implications/Conclusions
   - Include:
     * WHO is speaking and their credentials/expertise
     * WHAT main topics are discussed
     * WHY these topics matter to the audience
     * HOW the information can be applied
   - Use specific examples, statistics, and quotes when available
   - Connect different topics to show relationships
   - Highlight any unique insights or surprising information

2. TAKEAWAYS (8-12 bullet points):
   Create clear, actionable takeaways that:
   - Start with the key insight or fact
   - Include supporting details or context
   - Are self-contained and meaningful
   - Cover the full breadth of topics discussed
   - Prioritize practical applications and actionable advice
   - Include any specific recommendations, tips, or warnings
   - Reference any books, resources, or future content mentioned

3. KEY MOMENTS (5-8 timestamps):
   For each significant moment provide:
   - timestamp: Exact time in format "MM:SS" or "HH:MM:SS"
   - title: Descriptive headline (5-10 words) - can include HTML tags like <strong>, <em> for emphasis
   - description: 2-3 sentences explaining the significance - use HTML formatting:
     * Use <strong> for important terms or emphasis
     * Use <em> for italics
     * Use <code> for technical terms or quotes
     * Format as proper HTML paragraphs
   - importance: "high" (critical insights), "medium" (supporting points), or "low" (interesting details)

IMPORTANT: Generate your entire response in ${languageMap[language] || 'English'}.

Quality Standards:
- Be comprehensive yet concise
- Focus on practical value for the listener
- Maintain the speaker's intended tone and message
- Ensure all claims are supported by the transcript
- Make complex topics accessible
- Highlight connections between different topics

Please respond in JSON format with this structure:
{
    "summary": "Your comprehensive summary here...",
    "takeaways": [
        "First key takeaway with supporting details...",
        "Second takeaway with context...",
        // ... more takeaways
    ],
    "key_moments": [
        {
            "timestamp": "00:05:30",
            "title": "Key point title",
            "description": "Brief description of what happens and why it matters",
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
          content: `You are an expert content analyst specializing in creating comprehensive, actionable summaries from audio content. 

Your approach:
- Identify the speaker(s) and their credentials/expertise
- Extract ALL key topics, insights, and recommendations
- Connect related ideas to show the bigger picture
- Focus on practical, actionable information
- Include specific examples, statistics, and memorable quotes
- Highlight unique insights or surprising information
- Create takeaways that readers can immediately apply

Your summaries should be:
- Comprehensive yet concise
- Well-structured with clear flow
- Focused on value for the reader
- Written in an engaging, accessible style
- Factually accurate to the source material

Always respond with valid JSON and ensure every claim is supported by the transcript.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: gptSettings?.temperature ?? 0.3,
      max_tokens: gptSettings?.maxTokens ?? 2000
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
    
    // If we have takeaways, append them to the summary
    let enhancedSummary = parsed.summary || 'Summary generation failed'
    if (parsed.takeaways && parsed.takeaways.length > 0) {
      enhancedSummary += '\n\nTakeaways:\n\n' + parsed.takeaways.map((t: string) => `• ${t}`).join('\n')
    }
    
    return {
      summary: enhancedSummary,
      key_moments: (parsed.key_moments || []).map((moment: any) => ({
        timestamp: moment.timestamp || '00:00:00',
        title: moment.title || 'Key Moment',
        description: moment.description || '',
        importance: moment.importance || 'medium'
      } as KeyMoment)),
      total_duration: transcript.duration,
      word_count: transcript.text.split(' ').length,
      language: language
    }
  } catch (e) {
    return {
      summary: content || 'Summary generation failed',
      key_moments: [],
      total_duration: transcript.duration,
      word_count: transcript.text.split(' ').length,
      language: language
    }
  }
}