import { logger } from '../logger'

export interface StorageAnalysis {
  totalKeys: number
  historyKeys: string[]
  storageUsage: number
  quotaExceeded: boolean
}

export const analyzeStorage = (): StorageAnalysis => {
  // Check all localStorage keys
  const allKeys = Object.keys(localStorage)
  const historyKeys = allKeys.filter(key => 
    key.includes('history') || 
    key.includes('audioTricks') || 
    key.includes('openai') ||
    key.includes('transcription') ||
    key.includes('audio')
  )
  
  logger.log('📊 Found storage keys:', historyKeys)
  
  // Calculate storage usage
  let storageUsage = 0
  let quotaExceeded = false
  
  // Test for quota
  try {
    const testData = 'x'.repeat(1024 * 1024) // 1MB test
    localStorage.setItem('__test__', testData)
    localStorage.removeItem('__test__')
  } catch (e) {
    quotaExceeded = true
  }
  
  // Calculate current usage
  allKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      storageUsage += key.length + value.length
    }
  })
  
  return {
    totalKeys: allKeys.length,
    historyKeys,
    storageUsage,
    quotaExceeded
  }
}