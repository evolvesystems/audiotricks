import { HistoryItem } from '../hooks/useHistory'
import { logger } from './logger'

const HISTORY_KEY = 'audioTricks_history'
const BACKUP_KEY = `${HISTORY_KEY}_backup`

/**
 * Save history to localStorage with backup
 */
export function saveHistoryToStorage(history: HistoryItem[]): void {
  try {
    // Create backup before saving
    const current = localStorage.getItem(HISTORY_KEY)
    if (current) {
      localStorage.setItem(BACKUP_KEY, current)
    }
    
    // Save new data
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch (error) {
    logger.error('Failed to save history:', error)
    throw error
  }
}

/**
 * Load history from localStorage with validation
 */
export function loadHistoryFromStorage(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    
    // Validate each item
    return parsed.filter(item => 
      item && 
      item.id && 
      item.timestamp && 
      item.results && 
      item.results.transcript && 
      item.results.summary
    )
  } catch (error) {
    logger.error('Error loading history:', error)
    return tryRecoverFromBackup()
  }
}

/**
 * Try to recover history from backup
 */
function tryRecoverFromBackup(): HistoryItem[] {
  try {
    const backup = localStorage.getItem(BACKUP_KEY)
    if (!backup) return []
    
    const parsed = JSON.parse(backup)
    if (!Array.isArray(parsed)) return []
    
    // Validate and restore
    const validItems = parsed.filter(item => 
      item && 
      item.id && 
      item.timestamp && 
      item.results
    )
    
    // Save recovered items
    saveHistoryToStorage(validItems)
    return validItems
  } catch (error) {
    logger.error('Failed to recover from backup:', error)
    return []
  }
}

/**
 * Clear all history data
 */
export function clearHistoryStorage(): void {
  localStorage.removeItem(HISTORY_KEY)
  localStorage.removeItem(BACKUP_KEY)
}

/**
 * Get storage size info
 */
export function getHistoryStorageInfo(): { used: number; limit: number } {
  const stored = localStorage.getItem(HISTORY_KEY) || ''
  const backup = localStorage.getItem(BACKUP_KEY) || ''
  return {
    used: stored.length + backup.length,
    limit: 5 * 1024 * 1024 // 5MB typical localStorage limit
  }
}