import { TranscriptionResponse, SummaryResponse, KeyMoment } from '../../types'
import { SummaryStyle } from '../../components/SummaryStyleSelector'
import { GPTSettings, STYLE_INSTRUCTIONS, LANGUAGE_MAP } from './types'

/**
 * Generates a comprehensive summary using GPT-4
 */
export async function generateSummary(
  transcript: TranscriptionResponse, 
  apiKey: string, 
  summaryStyle: SummaryStyle = 'formal',
  language: string = 'en',
  gptSettings?: GPTSettings,
  signal?: AbortSignal
): Promise<SummaryResponse> {
  const targetLanguage = LANGUAGE_MAP[language] || 'English'
  
  // Smart truncation - keep first and last parts for context
  const maxTranscriptLength = 2500
  let truncatedTranscript = transcript.text
  
  if (transcript.text.length > maxTranscriptLength) {
    const firstPart = transcript.text.substring(0, 1800)
    const lastPart = transcript.text.substring(transcript.text.length - 700)
    truncatedTranscript = firstPart + '\n\n[...middle section omitted...]\n\n' + lastPart
  }
    
  const prompt = createSummaryPrompt({ ...transcript, text: truncatedTranscript }, summaryStyle, targetLanguage)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    signal,
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: getSummarySystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: gptSettings?.temperature ?? 0.3,
      max_tokens: Math.min(gptSettings?.maxTokens ?? 2500, 2500)
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Summary generation failed: ${response.statusText}`)
  }

  const result = await response.json()
  const content = result.choices[0].message.content
  
  return parseSummaryResponse(content, transcript, language)
}

/**
 * Creates the detailed prompt for summary generation
 */
function createSummaryPrompt(transcript: TranscriptionResponse, summaryStyle: SummaryStyle, targetLanguage: string): string {
  // Extract available timestamps from segments
  const hasSegments = transcript.segments && transcript.segments.length > 0
  const segmentInfo = hasSegments 
    ? transcript.segments!.map(seg => `[${formatTime(seg.start)}] ${seg.text}`).join('\n')
    : transcript.text

  return `You are an expert content analyst. Analyze this audio transcript and create a comprehensive summary in ${targetLanguage}. Use a ${STYLE_INSTRUCTIONS[summaryStyle]} tone.

REQUIREMENTS:
1. SUMMARY: Write 2-3 detailed paragraphs including:
   - WHO is speaking and their expertise/role
   - WHAT main topics, insights, and recommendations are discussed
   - WHY these topics matter to the audience
   - HOW listeners can apply this information
   - Include specific examples, data points, and key quotes

2. TAKEAWAYS: Create 8-12 actionable bullet points formatted as:
   • Key insight with supporting context and specific details
   • Actionable recommendation with clear steps or applications
   • Important fact or statistic with relevance explained

3. KEY MOMENTS: ${hasSegments ? 'Using the provided timestamps, identify' : 'Identify'} 5-8 significant moments:
   - timestamp: ${hasSegments ? 'Use exact times from the timestamped segments' : 'Estimate times if possible (MM:SS format)'}
   - title: Compelling 5-10 word headline describing the moment
   - description: 2-3 sentences explaining what happens and why it matters
   - importance: "high" for breakthrough insights, "medium" for supporting points, "low" for interesting details

Respond in JSON format:
{
  "summary": "Comprehensive summary paragraphs...",
  "takeaways": [
    "Key insight with supporting context and specific details",
    "Actionable recommendation with clear steps or applications"
  ],
  "key_moments": [
    {
      "timestamp": "${hasSegments ? 'MM:SS' : '00:30'}",
      "title": "Specific moment headline",
      "description": "What happens and significance",
      "importance": "high"
    }
  ]
}

${hasSegments ? 'TIMESTAMPED TRANSCRIPT:' : 'TRANSCRIPT:'}
${segmentInfo}`
}

/**
 * Formats seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Gets the system prompt for the GPT model
 */
function getSummarySystemPrompt(): string {
  return `You are an expert content analyst specializing in audio content. Your job is to extract maximum value from transcripts by creating comprehensive summaries, actionable takeaways, and identifying key moments with exact timestamps. 

Focus on:
- Practical, actionable information listeners can use
- Specific examples, statistics, and quotes from the transcript
- Clear identification of speakers and their expertise
- Exact timestamp extraction from the transcript content
- Quality over quantity - make every insight count

Always respond with valid, well-formatted JSON.`
}

/**
 * Parses the GPT response and formats it as a SummaryResponse
 */
function parseSummaryResponse(content: string, transcript: TranscriptionResponse, language: string): SummaryResponse {
  try {
    const parsed = JSON.parse(content)
    
    return {
      summary: parsed.summary || 'Summary generation failed',
      takeaways: parsed.takeaways || [],
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
      takeaways: [],
      key_moments: [],
      total_duration: transcript.duration,
      word_count: transcript.text.split(' ').length,
      language: language
    }
  }
}