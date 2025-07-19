import { HelpArticle } from './types'
import { changelogArticle } from './changelog'

export const gettingStartedArticles: HelpArticle[] = [
  changelogArticle,
  {
    id: 'getting-started',
    title: 'Getting Started with AudioTricks',
    category: 'getting-started',
    tags: ['setup', 'first-time', 'password', 'api-key'],
    content: `
# Getting Started with AudioTricks

Welcome to AudioTricks! This guide will help you set up and start using the application.

## What You'll Need

1. **Access Password**: Your administrator will provide this
2. **OpenAI API Key**: Get one at [platform.openai.com](https://platform.openai.com)
3. **Audio Files**: MP3, WAV, M4A, FLAC, OGG, or OPUS format (max 150MB)

## First Time Setup

### Step 1: Login
When you first visit AudioTricks, you'll be prompted for a password:
- Enter the password provided by your administrator
- The password is case-sensitive
- Your session will remain active until you close the browser

### Step 2: Add Your API Keys
1. **OpenAI API Key**: Click the key icon in the top-right corner
2. **ElevenLabs API Key**: Click the purple speaker icon for voice synthesis
3. Both keys are saved locally in your browser
4. Only add ElevenLabs key if you want to use voice synthesis features

### Step 3: Process Your First Audio
1. Choose between uploading a file or providing a URL
2. Select your preferred summary style and language
3. Click upload or process
4. Wait for the magic to happen!

## Quick Tips
- Your API keys are never sent to our servers
- All processing happens directly with OpenAI/ElevenLabs
- Results are automatically saved to your history
- Use the clock icon to access previous transcripts
- Try the Audio Editor for advanced word-level editing
- Use Voice Synthesis to create speech from your transcripts
    `,
    relatedArticles: ['api-key-setup', 'uploading-audio', 'understanding-results', 'audio-editor', 'voice-synthesis']
  },
  {
    id: 'api-key-setup',
    title: 'Setting Up Your OpenAI API Key',
    category: 'getting-started',
    tags: ['api', 'openai', 'setup', 'security'],
    content: `
# Setting Up Your OpenAI API Key

Your OpenAI API key is required to use AudioTricks. Here's how to get and configure it.

## Getting an API Key

1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key immediately (you won't see it again!)

## Adding Your Key to AudioTricks

1. Click the **key icon** in the header
2. Paste your API key in the field
3. Press Enter or click outside to save
4. The key is stored locally in your browser

## Security Notes

- **Local Storage Only**: Your key is never sent to our servers
- **Direct API Calls**: All requests go directly to OpenAI
- **Browser Specific**: You'll need to add the key on each device
- **Keep it Secret**: Never share your API key with others

## Checking Your API Key

To verify your key is working:
1. Try processing a short audio file
2. If you see an error, double-check the key
3. Ensure you have credits in your OpenAI account

## Managing Usage

- Monitor your usage at [platform.openai.com/usage](https://platform.openai.com/usage)
- Set spending limits in your OpenAI account
- AudioTricks shows cost estimates for each processing
    `,
    relatedArticles: ['api-costs', 'troubleshooting-api']
  }
]