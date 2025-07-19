import { HelpArticle } from '../types'

export const privacyArticle: HelpArticle = {
  id: 'privacy-security',
  title: 'Privacy & Security',
  category: 'advanced',
  tags: ['privacy', 'security', 'data', 'storage'],
  content: `
# Privacy & Security

Understanding how AudioTricks handles your data and maintains security.

## Data Flow

### How Your Data Moves
1. **Audio Upload**: File sent directly to OpenAI
2. **Processing**: OpenAI processes and returns results
3. **Storage**: Results saved locally in your browser
4. **No Server Storage**: We don't store your data

### What We DON'T Do
- Store your audio files
- Save your transcripts on servers
- Have access to your API keys
- Track your usage or content
- Share data with third parties

## API Key Security

### Storage
- **Location**: Browser's localStorage
- **Encryption**: Browser-level encryption
- **Access**: Only your browser can read it
- **Transmission**: Never sent to our servers

### Usage
- **Direct Calls**: Browser → OpenAI API
- **No Proxy**: No intermediary servers
- **Secure**: HTTPS encryption
- **Isolated**: Each user's key is separate

## Local Storage Details

### What's Stored
1. **API Keys**: OpenAI and ElevenLabs
2. **History**: Up to 50 recent transcripts
3. **Preferences**: Settings and options
4. **Session**: Current working data

### Storage Limits
- **Total Size**: 5-10MB typical
- **Per Item**: ~100-200KB
- **Auto-Cleanup**: Old items removed
- **Browser Specific**: Not shared

## Network Security

### Connections
- **HTTPS Only**: All connections encrypted
- **API Security**: OpenAI's security measures
- **CORS Handling**: Secure proxy for URLs
- **No Tracking**: No analytics on content

### Data in Transit
- **Encrypted**: TLS 1.2+ encryption
- **Direct**: Browser to API only
- **Temporary**: Not stored in transit
- **Verified**: Certificate validation

## Best Practices

### For Sensitive Audio
1. **Pre-Screen**: Review before uploading
2. **Local Only**: Use file upload, not URLs
3. **Clear History**: Delete after use
4. **Private Browsing**: Use incognito mode

### Account Security
1. **Unique Password**: Don't reuse passwords
2. **Secure API Keys**: Treat like passwords
3. **Monitor Usage**: Check OpenAI dashboard
4. **Rotate Keys**: Periodically update

### Browser Security
1. **Keep Updated**: Use latest browser
2. **HTTPS Only**: Check for padlock
3. **Trusted Networks**: Avoid public WiFi
4. **Clear Data**: When switching users

## Data Retention

### Local Browser
- **Persistent**: Until manually cleared
- **Automatic**: Old items removed at 50
- **Exportable**: Save important data
- **Clearable**: Settings → Clear History

### OpenAI Side
- **Temporary**: Processing only
- **Not Stored**: After processing
- **GDPR Compliant**: Right to deletion
- **API Terms**: Follow OpenAI policies

## Compliance

### GDPR Considerations
- **Local Storage**: User-controlled
- **No Servers**: No data controller
- **User Rights**: Full control of data
- **Deletion**: Immediate and complete

### Corporate Use
- **API Keys**: Use corporate accounts
- **Policies**: Follow company guidelines
- **Data Classification**: Check audio sensitivity
- **Audit Trail**: Export for records

## Security Features

### Password Protection
- **Access Control**: Required for entry
- **Session-Based**: Until browser closes
- **No Storage**: Password not saved
- **Admin Set**: Contact for changes

### API Key Protection
- **Masked Display**: Hidden by default
- **Local Only**: Never transmitted
- **Secure Input**: Password field type
- **Clear Option**: Remove anytime

## Data Clearing

### Complete Removal
1. Settings → Clear All Data
2. Browser Settings → Clear Site Data
3. Developer Tools → Clear localStorage
4. Uninstall/Clear Browser

### Selective Clearing
- **History Only**: Clear specific items
- **API Keys**: Remove independently
- **Preferences**: Reset to defaults
- **Cache**: Browser cache clear

## Recommendations

### High Security Needs
1. Use dedicated browser profile
2. Clear after each session
3. Use VPN for extra security
4. Export and store securely

### Regular Use
1. Monitor history size
2. Export important results
3. Update API keys regularly
4. Use strong passwords

Remember: Your security is in your hands. AudioTricks provides the tools, but proper usage ensures protection.
  `,
  relatedArticles: ['api-key-setup', 'using-history', 'best-practices']
}