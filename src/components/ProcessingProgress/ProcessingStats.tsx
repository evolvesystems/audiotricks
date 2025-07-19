import React from 'react'

interface ProcessingStatsProps {
  fileSize?: number
  currentDuration?: number
  wordCount?: number
}

const ProcessingStats: React.FC<ProcessingStatsProps> = ({ fileSize, currentDuration, wordCount }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
      {fileSize && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">File Size</p>
          <p className="text-lg font-medium text-gray-900">{formatBytes(fileSize)}</p>
        </div>
      )}
      {currentDuration && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Audio Duration</p>
          <p className="text-lg font-medium text-gray-900">{formatTime(Math.round(currentDuration))}</p>
        </div>
      )}
      {wordCount && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Words Transcribed</p>
          <p className="text-lg font-medium text-gray-900">{wordCount.toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}

export default ProcessingStats