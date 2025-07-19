import { HelpArticle } from '../types'

export const resultsArticles: HelpArticle[] = [
  {
    id: 'understanding-results',
    title: 'Understanding Your Results',
    category: 'features',
    tags: ['results', 'summary', 'transcript', 'key-moments', 'export'],
    content: `
# Understanding Your Results

After processing, AudioTricks provides comprehensive results in an organized, tabbed interface.

## Results Header

At the top, you'll see:
- **Duration**: Total audio length
- **Word Count**: Total words transcribed
- **Processing Time**: How long it took
- **Cost Estimate**: Approximate API cost

## The Four Tabs

### 1. Summary & Key Moments

This tab provides:
- **Executive Summary**: WHO, WHAT, WHY, HOW overview
- **Key Takeaways**: 8-12 important points
- **Key Moments**: 5-8 timestamped highlights

Each key moment includes:
- Timestamp (clickable to jump to that point)
- Brief description of what happens
- Why it's important

### 2. Full Transcript

The complete transcription with:
- Optional timestamps (toggle on/off)
- Speaker labels (when detected)
- Paragraph formatting
- Search functionality (Ctrl/Cmd + F)

### 3. Podcasts Tab

An editable version for creating content:
- Rich text editor
- Formatting tools
- Preview mode
- HTML/Markdown export

### 4. Audio Editor (NEW!)

Advanced editing features:
- Word-level timestamps
- Click words to play from that point
- Select and splice audio segments
- Export edited clips

## Exporting Results

### Export Formats
- **TXT**: Plain text, perfect for notes
- **JSON**: Structured data for developers

### What's Included
- Summary and key points
- Full transcript
- Timestamps
- Metadata

## Working with Results

### History
- All results automatically saved
- Access via clock icon
- Searchable
- Up to 50 items stored

### Sharing
- Export and share files
- Copy/paste sections
- Use Podcasts tab for formatted content

## Quality Indicators

Good results typically have:
- Clear, concise summary
- Accurate timestamps
- Relevant key moments
- Proper formatting
    `,
    relatedArticles: ['exporting-sharing', 'using-history', 'podcasts-tab', 'audio-editor', 'voice-synthesis']
  }
]