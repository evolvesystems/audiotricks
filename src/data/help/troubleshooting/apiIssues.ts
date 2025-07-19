import { HelpArticle } from '../types'

export const apiIssuesArticle: HelpArticle = {
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
1. **File too large** (over 150MB)
2. **Unsupported format**
3. **Corrupted audio file**
4. **Network timeout**

**Solutions**:
- Compress audio to under 150MB (files over 25MB are automatically split)
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
}