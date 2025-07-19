export const calculateProgress = (
  stage: 'uploading' | 'transcribing' | 'summarizing' | 'complete',
  chunkProgress?: { current: number; total: number },
  subProgress?: number
) => {
  switch (stage) {
    case 'uploading':
      return 10 // Upload is quick
    case 'transcribing':
      // If we have chunk progress, use it for accurate tracking
      if (chunkProgress && chunkProgress.total > 0) {
        const chunkPercent = (chunkProgress.current / chunkProgress.total) * 100
        return 10 + (chunkPercent * 0.7) // 10% base + 70% for transcription
      }
      // Use sub-progress for smooth updates during single file transcription
      if (subProgress !== undefined) {
        return 10 + (subProgress * 0.7) // 10-80% range
      }
      // Start at 15% and gradually increase to show activity
      return 15
    case 'summarizing':
      // Use sub-progress for summary generation if available
      if (subProgress !== undefined) {
        return 80 + (subProgress * 0.15) // 80-95% range  
      }
      // Start at 80% instead of jumping to 85%
      return 80
    case 'complete':
      return 100
    default:
      return 0
  }
}

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

export const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}