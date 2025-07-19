import { HelpArticle } from '../types'

export const processingArticles: HelpArticle[] = [
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
- Professional, structured format
- Clear sections and bullet points
- Best for: Business meetings, lectures, reports

### Creative
- Engaging, narrative style
- More descriptive language
- Best for: Storytelling, creative content

### Conversational
- Casual, friendly tone
- Natural language flow
- Best for: Podcasts, interviews, casual content

## Language Options

### Input Language
- Automatically detected from your audio
- Supports 50+ languages

### Output Language
Choose from:
- English
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Italian (Italiano)
- Portuguese (Português)
- Dutch (Nederlands)
- Japanese (日本語)
- Korean (한국어)
- Chinese (中文)

## Advanced Settings

### Temperature (0.0 - 1.0)
- **0.0**: Most focused, consistent output
- **0.5**: Balanced creativity and accuracy
- **1.0**: Most creative, varied output
- Default: 0.3

### Max Tokens (500 - 4000)
- Controls summary length
- **500**: Very concise summary
- **1500**: Standard summary (default)
- **4000**: Detailed, comprehensive summary

## Saving Your Preferences

1. Click the Settings icon in the header
2. Adjust your preferred defaults
3. Settings are saved locally
4. Applied to all future processing

## Best Practices

- Match style to your content purpose
- Consider your audience
- Use higher temperatures for creative content
- Use lower temperatures for technical content
- Balance token count with needed detail
    `,
    relatedArticles: ['summary-styles-explained', 'advanced-settings']
  }
]