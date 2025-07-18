import { HistoryItem } from '../hooks/useHistory'

// Keys to check for recovery
const RECOVERY_KEYS = [
  'audioTricks_history',
  'audioTricksResults',
  'audioTricks_results',
  'openai_results',
  'transcription_history',
  'audio_history'
]

export const recoverHistory = (): HistoryItem[] => {
  const recoveredItems: HistoryItem[] = []
  
  console.log('🔍 Searching for lost history...')
  
  // Check each possible key
  RECOVERY_KEYS.forEach(key => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        console.log(`📦 Found data in ${key}:`, stored.substring(0, 100) + '...')
        
        const parsed = JSON.parse(stored)
        
        // Handle different formats
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any, index: number) => {
            const recoveredItem = convertToHistoryItem(item, index, key)
            if (recoveredItem) {
              recoveredItems.push(recoveredItem)
            }
          })
        } else if (parsed && typeof parsed === 'object') {
          // Single item
          const recoveredItem = convertToHistoryItem(parsed, 0, key)
          if (recoveredItem) {
            recoveredItems.push(recoveredItem)
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error parsing ${key}:`, error)
    }
  })
  
  // Remove duplicates based on content similarity
  const uniqueItems = removeDuplicates(recoveredItems)
  
  console.log(`✅ Recovered ${uniqueItems.length} unique items from ${recoveredItems.length} total`)
  
  return uniqueItems
}

const convertToHistoryItem = (item: any, index: number, source: string): HistoryItem | null => {
  try {
    // Try to extract required fields
    const transcript = item.transcript || item.text || ''
    const summary = item.summary || item.summary_text || ''
    
    if (!transcript && !summary) {
      console.log(`⚠️  Skipping item ${index} from ${source}: no transcript or summary`)
      return null
    }
    
    const historyItem: HistoryItem = {
      id: item.id || `recovered_${Date.now()}_${index}`,
      timestamp: item.timestamp || item.created_at || new Date().toISOString(),
      title: generateTitleFromData(item),
      duration: item.duration || item.total_duration || item.summary?.total_duration,
      wordCount: item.word_count || item.summary?.word_count || countWords(transcript),
      language: item.language || item.summary?.language || 'en',
      results: {
        transcript: {
          text: typeof transcript === 'string' ? transcript : transcript.text || '',
          duration: item.duration || item.total_duration || 0
        },
        summary: {
          summary: typeof summary === 'string' ? summary : summary.summary || '',
          key_moments: item.key_moments || item.summary?.key_moments || [],
          word_count: item.word_count || item.summary?.word_count || countWords(transcript),
          total_duration: item.duration || item.total_duration || 0,
          language: item.language || item.summary?.language || 'en'
        },
        processing_time: item.processing_time || 0,
        audioUrl: item.audioUrl || item.audio_url
      }
    }
    
    console.log(`✅ Converted item from ${source}:`, historyItem.title)
    return historyItem
  } catch (error) {
    console.error(`❌ Error converting item ${index} from ${source}:`, error)
    return null
  }
}

const generateTitleFromData = (item: any): string => {
  // Try various title sources
  if (item.title) return item.title
  
  // From summary
  if (item.summary) {
    const summaryText = typeof item.summary === 'string' ? item.summary : item.summary.summary
    if (summaryText) {
      const firstSentence = summaryText.split('.')[0]
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
        return firstSentence.trim()
      }
    }
  }
  
  // From transcript
  if (item.transcript) {
    const transcriptText = typeof item.transcript === 'string' ? item.transcript : item.transcript.text
    if (transcriptText) {
      const words = transcriptText.split(' ').slice(0, 10).join(' ')
      if (words.length > 20) {
        return words.substring(0, 50) + '...'
      }
    }
  }
  
  // Default
  return `Recovered Audio ${new Date().toLocaleDateString()}`
}

const countWords = (text: string): number => {
  if (!text || typeof text !== 'string') return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

const removeDuplicates = (items: HistoryItem[]): HistoryItem[] => {
  const seen = new Set<string>()
  return items.filter(item => {
    // Create a signature based on content
    const signature = `${item.title}_${item.wordCount}_${item.duration || 0}`
    if (seen.has(signature)) {
      return false
    }
    seen.add(signature)
    return true
  })
}

export const listAllLocalStorageKeys = (): string[] => {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      keys.push(key)
    }
  }
  return keys.sort()
}

export const inspectLocalStorageKey = (key: string): any => {
  try {
    const data = localStorage.getItem(key)
    if (!data) return null
    
    console.log(`🔍 Inspecting ${key}:`)
    console.log(`   Size: ${data.length} characters`)
    console.log(`   Preview: ${data.substring(0, 200)}...`)
    
    try {
      const parsed = JSON.parse(data)
      console.log(`   Type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`)
      if (Array.isArray(parsed)) {
        console.log(`   Items: ${parsed.length}`)
      }
      return parsed
    } catch {
      console.log(`   Type: String (not JSON)`)
      return data
    }
  } catch (error) {
    console.error(`❌ Error inspecting ${key}:`, error)
    return null
  }
}