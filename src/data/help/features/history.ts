import { HelpArticle } from '../types'

export const historyArticles: HelpArticle[] = [
  {
    id: 'using-history',
    title: 'Using the History Feature',
    category: 'features',
    tags: ['history', 'search', 'saved', 'previous'],
    content: `
# Using the History Feature

The History feature automatically saves all your processed audio results for easy access later.

## Accessing History

Click the **clock icon** in the header to open the history panel.

## History Features

### Automatic Saving
- Every processed audio is saved automatically
- No manual save needed
- Includes all results and metadata

### History List
Shows for each item:
- Title (filename or URL)
- Processing date and time
- Duration
- Quick actions (view/delete)

### Search Functionality
- Search box at the top
- Searches through:
  - Titles
  - Transcripts
  - Summaries
  - Key moments
- Real-time results as you type

## Managing History

### Viewing Past Results
1. Click on any history item
2. Results load in main view
3. All tabs and features available
4. Can re-export or edit

### Deleting Items
- Hover over item → click trash icon
- Confirms before deleting
- Cannot be undone

### History Recovery
If history appears lost:
1. Open Settings
2. Click "Recover History"
3. System searches for backup data
4. Restores any found items

### Clear All History
1. Open Settings
2. Click "Clear All History"
3. Confirm the action
4. All items permanently deleted

## Storage Details

### Capacity
- Maximum 50 items
- Older items auto-removed when full
- Each item ~100-200KB

### Location
- Browser's localStorage
- Device-specific
- Not synced across devices

### Privacy
- Stored locally only
- Never sent to servers
- Cleared with browser data

## Best Practices

1. **Export Important Results**: Don't rely solely on history
2. **Use Descriptive Filenames**: Easier to search later
3. **Regular Cleanup**: Delete unneeded items
4. **Search Tips**: Use unique keywords
5. **Backup**: Export critical transcripts

## Troubleshooting

### History Not Saving
- Check browser storage settings
- Ensure not in private/incognito mode
- Clear some space if full

### Can't Find Item
- Try different search terms
- Check if over 50 item limit
- May have been auto-deleted

### History Lost
- Use recovery feature
- Check browser didn't clear data
- Enable browser data persistence
    `,
    relatedArticles: ['understanding-results', 'exporting-sharing', 'privacy-security', 'history-recovery']
  }
]