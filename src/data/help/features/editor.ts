import { HelpArticle } from '../types'

export const editorArticles: HelpArticle[] = [
  {
    id: 'podcasts-tab',
    title: 'Using the Podcasts Tab',
    category: 'features',
    tags: ['podcasts', 'editing', 'formatting', 'html', 'markdown'],
    content: `
# Using the Podcasts Tab

The Podcasts tab transforms your transcript into editable, shareable content perfect for blogs, notes, or publications.

## Overview

The Podcasts tab provides:
- Rich text editor
- Multiple view modes
- Format conversion tools
- Export options

## Editor Features

### Rich Text Editing
- **Bold**: Highlight important points
- **Italic**: Emphasize words
- **Headings**: Organize sections (H1-H3)
- **Lists**: Bullet and numbered
- **Links**: Add hyperlinks

### Toolbar Options
1. **Format**: Paragraph, headings
2. **Bold/Italic**: Text emphasis
3. **Lists**: Ordered/unordered
4. **Link**: Add URLs
5. **Clear**: Remove formatting

## View Modes

### Edit Mode
- Full editing capabilities
- Toolbar visible
- Real-time formatting

### Preview Mode
- See final appearance
- No editing tools
- Print-friendly view

### HTML Mode
- Raw HTML code
- Copy for websites
- Advanced editing

## Content Formatting

### Best Practices
1. **Add Section Headers**: Break up long content
2. **Bold Key Points**: Make scanning easier
3. **Use Lists**: For multiple items
4. **Short Paragraphs**: Improve readability
5. **Remove Filler**: Clean up "um", "uh"

### Conversion Options
- **Copy as HTML**: For websites/blogs
- **Copy as Markdown**: For documentation
- **Copy as Plain Text**: For simple notes

## Use Cases

### Meeting Notes
1. Add agenda headers
2. Bold action items
3. List decisions made
4. Export for sharing

### Blog Posts
1. Create engaging title
2. Add introduction
3. Format key sections
4. Include call-to-action

### Educational Content
1. Organize by topics
2. Highlight key concepts
3. Add summary section
4. Create study notes

## Keyboard Shortcuts

- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo
- **Ctrl/Cmd + A**: Select all
- **Ctrl/Cmd + C**: Copy
- **Ctrl/Cmd + V**: Paste

## Tips and Tricks

### Cleaning Transcripts
1. Remove verbal fillers
2. Fix obvious errors
3. Add punctuation
4. Combine fragmented sentences

### Enhancing Content
1. Add context where needed
2. Insert section breaks
3. Include speaker names
4. Format quotes properly

### Sharing Options
1. Copy formatted text
2. Export as HTML file
3. Print to PDF
4. Share via email
    `,
    relatedArticles: ['understanding-results', 'exporting-sharing', 'formatting-guide']
  }
]