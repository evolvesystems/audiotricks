# AudioTricks Help Guide

Welcome to AudioTricks! This guide will help you get the most out of our audio transcription and summarization tool.

## Table of Contents
- [Getting Started](#getting-started)
- [Features](#features)
- [How to Use](#how-to-use)
- [Processing Options](#processing-options)
- [Understanding Results](#understanding-results)
- [Troubleshooting](#troubleshooting)
- [API Costs](#api-costs)

## Getting Started

### Requirements
1. **OpenAI API Key**: You'll need an OpenAI API key to use AudioTricks. Get one at [platform.openai.com](https://platform.openai.com)
2. **Password**: Your administrator should provide you with an access password
3. **Supported Browsers**: Chrome, Firefox, Safari, or Edge (latest versions)

### First Time Setup
1. Enter the access password when prompted
2. Click the key icon in the header and enter your OpenAI API key
3. You're ready to start processing audio!

## Features

### Core Capabilities
- **Accurate Transcription**: Uses OpenAI Whisper for industry-leading accuracy
- **Smart Summaries**: GPT-4 creates comprehensive summaries with key takeaways
- **Multi-Language Support**: Transcribe in any language, summarize in 10+ languages
- **Key Moments Extraction**: Automatically identifies 5-8 important timestamps
- **Multiple Input Methods**: Upload files or provide URLs to audio content

### Advanced Features
- **Summary Styles**: Choose between Formal, Creative, or Conversational styles
- **Temperature Control**: Adjust creativity level (0.0 = focused, 1.0 = creative)
- **Token Limits**: Control summary length (500-4000 tokens)
- **Export Options**: Download results as TXT or JSON
- **Cost Estimates**: See estimated API costs before and after processing

## How to Use

### Method 1: Upload Audio File
1. Click the "Upload File" tab
2. Drag and drop your audio file or click to browse
3. Supported formats: MP3, WAV, M4A, FLAC, OGG (max 25MB)
4. Select your processing options
5. Wait for processing to complete

### Method 2: Process from URL
1. Click the "From URL" tab
2. Paste the direct link to your audio file
3. Click "Process"
4. Note: If the URL is blocked by CORS, we'll automatically use a proxy service

### Processing Options

#### Summary Style
- **Formal**: Professional, structured summaries ideal for business use
- **Creative**: Engaging, narrative-style summaries with vivid descriptions
- **Conversational**: Casual, easy-to-read summaries as if explaining to a friend

#### Output Language
Choose from 10 languages for your summary:
- English, Spanish, French, German, Italian
- Portuguese, Dutch, Japanese, Korean, Chinese

#### Advanced Settings
- **Temperature** (0.0-1.0): Controls creativity and randomness
  - 0.0-0.3: Focused, consistent results
  - 0.4-0.7: Balanced creativity
  - 0.8-1.0: More creative and varied
  
- **Max Tokens** (500-4000): Controls summary length
  - 500-1000: Brief summaries
  - 1000-2000: Standard summaries
  - 2000-4000: Detailed summaries

## Understanding Results

### Summary Tab
Contains two main sections:

1. **Summary**: A comprehensive overview including:
   - WHO is involved
   - WHAT is discussed
   - WHY it matters
   - HOW things work or happen

2. **Key Moments**: Important timestamps with:
   - Timestamp (clickable in some players)
   - Importance level (High/Medium/Low)
   - Title and description of the moment

### Transcript Tab
- Full text transcription with timestamps
- Toggle timestamps on/off for easier reading
- Search within transcript (Ctrl/Cmd + F)

### Podcasts Tab
- Editable summary and key moments
- Rich text editor with formatting options
- HTML preview and markdown conversion
- Save your edits for later use

## Troubleshooting

### Common Issues

**"No access password configured"**
- Contact your administrator for the access password

**"Processing Error: Failed to fetch"**
- Check your internet connection
- Verify the audio URL is publicly accessible
- Try uploading the file directly instead

**"Invalid API Key"**
- Verify your OpenAI API key is correct
- Ensure your API key has sufficient credits
- Check that Whisper and GPT-4 are enabled for your key

**CORS Errors with URLs**
- This is handled automatically with proxy services
- Processing may take slightly longer
- Consider downloading and uploading the file for faster processing

### Audio Quality Tips
- Use high-quality audio files for best results
- Minimize background noise
- Ensure clear speech
- Optimal bitrate: 128kbps or higher

## API Costs

AudioTricks uses two OpenAI services:

### Whisper API (Transcription)
- **Cost**: $0.006 per minute of audio
- **Example**: 10-minute audio = $0.06

### GPT-4 API (Summarization)
- **Cost**: Varies by token usage
- **Typical**: $0.05-0.15 per summary
- **Factors**: Summary length, language, complexity

### Total Estimated Costs
- **5-minute audio**: ~$0.08-0.13
- **30-minute audio**: ~$0.23-0.33
- **60-minute audio**: ~$0.41-0.51

*Note: Actual costs may vary based on your OpenAI pricing tier*

## Tips for Best Results

1. **Audio Quality**: Higher quality audio produces better transcripts
2. **Clear Speech**: Multiple speakers should speak clearly and distinctly
3. **Language Matching**: Select the output language before processing
4. **Summary Style**: Choose based on your audience and use case
5. **Regular Saves**: Use the export feature to save important results

## Privacy & Security

- Audio files are sent directly to OpenAI for processing
- No audio or transcripts are stored on our servers
- Results are only saved locally in your browser (if enabled)
- Use strong passwords and keep API keys secure

## Need More Help?

If you encounter issues not covered in this guide:
1. Check your browser console for detailed error messages
2. Ensure you're using a supported browser
3. Try refreshing the page and logging in again
4. Contact your administrator for technical support

---

*AudioTricks - Transform Audio into Actionable Insights*