export interface HelpArticle {
  id: string
  title: string
  category: 'getting-started' | 'features' | 'troubleshooting' | 'api-costs' | 'advanced'
  tags: string[]
  content: string
  relatedArticles?: string[]
}

export const helpArticles: HelpArticle[] = [
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
3. **Audio Files**: MP3, WAV, M4A, FLAC, OGG, or OPUS format (max 100MB)

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
  },
  {
    id: 'uploading-audio',
    title: 'Uploading and Processing Audio',
    category: 'features',
    tags: ['upload', 'audio', 'url', 'file-types'],
    content: `
# Uploading and Processing Audio

AudioTricks offers two ways to process audio files: direct upload or URL input.

## Method 1: File Upload

### Supported Formats
- MP3 (recommended)
- WAV
- M4A
- FLAC
- OGG
- OPUS
- Maximum file size: 100MB (files over 25MB are automatically split)

### How to Upload
1. Click the **Upload File** tab
2. Drag and drop your file onto the upload area
   - Or click to browse and select a file
3. Choose your processing options
4. The file will automatically start processing

### Tips for File Upload
- For best results, use high-quality audio (128kbps or higher)
- Ensure clear speech with minimal background noise
- Files under 10MB process fastest

## Method 2: URL Input

### When to Use URLs
- Audio is hosted online (podcasts, lectures, etc.)
- File is too large to download
- You want to process without downloading

### How to Use URLs
1. Click the **From URL** tab
2. Paste the direct link to the audio file
3. Ensure it's a direct link (ends with .mp3, .wav, etc.)
4. Click **Process**

### CORS and Proxy Handling
Some URLs may be blocked by CORS (Cross-Origin Resource Sharing):
- AudioTricks automatically detects CORS issues
- Uses proxy services as fallback
- May take slightly longer but will still work

## Processing Options

Before processing, you can customize:

### Summary Style
- **Formal**: Professional, structured summaries
- **Creative**: Engaging, narrative style
- **Conversational**: Casual, friendly tone

### Output Language
Choose from 10+ languages for your summary, regardless of the audio's language

### Advanced Settings
- **Temperature**: Creativity level (0.0-1.0)
- **Max Tokens**: Summary length (500-4000)
    `,
    relatedArticles: ['processing-options', 'understanding-results']
  },
  {
    id: 'processing-options',
    title: 'Customizing Processing Options',
    category: 'features',
    tags: ['settings', 'summary-style', 'language', 'temperature', 'advanced'],
    content: `
# Customizing Processing Options

AudioTricks provides several options to customize how your audio is processed and summarized.

## Summary Styles

### Formal (Default)
- Professional tone
- Structured format
- Ideal for business or academic use
- Clear, concise language

Example: "The presentation discusses three key market trends..."

### Creative
- Engaging narrative style
- Vivid descriptions
- Story-like format
- Great for content creation

Example: "In this captivating discussion, the speaker paints a picture of..."

### Conversational
- Casual, friendly tone
- Like explaining to a friend
- Easy to understand
- Perfect for personal use

Example: "So basically, they're talking about how the market is changing..."

## Language Options

### Input vs Output
- **Input**: AudioTricks can transcribe audio in ANY language
- **Output**: Choose from 10+ languages for your summary

### Available Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Dutch (nl)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)

## Advanced Settings

### Temperature (Creativity)
Controls how creative or focused the AI is:

- **0.0-0.3**: Very focused, consistent results
- **0.4-0.6**: Balanced creativity (recommended)
- **0.7-1.0**: More creative, varied outputs

### Max Tokens (Length)
Controls the maximum length of summaries:

- **500-1000**: Brief summaries (1-2 paragraphs)
- **1000-2000**: Standard summaries (recommended)
- **2000-4000**: Detailed, comprehensive summaries

## Saving Your Preferences

1. Click the **Settings** icon (gear) in the header
2. Adjust your default preferences
3. Click **Save Settings**
4. These will be used for all future processing

## Tips for Best Results

1. **Match style to purpose**:
   - Formal for reports
   - Creative for blogs
   - Conversational for notes

2. **Consider your audience**:
   - Technical content → Lower temperature
   - Creative content → Higher temperature

3. **Balance length with detail**:
   - Short audio → Lower token count
   - Long audio → Higher token count
    `,
    relatedArticles: ['summary-styles-explained', 'advanced-settings']
  },
  {
    id: 'understanding-results',
    title: 'Understanding Your Results',
    category: 'features',
    tags: ['results', 'summary', 'transcript', 'key-moments', 'export'],
    content: `
# Understanding Your Results

After processing, AudioTricks provides comprehensive results in multiple formats.

## Results Overview

### Header Information
- **Duration**: Total length of the audio
- **Word Count**: Number of words in transcript
- **Processing Time**: How long it took
- **Cost Estimate**: Approximate API cost

## Four Main Tabs

### 1. Summary & Key Moments Tab

#### Summary Section
A comprehensive overview including:
- **WHO**: Key people or speakers involved
- **WHAT**: Main topics and discussions
- **WHY**: Purpose and importance
- **HOW**: Methods or processes described

#### Takeaways
- 8-12 bullet points
- Actionable insights
- Key learnings
- Important quotes or statistics

#### Key Moments
- 5-8 important timestamps
- Each includes:
  - Timestamp (e.g., 5:23)
  - Importance level (High/Medium/Low)
  - Title of the moment
  - Brief description

### 2. Full Transcript Tab

#### Features
- Complete word-for-word transcription
- Optional timestamps (toggle on/off)
- Searchable (Ctrl/Cmd + F)
- Formatted for easy reading

#### Timestamp Format
- Shows time markers throughout
- Click timestamps in supported players
- Useful for navigation

### 3. Podcasts Tab

#### Editable Content
- Summary and key moments in editable format
- Rich text editor with formatting tools
- HTML preview mode
- Markdown conversion

#### Formatting Options
- Bold, italic, headings
- Bullet lists
- Convert between HTML and Markdown
- Save your edits

### 4. Audio Editor Tab

#### Advanced Features
- **Word-level editing**: Click words to jump to audio position
- **Audio splicing**: Create clips from selected word ranges
- **Voice synthesis**: Generate speech from edited transcript
- **Precision editing**: Remove unwanted words with timestamps

#### Two Sub-tabs
- **Edit Mode**: Interactive transcript with audio sync
- **Voice Synthesis**: Transform text to speech with ElevenLabs

## Exporting Results

### Export Formats

#### TXT Export
- Plain text format
- Includes all sections
- Easy to share via email
- Compatible with any text editor

#### JSON Export
- Structured data format
- Includes all metadata
- Perfect for developers
- Preserves all details

### How to Export
1. Click **Export TXT** or **Export JSON**
2. File downloads automatically
3. Default filename includes date

## Using the History

All results are automatically saved:
- Click the **clock icon** to view history
- Search through past transcripts
- Click any item to view again
- Delete items you don't need

## Tips for Analysis

1. **Start with Key Moments** for quick overview
2. **Read Summary** for comprehensive understanding
3. **Use Transcript** for specific quotes
4. **Edit in Podcasts Tab** for sharing

## Quality Indicators

Look for these signs of good processing:
- Clear, coherent summary
- Accurate timestamps
- Relevant key moments
- Proper names and terms captured
    `,
    relatedArticles: ['exporting-sharing', 'using-history', 'podcasts-tab', 'audio-editor', 'voice-synthesis']
  },
  {
    id: 'api-costs',
    title: 'Understanding API Costs',
    category: 'api-costs',
    tags: ['costs', 'pricing', 'openai', 'whisper', 'gpt-4'],
    content: `
# Understanding API Costs

AudioTricks uses two OpenAI services, each with its own pricing structure.

## Cost Breakdown

### Whisper API (Transcription)
- **Rate**: $0.006 per minute
- **Billed**: By the second, rounded up
- **Example**: 5-minute audio = $0.03

### GPT-4 API (Summarization)
- **Input**: ~$0.01 per 1K tokens
- **Output**: ~$0.03 per 1K tokens
- **Typical**: $0.05-0.15 per summary

## Estimated Total Costs

| Audio Length | Transcription | Summary | Total |
|--------------|---------------|---------|-------|
| 5 minutes    | $0.03        | $0.05   | $0.08 |
| 15 minutes   | $0.09        | $0.08   | $0.17 |
| 30 minutes   | $0.18        | $0.10   | $0.28 |
| 60 minutes   | $0.36        | $0.15   | $0.51 |

*Estimates based on average usage patterns*

## Factors Affecting Costs

### Transcription Costs
- Fixed rate per minute
- Audio quality doesn't affect price
- Multiple speakers same cost

### Summary Costs Depend On:
1. **Transcript length** (more words = more tokens)
2. **Summary settings**:
   - Higher max tokens = potentially higher cost
   - Temperature doesn't affect cost
   - Output language may slightly vary cost

## Managing Costs

### Before Processing
- Check the cost estimate shown
- Shorter audio = lower cost
- Consider your settings

### Best Practices
1. **Process necessary audio only**
2. **Use appropriate token limits**:
   - Short audio: 1000-1500 tokens
   - Long audio: 2000-3000 tokens
3. **Monitor your OpenAI usage**

### Setting Limits
In your OpenAI account:
1. Set monthly spending limits
2. Configure usage alerts
3. Monitor at platform.openai.com/usage

## Cost-Saving Tips

1. **Batch similar content** - Process related audio together
2. **Optimize settings** - Don't use max tokens unnecessarily  
3. **Use history** - Don't reprocess the same audio
4. **Preview first** - For long files, process a sample

## Understanding the Estimate

The cost estimate shows:
- Transcription cost (exact)
- Summary cost (estimated range)
- Total estimated cost

Note: Actual costs may vary slightly based on:
- Exact token usage
- OpenAI pricing changes
- Your account tier
    `,
    relatedArticles: ['api-key-setup', 'processing-options']
  },
  {
    id: 'troubleshooting-api',
    title: 'Troubleshooting API Issues',
    category: 'troubleshooting',
    tags: ['errors', 'api', 'troubleshooting', 'fix'],
    content: `
# Troubleshooting API Issues

Having issues with API calls? Here are common problems and solutions.

## Common API Errors

### "Invalid API Key"

**Symptoms**: Error immediately after starting processing

**Solutions**:
1. Double-check your API key:
   - No extra spaces
   - Complete key (starts with sk-)
   - Not expired or revoked
2. Verify at platform.openai.com
3. Generate a new key if needed

### "Insufficient Credits"

**Symptoms**: Processing fails with payment error

**Solutions**:
1. Check your OpenAI account balance
2. Add payment method if needed
3. Check if you've hit spending limits
4. Wait for monthly reset if on free tier

### "Rate Limit Exceeded"

**Symptoms**: Error after processing multiple files

**Solutions**:
1. Wait a few minutes and retry
2. Process files one at a time
3. Check your OpenAI rate limits
4. Upgrade your OpenAI plan if needed

## CORS Errors

### "Cannot access URL due to CORS"

**What it means**: The audio host blocks direct browser access

**Automatic Solutions**:
- AudioTricks tries multiple proxy services
- Usually resolves automatically
- May take extra 5-10 seconds

**Manual Solutions**:
1. Download the file and upload directly
2. Try a different URL for the same content
3. Use the Netlify proxy option

## Processing Errors

### "Processing Failed"

**Common Causes**:
1. **File too large** (over 100MB)
2. **Unsupported format**
3. **Corrupted audio file**
4. **Network timeout**

**Solutions**:
- Compress audio to under 100MB (files over 25MB are automatically split)
- Convert to supported format (MP3 recommended)
- Check file plays in normal player
- Try again with stable connection

### "Timeout Error"

**For large files**:
1. Processing can take several minutes
2. Don't close the tab
3. Check your internet connection
4. Try a smaller file segment first

## Quality Issues

### Poor Transcription Quality

**Common Causes**:
1. Low audio quality
2. Heavy background noise
3. Multiple overlapping speakers
4. Strong accents or unclear speech

**Solutions**:
- Use higher quality source audio
- Pre-process to reduce noise
- Use audio with clear speech
- Consider manual editing after

### Incomplete Summaries

**If summaries seem cut off**:
1. Increase max tokens setting
2. Check if audio was fully processed
3. Try formal style for completeness
4. Process in smaller segments

## Getting Help

If issues persist:
1. **Check browser console** (F12) for detailed errors
2. **Note the exact error message**
3. **Try a different browser**
4. **Clear browser cache and cookies**
5. **Contact your administrator**

## Diagnostic Steps

1. **Test with sample file**:
   - Use a short, clear MP3
   - Default settings
   - Should work immediately

2. **Verify setup**:
   - API key is valid
   - Password is correct
   - Browser is supported

3. **Check network**:
   - Stable internet connection
   - No VPN/proxy interference
   - Firewall not blocking OpenAI
    `,
    relatedArticles: ['api-key-setup', 'api-costs', 'uploading-audio']
  },
  {
    id: 'using-history',
    title: 'Using the History Feature',
    category: 'features',
    tags: ['history', 'search', 'saved', 'previous'],
    content: `
# Using the History Feature

AudioTricks automatically saves all your processed transcripts for easy access later.

## Accessing History

### Opening History
- Click the **clock icon** in the header
- Shows number of saved items
- Opens history panel

### History Panel Features
- List of all processed audio
- Shows title, date, duration
- Search functionality
- Quick actions (view, delete)

## Understanding History Items

Each item shows:
- **Title**: Auto-generated from content
- **Time**: "5 minutes ago" or date
- **Duration**: Length of original audio
- **Word Count**: Transcript length

## Searching History

### Search Capabilities
Search looks through:
- Titles
- Full transcripts
- Summaries
- Key moments

### Search Tips
1. Use keywords from the content
2. Try speaker names
3. Search for specific topics
4. Partial words work too

## Managing History

### Viewing Past Results
1. Click the **eye icon** on any item
2. Opens full results immediately
3. All features available (export, edit, etc.)

### Deleting Items
1. Click the **trash icon**
2. Immediate deletion
3. Cannot be undone

### Recover Lost History
1. Click **Recover Lost History** button
2. Tool searches for lost data automatically
3. Found items are restored to history
4. Duplicates are automatically removed

### Clear All History
1. Click **Clear All** button
2. Confirm in dialog
3. Removes all saved items
4. Fresh start

## History Limits

### Storage Details
- Maximum 50 items saved
- Oldest auto-removed when full
- Stored in browser localStorage
- About 5-10MB total space

### Browser Specific
- History is per-browser
- Not synced across devices
- Clearing browser data removes history
- Private browsing doesn't save

## Best Practices

### Organizing Your Work
1. **Process related content together**
2. **Delete unsuccessful attempts**
3. **Export important results**
4. **Clear old items periodically**

### Finding Content
1. **Remember key phrases**
2. **Note processing dates**
3. **Use unique keywords**
4. **Check most recent first**

## Privacy & Security

### Local Storage Only
- Never sent to servers
- Encrypted by browser
- Only you can access
- Cleared with browser data

### Sensitive Content
- Consider clearing after use
- Export and store securely
- Don't rely solely on history
- Use private browsing if needed

## Tips & Tricks

1. **Quick Review**: Use history to compare multiple versions
2. **Reference Library**: Keep important transcripts for reference
3. **Progress Tracking**: See your processing over time
4. **Mistake Recovery**: Access accidentally closed results
    `,
    relatedArticles: ['understanding-results', 'exporting-sharing', 'privacy-security', 'history-recovery']
  },
  {
    id: 'podcasts-tab',
    title: 'Using the Podcasts Tab',
    category: 'features',
    tags: ['podcasts', 'editing', 'formatting', 'html', 'markdown'],
    content: `
# Using the Podcasts Tab

The Podcasts tab provides powerful editing tools for formatting and sharing your results.

## Overview

The Podcasts tab is designed for:
- Creating shareable content
- Formatting for publication
- Editing summaries and key moments
- Converting between formats

## Editor Features

### Rich Text Editing
- **Bold** text (Ctrl/Cmd + B)
- *Italic* text (Ctrl/Cmd + I)
- Headings (H1, H2, H3)
- Bullet lists
- Direct text editing

### Three View Modes

#### 1. Edit Mode (Default)
- Full editing capabilities
- Toolbar for formatting
- Real-time updates
- Keyboard shortcuts

#### 2. Preview Mode
- See formatted result
- How it will look when shared
- No editing in this mode
- Professional appearance

#### 3. HTML Mode
- View raw HTML code
- For developers
- Copy for websites
- See exact formatting

## Formatting Tools

### Text Formatting
1. **Select text** you want to format
2. **Click toolbar button** or use shortcut
3. **See changes** immediately

### Available Formats
- **Bold**: Important points
- **Italic**: Emphasis
- **H1/H2/H3**: Section headers
- **Lists**: Bullet points

## Converting Formats

### HTML to Markdown
1. Click **Convert to MD** button
2. HTML converts to Markdown syntax
3. Preserves all formatting
4. Ready for Markdown platforms

### When to Use Each
- **HTML**: Websites, blogs, rich formatting
- **Markdown**: GitHub, Reddit, plain text
- **Preview**: Final check before sharing

## Editing Best Practices

### For Summaries
1. **Add section headers** for clarity
2. **Bold key points** for emphasis
3. **Use lists** for takeaways
4. **Keep paragraphs** short

### For Key Moments
1. **Bold timestamps** stand out
2. **Use headers** for sections
3. **Group related** moments
4. **Add context** where needed

## Sharing Your Content

### Copy & Paste
1. Edit and format as desired
2. Switch to Preview mode
3. Select all (Ctrl/Cmd + A)
4. Copy and paste anywhere

### Export Options
- Still use main Export buttons
- Exports include your edits
- Choose TXT or JSON format

## Common Use Cases

### Blog Posts
1. Format with headers and bold
2. Add introduction paragraph
3. Organize key moments by topic
4. Copy HTML for blog platform

### Meeting Notes
1. Clean up summary
2. Highlight action items
3. Group by agenda topics
4. Share via email

### Content Creation
1. Extract best quotes
2. Create social media posts
3. Build article outlines
4. Generate video timestamps

## Tips for Success

1. **Start with good content**: Edit, don't rewrite
2. **Use formatting sparingly**: Less is more
3. **Preview before sharing**: Check appearance
4. **Save important edits**: Export results

## Keyboard Shortcuts

- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + A**: Select all
- **Ctrl/Cmd + C**: Copy
- **Ctrl/Cmd + V**: Paste
    `,
    relatedArticles: ['understanding-results', 'exporting-sharing', 'formatting-guide']
  },
  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    category: 'advanced',
    tags: ['privacy', 'security', 'data', 'storage'],
    content: `
# Privacy & Security

Understanding how AudioTricks handles your data and maintains security.

## Data Flow

### What Happens to Your Audio
1. **Upload**: File sent directly to OpenAI
2. **Processing**: OpenAI processes and returns results
3. **Storage**: Results saved locally in browser
4. **No Server Storage**: We don't store your files

### API Key Security
- Stored in browser localStorage
- Never sent to our servers
- Used only for OpenAI API calls
- Encrypted by browser

## Local Storage

### What's Stored Locally
- Your API key
- Processing history
- User preferences
- Current session data

### Storage Limits
- Browser-specific limits apply
- Usually 5-10MB available
- Old items auto-removed if full
- Cleared with browser data

## Network Security

### HTTPS Only
- All connections encrypted
- Secure data transmission
- Certificate verification
- No plain text transfer

### Direct API Calls
- Browser → OpenAI directly
- No intermediary servers
- Reduces attack surface
- Your data stays private

## Best Practices

### For Sensitive Audio
1. **Use private browsing** for one-time use
2. **Clear history** after processing
3. **Export and delete** from browser
4. **Don't share** API keys

### Account Security
1. **Strong passwords** for access
2. **Unique API keys** per service
3. **Monitor usage** regularly
4. **Revoke compromised** keys

## Data Retention

### In AudioTricks
- History: Until you delete
- Settings: Until cleared
- Session: Until logout
- No server backups

### At OpenAI
- Check OpenAI's privacy policy
- Temporary processing storage
- No long-term retention
- GDPR compliant

## Compliance

### GDPR Considerations
- Local storage only
- User controls all data
- Export capabilities
- Complete deletion possible

### Corporate Use
- Check company policies
- Consider data classification
- Use appropriate networks
- Follow security guidelines

## Security Features

### Password Protection
- Required for access
- Set by administrator
- Session-based
- Not stored in browser

### API Key Protection
- Hidden display (••••)
- Local storage only
- Per-browser isolation
- Manual entry required

## Clearing Your Data

### Remove Everything
1. Clear browser data
2. Include localStorage
3. Removes all AudioTricks data
4. Fresh start

### Selective Removal
- Delete individual history items
- Change API key anytime
- Reset settings to default
- Logout clears session

## Recommendations

### High Security Needs
1. Use dedicated browser profile
2. Clear after each session
3. Don't save password
4. Monitor API usage

### Regular Use
1. Keep browser updated
2. Use strong passwords
3. Review history regularly
4. Export important data

## Questions to Ask

Before processing sensitive audio:
1. Is this classified/confidential?
2. Am I on a secure network?
3. Do I need to retain results?
4. Should I use a separate API key?
    `,
    relatedArticles: ['api-key-setup', 'using-history', 'best-practices']
  },
  {
    id: 'large-files',
    title: 'Processing Large Audio Files',
    category: 'advanced',
    tags: ['large files', 'splitting', 'chunks', 'processing'],
    content: `
# Processing Large Audio Files

AudioTricks can handle audio files up to 100MB by automatically splitting them into smaller chunks for processing.

## How It Works

### Automatic Splitting
- Files over 25MB are automatically split into chunks
- Each chunk is processed separately using OpenAI's Whisper API
- Results are intelligently merged back together
- Timestamps are preserved and adjusted correctly

### What You'll See
1. **Upload**: Normal upload process (up to 100MB)
2. **Processing**: Console shows "splitting into chunks" message
3. **Progress**: Each chunk is processed individually
4. **Results**: Merged transcript with correct timestamps

## Benefits

### No Quality Loss
- Audio is split at natural boundaries
- No compression or quality reduction
- Full fidelity maintained

### Accurate Timestamps
- Timestamps are preserved from original file
- Segments are properly aligned
- Timeline remains accurate

### Seamless Experience
- No additional steps required
- Automatic detection and handling
- Same output format as smaller files

## Technical Details

### File Size Limits
- Maximum upload: 100MB
- Auto-split threshold: 25MB
- Chunk size: ~24MB (safe margin)

### Supported Formats
All standard formats support splitting:
- MP3
- WAV
- M4A
- FLAC
- OGG
- OPUS

### Processing Time
- Larger files take longer to process
- Each chunk is processed sequentially
- Total time depends on file size and content

## Tips for Large Files

### Best Practices
1. **Use compressed formats** (MP3 recommended)
2. **Remove silence** from beginning/end
3. **Split manually** if you need specific segments
4. **Check audio quality** before upload

### Troubleshooting
- **Slow processing**: Normal for large files
- **Memory issues**: Try refreshing the page
- **Network timeouts**: Use stable connection
- **Quality issues**: Check source audio

### Alternative Solutions
- **Manual splitting**: Use audio editing software
- **Compression**: Reduce file size with audio tools
- **URL method**: Upload to cloud storage and use URL
- **Batch processing**: Process sections separately

## Cost Considerations

Large files use more API credits as they require multiple transcription calls. Monitor your usage in the OpenAI dashboard.
    `,
    relatedArticles: ['getting-started', 'troubleshooting', 'api-costs']
  },
  {
    id: 'voice-synthesis',
    title: 'Voice Synthesis with ElevenLabs',
    category: 'features',
    tags: ['voice synthesis', 'elevenlabs', 'text-to-speech', 'ai voice'],
    content: `
# Voice Synthesis with ElevenLabs

Transform your transcripts into natural-sounding speech using ElevenLabs' advanced AI voice technology.

## Getting Started

### API Key Setup
1. **Get ElevenLabs API Key**:
   - Visit [ElevenLabs](https://elevenlabs.io)
   - Sign up for an account
   - Navigate to your profile settings
   - Generate a new API key

2. **Add Key to AudioTricks**:
   - **Guest Mode**: Enter your key in the header (purple input field)
   - **Admin Mode**: Key is provided by administrator

### Accessing Voice Synthesis
1. Process any audio file to get a transcript
2. Click the **Audio Editor** tab in results
3. Switch to **Voice Synthesis** tab
4. Configure voice settings and generate

## Voice Selection

### Available Voices
- **Pre-built voices**: Over 50 professional voices
- **Multiple languages**: English, Spanish, French, German, and more
- **Various styles**: Narration, conversational, dramatic, etc.
- **Gender options**: Male, female, and neutral voices

### Voice Categories
- **Narration**: Perfect for audiobooks and documentaries
- **Conversational**: Natural dialogue and explanations
- **News**: Professional broadcast style
- **Characters**: Unique personalities and accents

## Voice Settings

### Stability (0.0 - 1.0)
- **Low (0.0-0.3)**: More expressive, variable
- **Medium (0.4-0.7)**: Balanced (recommended)
- **High (0.8-1.0)**: Consistent, stable

### Similarity Boost (0.0 - 1.0)
- **Low**: More creative interpretation
- **High**: Closer to original voice characteristics

### Style (0.0 - 1.0)
- **Natural (0.0-0.3)**: Conversational tone
- **Expressive (0.7-1.0)**: Dramatic, emotional

### Speaker Boost
- Enable for longer texts (over 1000 words)
- Improves voice consistency
- Uses additional processing power

## Generation Process

### Before Generation
1. **Review transcript**: Edit any unwanted words
2. **Select voice**: Preview different options
3. **Adjust settings**: Fine-tune voice parameters
4. **Check cost estimate**: Based on word count

### During Generation
- Progress indicator shows completion
- Process cannot be interrupted
- Large texts take longer (up to several minutes)

### After Generation
- **Play immediately**: Built-in audio player
- **Download**: Save as MP3 file
- **Regenerate**: Try different settings

## Best Practices

### For Best Results
1. **Clean transcript**: Remove filler words, errors
2. **Choose appropriate voice**: Match content style
3. **Test settings**: Try different voices/parameters
4. **Break long content**: Process in segments for better quality

### Voice Selection Tips
- **Narration**: Use dedicated narration voices
- **Conversation**: Choose conversational styles
- **Technical content**: Use clear, articulate voices
- **Entertainment**: Experiment with character voices

### Cost Management
- **Word count affects cost**: ~$0.30 per 1000 words
- **Preview first**: Test with shorter segments
- **Batch processing**: Group similar content
- **Monitor usage**: Check ElevenLabs dashboard

## Troubleshooting

### Common Issues
1. **"No voice selected"**: Choose a voice from the dropdown
2. **"API key invalid"**: Verify your ElevenLabs API key
3. **"Generation failed"**: Check internet connection
4. **"Poor quality"**: Try different voice or settings

### Quality Issues
- **Robotic sound**: Reduce stability, increase style
- **Inconsistent**: Enable speaker boost
- **Wrong pronunciation**: Edit transcript before generation
- **Choppy audio**: Check source transcript quality

### Performance Tips
- **Faster generation**: Use shorter texts
- **Better quality**: Use higher-quality voices
- **Consistent results**: Use same voice and settings
- **Cost optimization**: Remove unnecessary words

## Advanced Features

### Batch Processing
- Process multiple segments separately
- Maintain consistent voice across parts
- Combine results manually if needed

### Custom Voices
- ElevenLabs offers voice cloning
- Train on sample audio
- Create unique voice profiles
- Enterprise feature

### Integration
- Generated audio can be downloaded
- Compatible with video editing software
- Use for podcasts, audiobooks, presentations
- Export in standard MP3 format

## Supported Languages

- English (US, UK, Australian)
- Spanish
- French
- German
- Italian
- Portuguese
- Dutch
- Polish
- And more...

## Pricing

ElevenLabs pricing (approximate):
- **Free tier**: 10,000 characters/month
- **Starter**: $5/month for 30,000 characters
- **Creator**: $22/month for 100,000 characters
- **Pro**: $99/month for 500,000 characters

*Check ElevenLabs website for current pricing*
    `,
    relatedArticles: ['audio-editor', 'api-costs', 'advanced-features']
  },
  {
    id: 'audio-editor',
    title: 'Audio Editor and Word-Level Editing',
    category: 'features',
    tags: ['audio editor', 'word editing', 'timestamps', 'splicing'],
    content: `
# Audio Editor and Word-Level Editing

Edit your transcripts with precision using AudioTricks' advanced audio editor with word-level timestamp support.

## Overview

The Audio Editor provides:
- **Word-level timestamps**: Each word linked to audio position
- **Visual transcript**: Interactive text with audio sync
- **Precise editing**: Remove unwanted words/sections
- **Audio splicing**: Create custom audio clips
- **Voice synthesis**: Generate speech from edited text

## Accessing the Editor

1. **Process audio** to get transcript and summary
2. **Click Audio Editor tab** in results view
3. **Two modes available**:
   - **Edit Mode**: Word-level editing and audio splicing
   - **Voice Synthesis**: Generate speech from edited text

## Edit Mode Features

### Word-Level Interaction
- **Click words**: Jump to that point in audio
- **Select words**: Choose single or multiple words
- **Drag selection**: Select word ranges
- **Delete words**: Remove unwanted content
- **Restore words**: Undo deletions

### Audio Playback
- **Play/Pause**: Standard audio controls
- **Word sync**: Highlights current word during playback
- **Seek**: Click timeline to jump to position
- **Speed control**: Adjust playback speed

### Selection Tools
- **Click**: Select single word
- **Shift+Click**: Extend selection
- **Ctrl+Click**: Add to selection
- **Drag**: Select word range
- **Select All**: Keyboard shortcut (Ctrl+A)

## Word Editing

### Deleting Words
1. **Select target words** (click/drag)
2. **Press Delete** or use Delete button
3. **Words marked as deleted** (red strikethrough)
4. **Audio timeline updates** automatically

### Restoring Words
1. **Select deleted words** (shown in red)
2. **Press Restore** or use Restore button
3. **Words return to transcript**
4. **Timeline recalculates**

### Advanced Selection
- **Sentence selection**: Double-click to select sentence
- **Paragraph selection**: Triple-click for paragraph
- **Time range**: Select by audio position
- **Pattern matching**: Find similar words/phrases

## Audio Splicing

### Creating Clips
1. **Select word range** for your clip
2. **Click "Create Clip"** button
3. **Audio segment extracted** automatically
4. **Download clip** as MP3 file

### Clip Features
- **Precise timing**: Based on word boundaries
- **Fade in/out**: Automatic smooth transitions
- **Quality preservation**: No audio degradation
- **Multiple formats**: MP3, WAV export options

### Use Cases
- **Highlight extraction**: Pull key quotes
- **Content creation**: Create social media clips
- **Presentation prep**: Extract important segments
- **Quality control**: Remove problematic sections

## Voice Synthesis Integration

### From Edited Text
1. **Edit transcript** as desired
2. **Switch to Voice Synthesis tab**
3. **Text automatically updated** with your edits
4. **Generate speech** from clean transcript

### Benefits
- **Clean output**: Remove filler words, errors
- **Custom content**: Create ideal version
- **Multiple voices**: Try different speakers
- **Professional results**: Polished final audio

## Keyboard Shortcuts

### Navigation
- **Space**: Play/Pause
- **←/→**: Skip words
- **↑/↓**: Adjust volume
- **Home/End**: Go to start/end

### Editing
- **Delete**: Remove selected words
- **Ctrl+Z**: Undo last action
- **Ctrl+Y**: Redo action
- **Ctrl+A**: Select all
- **Escape**: Clear selection

### Advanced
- **Shift+Click**: Extend selection
- **Ctrl+Click**: Add to selection
- **Ctrl+S**: Save current state
- **F**: Find text

## Technical Details

### Timestamp Precision
- **Word-level accuracy**: ±100ms typical
- **Whisper-based**: Uses OpenAI's timestamp data
- **Automatic alignment**: Syncs text with audio
- **Cross-platform**: Works in all browsers

### Audio Processing
- **Web Audio API**: Real-time processing
- **No server upload**: Client-side processing
- **Format support**: MP3, WAV, M4A, FLAC
- **Quality preservation**: Lossless editing

### Performance
- **Efficient rendering**: Handles long transcripts
- **Smooth playback**: Optimized audio engine
- **Responsive UI**: Real-time updates
- **Memory management**: Automatic cleanup

## Best Practices

### For Accuracy
1. **Use high-quality audio**: Clear speech improves timestamps
2. **Check alignment**: Verify word timing before editing
3. **Small edits first**: Test with minor changes
4. **Save frequently**: Preserve your work

### For Efficiency
1. **Plan edits**: Know what you want to remove
2. **Use keyboard shortcuts**: Faster than mouse
3. **Work in sections**: Break up long transcripts
4. **Preview changes**: Listen before finalizing

### For Quality
1. **Natural flow**: Maintain sentence structure
2. **Smooth transitions**: Avoid abrupt cuts
3. **Context preservation**: Keep meaning intact
4. **Final review**: Listen to complete result

## Troubleshooting

### Common Issues
1. **Words not syncing**: Check audio quality
2. **Timestamps off**: Regenerate with better audio
3. **Selection not working**: Clear cache, refresh
4. **Audio won't play**: Check browser compatibility

### Performance Issues
- **Slow loading**: Large files take time
- **Memory usage**: Close other tabs
- **Playback stuttering**: Reduce browser load
- **Sync drift**: Refresh and try again

### Browser Compatibility
- **Chrome**: Full support (recommended)
- **Firefox**: Good support
- **Safari**: Basic support
- **Edge**: Full support

## Future Features

Coming soon:
- **Real-time collaboration**: Share editing sessions
- **Advanced audio effects**: Noise reduction, EQ
- **Batch processing**: Edit multiple files
- **Export options**: More formats and quality levels
    `,
    relatedArticles: ['voice-synthesis', 'understanding-results', 'advanced-features']
  },
  {
    id: 'history-recovery',
    title: 'Recovering Lost History',
    category: 'troubleshooting',
    tags: ['history', 'recovery', 'lost data', 'backup'],
    content: `
# Recovering Lost History

If you've lost your AudioTricks history, this guide will help you recover your previous transcripts and summaries.

## Quick Recovery

### Using Built-in Recovery Tool
1. **Open History dropdown** (clock icon in header)
2. **Click "Recover Lost History"** button
3. **Tool searches** all localStorage keys
4. **Recovered items** automatically added to history

### What Gets Recovered
- **Transcripts**: Complete text from audio
- **Summaries**: AI-generated summaries
- **Key moments**: Timestamped highlights
- **Metadata**: Duration, word count, processing info

## How Recovery Works

### Search Process
The recovery tool searches for data in multiple formats:
- **Current format**: audioTricks_history
- **Legacy formats**: audioTricksResults, openai_results
- **Alternative keys**: Various naming conventions
- **Backup locations**: Multiple storage attempts

### Data Conversion
- **Format migration**: Old formats converted to new
- **Duplicate removal**: Prevents multiple copies
- **Quality check**: Validates recovered data
- **Metadata reconstruction**: Rebuilds missing info

### Recovery Sources
1. **Primary storage**: audioTricks_history
2. **Legacy storage**: Old AudioTricks versions
3. **Session backup**: Temporary session data
4. **Browser cache**: Cached processing results

## Manual Recovery

### Browser Developer Tools
1. **Open Developer Tools** (F12)
2. **Go to Application/Storage tab**
3. **Check localStorage section**
4. **Look for AudioTricks-related keys**
5. **Copy data and contact support**

### localStorage Keys to Check
- `audioTricks_history`
- `audioTricksResults`
- `openai_results`
- `transcription_history`
- `audio_history`

### Data Export
Before recovery:
1. **Export current data** (if any exists)
2. **Save important transcripts** as TXT/JSON
3. **Backup browser data** regularly
4. **Use cloud storage** for critical files

## Common Scenarios

### Browser Cache Cleared
- **Recovery possible**: Data might still exist
- **Check recovery tool**: Often finds cached data
- **Look for exports**: Previously saved files
- **Contact support**: For complex recovery

### Browser Updated/Crashed
- **High success rate**: localStorage usually preserved
- **Run recovery tool**: First step
- **Check browser backup**: Some browsers auto-backup
- **Session restore**: May contain recent data

### Switched Browsers
- **Data not transferred**: Each browser separate
- **Export/import needed**: Manual transfer required
- **Recovery tool won't help**: Only searches current browser
- **Use sync services**: For future prevention

### Accidental Deletion
- **Immediate recovery**: Best success rate
- **Don't close browser**: Data might still be cached
- **Run recovery tool**: Check for backups
- **Check recycle bin**: For exported files

## Prevention Tips

### Regular Backups
1. **Export frequently**: Save important transcripts
2. **Use cloud storage**: Google Drive, Dropbox
3. **Multiple formats**: TXT and JSON exports
4. **Browser sync**: Enable if available

### Best Practices
1. **Don't clear browser data**: Without export first
2. **Use bookmarks**: Save important sessions
3. **Regular maintenance**: Clean up old items
4. **Test recovery**: Verify backup process

### Alternative Storage
- **Cloud notes**: Copy to Google Docs, Notion
- **Email yourself**: Important transcripts
- **Use version control**: Git for developers
- **Physical backup**: Print critical content

## Advanced Recovery

### Browser Forensics
For technical users:
1. **Check browser profiles**: Multiple user accounts
2. **Look for backup files**: Browser-specific locations
3. **Use recovery software**: Undelete tools
4. **Check system backups**: Time Machine, System Restore

### Data Locations
- **Chrome**: `%APPDATA%/Google/Chrome/User Data/Default/Local Storage`
- **Firefox**: `%APPDATA%/Mozilla/Firefox/Profiles/[profile]/storage/default`
- **Safari**: `~/Library/Safari/LocalStorage`
- **Edge**: `%APPDATA%/Microsoft/Edge/User Data/Default/Local Storage`

### Third-Party Tools
- **Browser data recovery**: Specialized software
- **localStorage extractors**: Developer tools
- **System file recovery**: After drive issues
- **Cloud sync recovery**: If sync was enabled

## Support and Help

### When to Contact Support
1. **Recovery tool fails**: No data found
2. **Corrupted data**: Found but can't parse
3. **Partial recovery**: Missing important items
4. **Technical issues**: Browser compatibility

### Information to Provide
- **Browser and version**: Chrome 91, Firefox 89, etc.
- **Operating system**: Windows, Mac, Linux
- **Error messages**: Exact text from console
- **Data size**: Approximate amount lost
- **Timeline**: When data was last seen

### Self-Help Resources
- **Browser console**: Check for error messages
- **Community forums**: User experiences
- **Documentation**: This help system
- **Video tutorials**: Step-by-step guides

## Recovery Success Rates

### Typical Success Rates
- **Recent loss**: 90-95% recovery
- **Browser cleared**: 70-80% recovery
- **System issues**: 50-60% recovery
- **Multiple browsers**: 30-40% recovery

### Factors Affecting Recovery
- **Time since loss**: Sooner is better
- **Browser activity**: Less activity = better chance
- **System changes**: Updates may affect recovery
- **Storage method**: How data was originally stored

Remember: The recovery tool is your best first step. It's designed to handle most common recovery scenarios automatically.
    `,
    relatedArticles: ['using-history', 'troubleshooting-api', 'best-practices']
  }
]

export const helpCategories = [
  { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
  { id: 'features', name: 'Features', icon: '✨' },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
  { id: 'api-costs', name: 'API Costs', icon: '💰' },
  { id: 'advanced', name: 'Advanced', icon: '🔬' }
]

export function searchArticles(query: string): HelpArticle[] {
  const lowerQuery = query.toLowerCase()
  return helpArticles.filter(article => 
    article.title.toLowerCase().includes(lowerQuery) ||
    article.content.toLowerCase().includes(lowerQuery) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export function getArticlesByCategory(category: string): HelpArticle[] {
  return helpArticles.filter(article => article.category === category)
}

export function getArticleById(id: string): HelpArticle | undefined {
  return helpArticles.find(article => article.id === id)
}

export function getRelatedArticles(articleId: string): HelpArticle[] {
  const article = getArticleById(articleId)
  if (!article || !article.relatedArticles) return []
  
  return article.relatedArticles
    .map(id => getArticleById(id))
    .filter((a): a is HelpArticle => a !== undefined)
}