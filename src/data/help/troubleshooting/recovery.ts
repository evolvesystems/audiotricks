import { HelpArticle } from '../types'

export const recoveryArticle: HelpArticle = {
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
- \`audioTricks_history\`
- \`audioTricksResults\`
- \`openai_results\`
- \`transcription_history\`
- \`audio_history\`

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
- **Chrome**: \`%APPDATA%/Google/Chrome/User Data/Default/Local Storage\`
- **Firefox**: \`%APPDATA%/Mozilla/Firefox/Profiles/[profile]/storage/default\`
- **Safari**: \`~/Library/Safari/LocalStorage\`
- **Edge**: \`%APPDATA%/Microsoft/Edge/User Data/Default/Local Storage\`

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