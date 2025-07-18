import { HistoryItem } from '../hooks/useHistory'

export interface DiagnosticResult {
  issues: string[]
  warnings: string[]
  suggestions: string[]
  dataIntegrity: {
    totalItems: number
    validItems: number
    invalidItems: number
    corruptedItems: number
    duplicateItems: number
  }
  storageAnalysis: {
    totalKeys: number
    historyKeys: string[]
    storageUsage: number
    quotaExceeded: boolean
  }
  migrationNeeded: boolean
}

export const performHistoryDiagnostic = (): DiagnosticResult => {
  const issues: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  
  console.log('🔍 Starting comprehensive history diagnostic...')
  
  // Check all localStorage keys
  const allKeys = Object.keys(localStorage)
  const historyKeys = allKeys.filter(key => 
    key.includes('history') || 
    key.includes('audioTricks') || 
    key.includes('openai') ||
    key.includes('transcription') ||
    key.includes('audio')
  )
  
  console.log('📊 Found storage keys:', historyKeys)
  
  // Calculate storage usage
  let storageUsage = 0
  let quotaExceeded = false
  
  try {
    const testData = 'x'.repeat(1024 * 1024) // 1MB test
    localStorage.setItem('__test__', testData)
    localStorage.removeItem('__test__')
  } catch (e) {
    quotaExceeded = true
    issues.push('localStorage quota exceeded - may cause data loss')
  }
  
  // Calculate current usage
  allKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      storageUsage += key.length + value.length
    }
  })
  
  // Analyze main history data
  const mainHistoryData = localStorage.getItem('audioTricks_history')
  let totalItems = 0
  let validItems = 0
  let invalidItems = 0
  let corruptedItems = 0
  let duplicateItems = 0
  
  if (mainHistoryData) {
    try {
      const parsed = JSON.parse(mainHistoryData)
      if (Array.isArray(parsed)) {
        totalItems = parsed.length
        const seenIds = new Set<string>()
        const seenContent = new Set<string>()
        
        parsed.forEach((item: any, index: number) => {
          try {
            // Check required fields
            if (!item.id || !item.timestamp || !item.results) {
              invalidItems++
              issues.push(`Item ${index} missing required fields`)
              return
            }
            
            // Check for duplicates
            if (seenIds.has(item.id)) {
              duplicateItems++
              warnings.push(`Duplicate ID found: ${item.id}`)
            }
            seenIds.add(item.id)
            
            // Check content duplicates
            const contentHash = JSON.stringify(item.results?.transcript?.text || '').substring(0, 100)
            if (seenContent.has(contentHash)) {
              duplicateItems++
              warnings.push(`Duplicate content found at index ${index}`)
            }
            seenContent.add(contentHash)
            
            // Validate structure
            if (!item.results.transcript || !item.results.summary) {
              invalidItems++
              issues.push(`Item ${index} has malformed results structure`)
              return
            }
            
            // Check for File objects that can't be serialized
            if (item.results.audioFile instanceof File) {
              warnings.push(`Item ${index} contains File object that may cause issues`)
            }
            
            validItems++
          } catch (itemError) {
            corruptedItems++
            issues.push(`Item ${index} is corrupted: ${itemError}`)
          }
        })
      } else {
        issues.push('Main history data is not an array')
      }
    } catch (parseError) {
      issues.push(`Cannot parse main history data: ${parseError}`)
    }
  } else {
    warnings.push('No main history data found')
  }
  
  // Check for migration opportunities
  let migrationNeeded = false
  const legacyKeys = ['audioTricksResults', 'openai_results', 'transcription_history']
  
  legacyKeys.forEach(key => {
    const data = localStorage.getItem(key)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed) && parsed.length > 0) {
          migrationNeeded = true
          suggestions.push(`Found ${parsed.length} items in legacy key '${key}' that could be migrated`)
        }
      } catch (e) {
        warnings.push(`Legacy key '${key}' contains invalid data`)
      }
    }
  })
  
  // Check for common issues
  if (totalItems === 0 && historyKeys.length > 0) {
    issues.push('History keys exist but no valid items found - possible data corruption')
  }
  
  if (totalItems > 40) {
    warnings.push(`Large number of history items (${totalItems}) may impact performance`)
  }
  
  if (storageUsage > 5 * 1024 * 1024) { // 5MB
    warnings.push(`High storage usage (${Math.round(storageUsage / 1024 / 1024)}MB) approaching limits`)
  }
  
  // Performance suggestions
  if (invalidItems > 0) {
    suggestions.push('Run cleanup to remove invalid items')
  }
  
  if (duplicateItems > 0) {
    suggestions.push('Run deduplication to remove duplicate items')
  }
  
  if (migrationNeeded) {
    suggestions.push('Run migration to consolidate legacy data')
  }
  
  const result: DiagnosticResult = {
    issues,
    warnings,
    suggestions,
    dataIntegrity: {
      totalItems,
      validItems,
      invalidItems,
      corruptedItems,
      duplicateItems
    },
    storageAnalysis: {
      totalKeys: allKeys.length,
      historyKeys,
      storageUsage,
      quotaExceeded
    },
    migrationNeeded
  }
  
  console.log('📋 Diagnostic complete:', result)
  return result
}

export const repairHistory = (): { success: boolean, message: string } => {
  try {
    console.log('🔧 Starting history repair...')
    
    const mainHistoryData = localStorage.getItem('audioTricks_history')
    if (!mainHistoryData) {
      return { success: false, message: 'No history data to repair' }
    }
    
    const parsed = JSON.parse(mainHistoryData)
    if (!Array.isArray(parsed)) {
      return { success: false, message: 'History data is not an array' }
    }
    
    const repaired: HistoryItem[] = []
    const seenIds = new Set<string>()
    let repairedCount = 0
    
    parsed.forEach((item: any, index: number) => {
      try {
        // Skip if duplicate ID
        if (seenIds.has(item.id)) {
          console.log(`Skipping duplicate ID: ${item.id}`)
          return
        }
        
        // Repair missing fields
        const repairedItem: HistoryItem = {
          id: item.id || `repaired_${Date.now()}_${index}`,
          timestamp: item.timestamp || new Date().toISOString(),
          title: item.title || 'Recovered Item',
          duration: item.duration || 0,
          wordCount: item.wordCount || 0,
          language: item.language || 'en',
          results: {
            transcript: item.results?.transcript || { text: '', duration: 0 },
            summary: item.results?.summary || { 
              summary: '', 
              key_moments: [], 
              word_count: 0, 
              total_duration: 0, 
              language: 'en' 
            },
            processing_time: item.results?.processing_time || 0,
            audioUrl: item.results?.audioUrl,
            audioFile: undefined // Remove File objects
          }
        }
        
        seenIds.add(repairedItem.id)
        repaired.push(repairedItem)
        repairedCount++
        
      } catch (itemError) {
        console.error(`Cannot repair item ${index}:`, itemError)
      }
    })
    
    // Save repaired data
    localStorage.setItem('audioTricks_history', JSON.stringify(repaired))
    
    return { 
      success: true, 
      message: `Successfully repaired ${repairedCount} items (${parsed.length - repairedCount} items were removed)` 
    }
    
  } catch (error) {
    return { success: false, message: `Repair failed: ${error}` }
  }
}

export const cleanupHistory = (): { success: boolean, message: string } => {
  try {
    console.log('🧹 Starting history cleanup...')
    
    // Clean up old/invalid keys
    const keysToRemove = [
      'audioTricksResults', // Legacy
      'openai_results', // Legacy
      'transcription_history', // Legacy
      'audio_history' // Legacy
    ]
    
    let removedKeys = 0
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        removedKeys++
      }
    })
    
    return { 
      success: true, 
      message: `Cleaned up ${removedKeys} legacy keys` 
    }
    
  } catch (error) {
    return { success: false, message: `Cleanup failed: ${error}` }
  }
}