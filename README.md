# AudioTricks

A React web application for audio transcription and summarization using OpenAI Whisper and GPT models.

## Features

- **Audio Transcription**: Convert audio files to text using OpenAI Whisper
- **AI Summarization**: Generate summaries and extract key moments using GPT-4
- **Multiple Formats**: Support for MP3, WAV, M4A, FLAC, OGG, and more
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

4. **Enter your OpenAI API key** in the app

5. **Upload an audio file** and get instant transcription + summary

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

1. Enter your OpenAI API key (stored locally in your browser)
2. Upload an audio file (max 25MB)
3. Wait for transcription and summarization
4. View results with key moments and timestamps
5. Export as TXT or JSON

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI APIs**: OpenAI Whisper + GPT-4
- **File Handling**: React Dropzone
- **Icons**: Heroicons

## Browser Compatibility

- Chrome 80+
- Firefox 80+
- Safari 14+
- Edge 80+

## License

MIT License