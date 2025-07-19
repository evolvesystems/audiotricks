import { HelpArticle } from './types'

export const changelogArticle: HelpArticle = {
  id: 'changelog',
  title: 'What\'s New - Changelog',
  category: 'getting-started',
  tags: ['updates', 'new features', 'changelog', 'releases'],
  content: `
# What's New - Changelog

Stay up to date with the latest improvements and features added to AudioTricks.

## December 2024

### 🚀 Major Features

#### Voice Synthesis with ElevenLabs
- **NEW**: Transform your transcripts into natural speech using AI voices
- 50+ professional voices available
- Multiple languages supported
- Adjustable voice settings for perfect output
- Direct integration with Audio Editor

#### Audio Editor Enhancements
- **NEW**: Word-level editing capabilities
- Click any word to jump to that position
- Select and splice audio segments
- Export edited clips as MP3 or WAV
- Seamless integration with Voice Synthesis

### 🛡️ Security Improvements

#### XSS Protection
- Added DOMPurify for all HTML content
- Sanitization of user-generated content
- Enhanced security for markdown rendering
- Protection against malicious scripts

### 🎨 UI/UX Improvements

#### Landing Page Redesign
- Modern, professional design
- Clear feature presentation
- Improved call-to-action sections
- Better mobile responsiveness

#### History System Reliability
- Improved data persistence
- Automatic backup system
- Better error recovery
- Debounced saves for performance

#### Processing Progress
- Real-time transcription progress
- File size display
- Cancel button for long operations
- Better error handling

### 🔧 Technical Improvements

#### Code Quality
- Refactored large files to meet 250-line limit
- Added comprehensive test suite
- Improved TypeScript types
- Better error boundaries

#### Performance
- Optimized file splitting for large audio
- Improved memory management
- Faster loading times
- Better caching strategies

### 🐛 Bug Fixes

- Fixed flaky history system
- Fixed white screen on transcript tab
- Fixed CORS errors for external URLs
- Fixed progress bar stuck at 33%
- Fixed duplicate file upload dialog
- Fixed reprocess functionality
- Fixed missing key takeaways
- Fixed cramped UI layouts

## November 2024

### Initial Release Features

#### Core Functionality
- Audio file upload (up to 150MB)
- URL-based audio processing
- Automatic transcription via OpenAI Whisper
- AI-powered summarization
- Key moments extraction

#### Supported Formats
- MP3, WAV, M4A, FLAC, OGG, OPUS
- Automatic file splitting for large files
- Direct URL support

#### Summary Options
- Multiple summary styles (Formal, Creative, Conversational)
- 10+ output languages
- Customizable settings (temperature, max tokens)

#### Results Display
- Organized tabbed interface
- Full transcript with timestamps
- Executive summary
- Key takeaways
- Editable podcasts tab
- Export to TXT/JSON

#### History Management
- Automatic saving
- Search functionality
- Up to 50 items stored
- Local storage only

#### Security Features
- Client-side processing
- No server storage
- API keys stored locally
- Password protection

---

## Coming Soon

- Enhanced audio editing features
- More voice options
- Collaborative features
- Advanced search capabilities
- Custom voice training

Check back regularly for updates!
  `,
  relatedArticles: ['getting-started', 'voice-synthesis', 'audio-editor']
}