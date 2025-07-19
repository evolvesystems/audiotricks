import { HelpArticle } from './types'

export const apiCostsArticles: HelpArticle[] = [
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
  }
]