# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AudioTricks is a React web application for audio transcription and summarization that calls OpenAI APIs directly from the browser. No backend server required.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Application Structure
```
AudioTricks/
├── src/
│   ├── App.tsx              # Main application component
│   ├── components/          # React components
│   │   ├── AudioUploader.tsx
│   │   ├── ResultsDisplay.tsx
│   │   └── ApiKeyInput.tsx
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
└── vite.config.ts           # Vite configuration
```

## Key Features

- **No Backend**: Pure React app with direct OpenAI API calls
- **Client-side Processing**: All processing happens in the browser
- **OpenAI Integration**: Direct calls to Whisper and GPT APIs
- **Modern Stack**: React + TypeScript + Vite + Tailwind CSS
- **Easy Deployment**: Deploy to Vercel, Netlify, or any static host

## Deployment

This is a static React app that can be deployed anywhere:

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

### Manual
```bash
npm run build
# Upload dist/ folder to any web server
```

## Environment Variables

Users enter their OpenAI API key directly in the app - no server-side environment needed.