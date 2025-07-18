# AudioTricks

A React web application for audio transcription and summarization using OpenAI Whisper and GPT models.

## Features

- **Audio Transcription**: Convert audio files to text using OpenAI Whisper
- **AI Summarization**: Generate summaries and extract key moments using GPT-4
- **Voice Synthesis**: Transform transcripts into natural speech using ElevenLabs
- **Audio Editor**: Word-level editing with timestamps and audio splicing
- **History Recovery**: Recover lost transcripts and summaries automatically
- **Multiple Formats**: Support for MP3, WAV, M4A, FLAC, OGG, OPUS (up to 100MB)
- **Client-side Processing**: No backend required - runs entirely in your browser
- **Export Options**: Download results as TXT or JSON
- **Modern UI**: React with TypeScript and Tailwind CSS

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open http://localhost:5173**

4. **Enter your API keys** in the app:
   - OpenAI API key (required for transcription and summarization)
   - ElevenLabs API key (optional, for voice synthesis)

5. **Upload an audio file** and get instant transcription + summary

6. **Try advanced features**:
   - Use the Audio Editor for word-level editing
   - Generate speech with Voice Synthesis
   - Recover lost history if needed

## Deployment

Deploy to any static hosting service:

### Vercel (Recommended)
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### GitHub Pages
```bash
npm run build
# Upload dist/ folder contents
```

## Usage

1. **Enter your API keys** (stored locally in your browser):
   - OpenAI API key (required)
   - ElevenLabs API key (optional for voice synthesis)
2. **Upload an audio file** (MP3, WAV, M4A, FLAC, OGG, OPUS - max 100MB)
3. **Wait for processing** - transcription and summarization
4. **View results** with key moments and timestamps
5. **Use advanced features**:
   - Audio Editor: Word-level editing and audio splicing
   - Voice Synthesis: Convert text to speech
   - History Management: Access previous results
6. **Export as TXT or JSON** for sharing or backup

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI APIs**: OpenAI Whisper + GPT-4 + ElevenLabs
- **Audio Processing**: Web Audio API
- **File Handling**: React Dropzone
- **Icons**: Heroicons

## Browser Compatibility

- Chrome 80+
- Firefox 80+
- Safari 14+
- Edge 80+

## License

MIT License