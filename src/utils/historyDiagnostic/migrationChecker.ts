export interface MigrationCheck {
  migrationNeeded: boolean
  suggestions: string[]
  warnings: string[]
}

export const checkForMigration = (): MigrationCheck => {
  const suggestions: string[] = []
  const warnings: string[] = []
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
  
  return {
    migrationNeeded,
    suggestions,
    warnings
  }
}