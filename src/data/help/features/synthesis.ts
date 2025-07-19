import { HelpArticle } from '../types'

export const synthesisArticles: HelpArticle[] = [
  {
    id: 'voice-synthesis',
    title: 'Voice Synthesis with ElevenLabs',
    category: 'features',
    tags: ['voice synthesis', 'elevenlabs', 'text-to-speech', 'ai voice'],
    content: `
# Voice Synthesis with ElevenLabs

Transform your transcripts into natural-sounding speech using ElevenLabs' advanced AI voices.

## Getting Started

### Prerequisites
1. ElevenLabs API key (get at [elevenlabs.io](https://elevenlabs.io))
2. Processed transcript in AudioTricks
3. Active ElevenLabs subscription (free tier available)

### Setup
1. Click the purple speaker icon in the header
2. Enter your ElevenLabs API key
3. Key is saved locally in your browser

## Voice Selection

### Available Voices
- **50+ pre-built voices** with different characteristics
- **Multiple languages** supported
- **Various styles**: Narration, conversational, dramatic

### Voice Categories
- **Narration**: Clear, professional voices for audiobooks
- **Conversational**: Natural, friendly voices for podcasts
- **Character**: Unique voices for creative content
- **News**: Authoritative voices for journalism

### Choosing the Right Voice
Consider:
- Content type and tone
- Target audience
- Language requirements
- Gender preference
- Age characteristics

## Voice Settings

### Stability (0.0 - 1.0)
- **Lower (0.0-0.3)**: More expressive, varied
- **Medium (0.4-0.6)**: Balanced performance
- **Higher (0.7-1.0)**: Consistent, predictable
- Default: 0.5

### Similarity Boost (0.0 - 1.0)
- **Lower**: More creative interpretation
- **Higher**: Closer to original voice characteristics
- Default: 0.75

### Style (0.0 - 1.0)
- **Lower**: More natural, conversational
- **Higher**: More expressive, dramatic
- Default: 0.0

### Speaker Boost
- Enable for texts over 1000 words
- Maintains consistency in long content
- Slight processing time increase

## The Synthesis Process

### Step 1: Prepare Your Text
- Review and edit transcript in Audio Editor
- Remove unwanted sections
- Fix any errors or formatting issues

### Step 2: Select Voice
- Browse available voices
- Preview with sample text
- Consider your content needs

### Step 3: Configure Settings
- Adjust stability for expression level
- Set similarity boost
- Configure style as needed
- Enable speaker boost for long content

### Step 4: Generate Audio
- Click "Generate Speech"
- Monitor progress bar
- Generation typically takes 10-30 seconds

### Step 5: Review and Download
- Play generated audio
- If satisfied, download as MP3
- If not, adjust settings and regenerate

## Best Practices

### Text Preparation
- **Clean transcript**: Remove filler words
- **Add punctuation**: Helps with natural pauses
- **Break paragraphs**: Improves pacing
- **Check pronunciation**: Unusual words may need phonetic spelling

### Voice Selection
- **Match content**: Professional content → professional voice
- **Test first**: Always preview before full generation
- **Consider audience**: Age, preferences, expectations

### Settings Optimization
- **Start with defaults**: Then adjust as needed
- **Lower stability**: For dynamic content
- **Higher stability**: For consistent narration
- **Test small sections**: Before processing entire transcript

## Costs and Limits

### Pricing Tiers
- **Free**: 10,000 characters/month
- **Starter ($5)**: 30,000 characters/month
- **Creator ($22)**: 100,000 characters/month
- **Pro ($99)**: 500,000 characters/month

### Character Counting
- Includes spaces and punctuation
- ~150 words ≈ 1,000 characters
- Cost: ~$0.30 per 1,000 words

### Usage Tips
- Monitor usage in ElevenLabs dashboard
- Process in sections for long content
- Download and save generated audio
- Use character count preview

## Advanced Features

### Custom Pronunciations
- Use phonetic spelling for unusual words
- Add emphasis with CAPS
- Control pacing with punctuation

### Multi-Voice Projects
- Different voices for different speakers
- Create dialogues or interviews
- Export individual voice tracks

### Integration with Audio Editor
1. Edit transcript in Audio Editor
2. Switch to Voice Synthesis tab
3. Generate speech from edited text
4. Download final audio
    `,
    relatedArticles: ['audio-editor', 'api-costs', 'advanced-features']
  }
]