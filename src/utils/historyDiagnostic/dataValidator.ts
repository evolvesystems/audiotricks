export interface DataIntegrity {
  totalItems: number
  validItems: number
  invalidItems: number
  corruptedItems: number
  duplicateItems: number
}

export interface ValidationResult {
  dataIntegrity: DataIntegrity
  issues: string[]
  warnings: string[]
}

export const validateHistoryData = (mainHistoryData: string | null): ValidationResult => {
  const issues: string[] = []
  const warnings: string[] = []
  
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
  
  return {
    dataIntegrity: {
      totalItems,
      validItems,
      invalidItems,
      corruptedItems,
      duplicateItems
    },
    issues,
    warnings
  }
}