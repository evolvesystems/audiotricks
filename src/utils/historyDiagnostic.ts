import { HistoryItem } from '../hooks/useHistory'
import { logger } from './logger'
import { analyzeStorage } from './historyDiagnostic/storageAnalyzer'
import { validateHistoryData } from './historyDiagnostic/dataValidator'
import { checkForMigration } from './historyDiagnostic/migrationChecker'

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
  
  logger.log('🔍 Starting comprehensive history diagnostic...')
  
  // Analyze storage
  const storageAnalysis = analyzeStorage()
  if (storageAnalysis.quotaExceeded) {
    issues.push('localStorage quota exceeded - may cause data loss')
  }
  
  // Validate history data
  const mainHistoryData = localStorage.getItem('audioTricks_history')
  const validationResult = validateHistoryData(mainHistoryData)
  issues.push(...validationResult.issues)
  warnings.push(...validationResult.warnings)
  
  // Check for migration
  const migrationCheck = checkForMigration()
  suggestions.push(...migrationCheck.suggestions)
  warnings.push(...migrationCheck.warnings)
  
  // Check for common issues
  const { dataIntegrity } = validationResult
  if (dataIntegrity.totalItems === 0 && storageAnalysis.historyKeys.length > 0) {
    issues.push('History keys exist but no valid items found - possible data corruption')
  }
  
  if (dataIntegrity.totalItems > 40) {
    warnings.push(`Large number of history items (${dataIntegrity.totalItems}) may impact performance`)
  }
  
  if (storageAnalysis.storageUsage > 5 * 1024 * 1024) { // 5MB
    warnings.push(`High storage usage (${Math.round(storageAnalysis.storageUsage / 1024 / 1024)}MB) approaching limits`)
  }
  
  // Performance suggestions
  if (dataIntegrity.invalidItems > 0) {
    suggestions.push('Run cleanup to remove invalid items')
  }
  
  if (dataIntegrity.duplicateItems > 0) {
    suggestions.push('Run deduplication to remove duplicate items')
  }
  
  if (migrationCheck.migrationNeeded) {
    suggestions.push('Run migration to consolidate legacy data')
  }
  
  const result: DiagnosticResult = {
    issues,
    warnings,
    suggestions,
    dataIntegrity,
    storageAnalysis,
    migrationNeeded: migrationCheck.migrationNeeded
  }
  
  return result
}

export const repairHistory = (): { success: boolean, message: string } => {
  try {
    
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