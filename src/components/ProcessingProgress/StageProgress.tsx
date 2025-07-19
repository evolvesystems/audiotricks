import React from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface Stage {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  time: string
  description: string
}

interface StageProgressProps {
  stages: Stage[]
  currentStage: string
  chunkProgress?: { current: number; total: number }
}

const StageProgress: React.FC<StageProgressProps> = ({ stages, currentStage, chunkProgress }) => {
  const currentIndex = stages.findIndex(s => s.id === currentStage)

  return (
    <div className="space-y-4">
      {stages.map((s, index) => {
        const Icon = s.icon
        const isActive = index === currentIndex
        const isComplete = index < currentIndex
        
        return (
          <div key={s.id} className={`
            p-4 rounded-lg border-2 transition-all duration-300
            ${isComplete ? 'bg-green-50 border-green-200' : 
              isActive ? 'bg-blue-50 border-blue-300 shadow-sm' : 
              'bg-gray-50 border-gray-200'}
          `}>
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-200'
              }`}>
                {isComplete ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${
                    isComplete ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {s.label}
                  </span>
                  {s.time && !isComplete && !isActive && (
                    <span className="text-xs text-gray-500">{s.time}</span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{s.description}</p>
                
                {/* Stage-specific progress */}
                {isActive && s.id === 'transcribing' && chunkProgress && chunkProgress.total > 1 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Processing chunk {chunkProgress.current} of {chunkProgress.total}</span>
                      <span>{Math.round((chunkProgress.current / chunkProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(chunkProgress.current / chunkProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {isActive && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-1 rounded-full"
                      style={{
                        width: '30%',
                        animation: 'indeterminate 1.5s ease-in-out infinite'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StageProgress