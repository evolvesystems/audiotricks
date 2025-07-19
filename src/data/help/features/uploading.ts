import { HelpArticle } from '../types'

export const uploadingArticles: HelpArticle[] = [
  {
    id: 'uploading-audio',
    title: 'Uploading and Processing Audio',
    category: 'features',
    tags: ['upload', 'audio', 'url', 'file-types'],
    content: `
# Uploading and Processing Audio

AudioTricks offers two ways to get your audio into the system for processing.

## Upload Methods

### 1. File Upload
- Click "Choose File" or drag and drop
- Supported formats: MP3, WAV, M4A, FLAC, OGG, OPUS
- Maximum file size: 150MB (files over 25MB are automatically split)

### 2. URL Input
- Paste a direct link to an audio file
- Must be a direct audio file URL (not a webpage)
- The system will automatically handle CORS issues

## File Types and Quality

### Supported Formats
- **MP3**: Most common, good compression
- **WAV**: Uncompressed, highest quality
- **M4A**: Apple's format, good quality
- **FLAC**: Lossless compression
- **OGG/OPUS**: Open formats, efficient

### Quality Tips
- Higher quality audio produces better transcripts
- Clear speech without background noise works best
- Files under 10MB process fastest

## Processing Options

Before uploading, you can customize:
- **Summary Style**: Formal, Creative, or Conversational
- **Output Language**: 10+ languages available
- **Advanced Settings**: Temperature and token limits

## Large Files

For files over 25MB:
- The system automatically splits them into chunks
- Each chunk is processed separately
- Results are combined seamlessly
- No quality loss in the process
    `,
    relatedArticles: ['processing-options', 'understanding-results']
  }
]