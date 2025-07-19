import { HelpArticle } from '../types'

export const largeFilesArticle: HelpArticle = {
  id: 'large-files',
  title: 'Processing Large Audio Files',
  category: 'advanced',
  tags: ['large files', 'splitting', 'chunks', 'processing'],
  content: `
# Processing Large Audio Files

AudioTricks can handle audio files up to 150MB through automatic splitting and processing.

## How It Works

### Automatic Splitting
- Files over 25MB are automatically split into chunks
- Each chunk is processed separately
- Results are seamlessly merged
- No quality loss or gaps

### Processing Flow
1. **Upload Detection**: File size checked
2. **Smart Splitting**: Audio split at natural boundaries  
3. **Parallel Processing**: Chunks processed via OpenAI
4. **Result Merging**: Transcripts combined intelligently
5. **Final Output**: Unified transcript and summary

## Benefits

### No Quality Loss
- Audio split at silence points
- Overlapping segments ensure continuity
- Sentence boundaries preserved
- Natural speech flow maintained

### Accurate Timestamps
- Original file timing preserved
- Seamless timestamp continuity
- Click-to-play works across chunks
- No timing drift or gaps

### Transparent Process
- Automatic handling
- Progress shown for each chunk
- No manual intervention needed
- Same interface for all sizes

## Technical Details

### Size Limits
- **Maximum Upload**: 150MB
- **Auto-Split Threshold**: 25MB
- **Chunk Size**: ~24MB each
- **OpenAI Limit**: 25MB per API call

### Supported Formats
All formats work with splitting:
- MP3 (recommended)
- WAV (larger files)
- M4A
- FLAC
- OGG/OPUS

### Processing Time
Typical processing times:
- **25-50MB**: 2-4 minutes
- **50-100MB**: 4-8 minutes
- **100-150MB**: 8-12 minutes

*Times vary based on audio content and API load*

## Best Practices

### For Optimal Results
1. **Use MP3 Format**: Best compression/quality ratio
2. **Remove Silence**: Trim long pauses
3. **Check Quality**: Higher quality = better results
4. **Stable Connection**: Prevent timeout issues

### File Preparation
- **Compress if needed**: 128-192 kbps sufficient
- **Single track**: Mono often smaller
- **Clean audio**: Remove noise if possible
- **Continuous content**: Avoid multiple files

## Common Issues

### Slow Processing
**Normal for large files** - Be patient
- Don't refresh the page
- Check progress indicators
- Allow 10-15 minutes for very large files

### Memory Issues
**Browser limitations** - If errors occur:
1. Close other tabs
2. Restart browser
3. Try smaller file
4. Use a desktop browser

### Network Timeouts
**Connection problems** - Solutions:
- Use stable internet
- Avoid VPN if slow
- Try during off-peak hours
- Consider splitting manually

## Alternative Solutions

### Manual Splitting
For more control:
1. Use audio software (Audacity)
2. Split into <25MB segments
3. Process individually
4. Combine results manually

### Compression Options
Reduce file size:
- Lower bitrate (96-128 kbps)
- Convert to mono
- Trim unnecessary sections
- Use efficient codecs

### URL Method
For large files online:
1. Upload to cloud storage
2. Get direct download link
3. Use URL input method
4. Let system handle downloading

### Batch Processing
For multiple files:
1. Process separately
2. Use history feature
3. Export and combine
4. Maintain organization

## Cost Considerations

### Pricing Impact
- Large files use more API credits
- Charged per minute of audio
- Multiple chunks = multiple calls
- Same per-minute rate applies

### Estimates
- **30 min audio**: ~$0.28
- **60 min audio**: ~$0.51
- **90 min audio**: ~$0.73
- **120 min audio**: ~$0.94

## Advanced Tips

### Monitoring Progress
- Watch chunk indicators
- Note any failed chunks
- Check final word count
- Verify complete transcript

### Quality Optimization
1. **Pre-process audio**: Normalize levels
2. **Remove background**: Noise reduction
3. **Split speakers**: If possible
4. **Use lossless**: For critical content

### Troubleshooting
If chunks fail:
1. Note which chunk failed
2. Check file corruption
3. Try re-uploading
4. Contact support if persistent

Remember: Large file processing is automatic and reliable. Trust the system and be patient with longer processing times.
  `,
  relatedArticles: ['uploading-audio', 'troubleshooting-api', 'api-costs']
}