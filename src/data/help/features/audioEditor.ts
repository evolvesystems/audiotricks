import { HelpArticle } from '../types'

export const audioEditorArticles: HelpArticle[] = [
  {
    id: 'audio-editor',
    title: 'Audio Editor and Word-Level Editing',
    category: 'features',
    tags: ['audio editor', 'word editing', 'timestamps', 'splicing'],
    content: `
# Audio Editor and Word-Level Editing

The Audio Editor provides precise, word-level control over your transcripts and audio, enabling professional editing capabilities right in your browser.

## Overview

The Audio Editor offers:
- **Word-level timestamps** for every word
- **Visual transcript** with audio sync
- **Click-to-play** from any word
- **Audio splicing** and export
- **Integration** with Voice Synthesis

## Getting Started

### Accessing the Editor
1. Process any audio file
2. Click the "Audio Editor" tab in results
3. Wait for word timestamps to load
4. Begin editing

### Interface Overview
- **Top**: Audio player with waveform
- **Middle**: Toolbar with edit controls
- **Bottom**: Interactive transcript

## Edit Mode Features

### Word-Level Interaction
- **Click any word**: Jump to that position in audio
- **Click and drag**: Select word ranges
- **Double-click**: Select entire sentence
- **Triple-click**: Select paragraph

### Editing Actions
- **Delete words**: Remove selected words
- **Restore words**: Undo deletions
- **Copy text**: Standard copy/paste
- **Audio sync**: Maintains timing

### Visual Feedback
- **Current word**: Highlighted during playback
- **Deleted words**: Shown with strikethrough
- **Selected words**: Blue highlight
- **Playback position**: Waveform indicator

## Audio Splicing

### Creating Clips
1. Select desired word range
2. Click "Create Clip from Selection"
3. System generates audio segment
4. Automatic fade in/out applied

### Splice Options
- **Format**: MP3 or WAV
- **Quality**: High quality maintained
- **Processing**: Client-side (private)
- **Length**: Any duration

### Use Cases
- Extract key quotes
- Create highlight reels
- Remove sensitive content
- Generate social media clips

## Keyboard Shortcuts

### Playback Control
- **Space**: Play/Pause
- **←/→**: Skip back/forward 5 seconds
- **↑/↓**: Volume control
- **Shift + ←/→**: Jump to previous/next word

### Editing
- **Delete**: Remove selected words
- **Ctrl/Cmd + Z**: Undo last action
- **Ctrl/Cmd + Y**: Redo action
- **Ctrl/Cmd + A**: Select all
- **Ctrl/Cmd + C**: Copy selection

## Voice Synthesis Integration

### Workflow
1. Edit transcript in Audio Editor
2. Remove unwanted sections
3. Fix any errors
4. Switch to Voice Synthesis tab
5. Generate speech from edited text

### Benefits
- Clean transcript for better synthesis
- Remove filler words easily
- Adjust content before generating
- Create multiple versions

## Technical Details

### Timestamp Accuracy
- ±100ms precision
- Whisper API word-level timing
- Automatic alignment
- Gap handling

### Performance
- Handles hours of audio
- Smooth playback
- Real-time updates
- Minimal memory usage

### Browser Support
- Chrome: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

## Best Practices

### For Best Results
1. **Use quality audio**: Better input = better timestamps
2. **Plan your edits**: Know what to remove/keep
3. **Save frequently**: Export edited versions
4. **Test clips**: Play before exporting

### Editing Tips
1. **Remove filler words**: "um", "uh", "you know"
2. **Tighten pauses**: Delete long silences
3. **Fix false starts**: Remove repeated phrases
4. **Maintain flow**: Keep natural speech rhythm

### Common Workflows

#### Podcast Editing
1. Remove pre-show chatter
2. Cut out mistakes
3. Tighten conversations
4. Export clean version

#### Meeting Minutes
1. Extract action items
2. Remove off-topic discussion
3. Create highlight summary
4. Share key decisions

#### Interview Cleanup
1. Remove interviewer prompts
2. Extract best quotes
3. Create social media clips
4. Generate clean transcript

## Troubleshooting

### Audio Not Playing
- Check browser audio permissions
- Ensure file still in browser cache
- Try refreshing the page
- Re-upload if needed

### Timestamps Misaligned
- Usually due to audio quality
- Try reprocessing
- Manual adjustment not available
- Contact support for help

### Export Issues
- Check browser download settings
- Ensure enough disk space
- Try different format (MP3/WAV)
- Use shorter selections
    `,
    relatedArticles: ['voice-synthesis', 'understanding-results', 'advanced-features']
  }
]