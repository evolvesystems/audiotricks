import React from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface ProcessingProgressProps {
  stage: 'uploading' | 'transcribing' | 'summarizing' | 'complete'
  fileName?: string
  chunkProgress?: { current: number; total: number }
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ stage, fileName, chunkProgress }) => {
  const stages = [
    { id: 'uploading', label: 'Uploading Audio', time: '~5s' },
    { id: 'transcribing', label: 'Transcribing with Whisper', time: '~10s' },
    { id: 'summarizing', label: 'Generating Summary', time: '~15s' },
    { id: 'complete', label: 'Complete', time: '' }
  ]

  const currentIndex = stages.findIndex(s => s.id === stage)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Processing {fileName ? `"${fileName}"` : 'Audio'}
      </h3>
      
      <div className="space-y-4">
        {stages.map((s, index) => {
          const isActive = index === currentIndex
          const isComplete = index < currentIndex
          
          return (
            <div key={s.id} className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {isComplete ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                ) : isActive ? (
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                ) : (
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isComplete ? 'text-gray-900' : isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {s.label}
                  </span>
                  {s.time && !isComplete && (
                    <span className="text-xs text-gray-500">{s.time}</span>
                  )}
                </div>
                {isActive && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div className="bg-blue-600 h-1 rounded-full" style={{
                      animation: 'progress 3s ease-in-out infinite'
                    }} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProcessingProgress