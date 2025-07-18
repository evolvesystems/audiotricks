import React from 'react'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

interface CostEstimateProps {
  fileSize?: number // in bytes
  duration?: number // in seconds
  showDetailed?: boolean
}

const CostEstimate: React.FC<CostEstimateProps> = ({ fileSize, duration, showDetailed = false }) => {
  // OpenAI pricing estimates (as of 2024)
  const WHISPER_COST_PER_MINUTE = 0.006 // $0.006 per minute
  const GPT4_COST_PER_1K_TOKENS = 0.03 // Rough estimate for GPT-4
  const AVERAGE_TOKENS_PER_MINUTE = 150 // Rough estimate
  
  const calculateCost = () => {
    if (!duration && !fileSize) return null
    
    // Estimate duration from file size if not provided
    const estimatedDuration = duration || (fileSize ? fileSize / (128 * 125) : 0) // 128kbps estimate
    const minutes = estimatedDuration / 60
    
    const whisperCost = minutes * WHISPER_COST_PER_MINUTE
    const estimatedTokens = minutes * AVERAGE_TOKENS_PER_MINUTE
    const gptCost = (estimatedTokens / 1000) * GPT4_COST_PER_1K_TOKENS
    
    return {
      whisper: whisperCost,
      gpt: gptCost,
      total: whisperCost + gptCost,
      minutes: minutes
    }
  }
  
  const cost = calculateCost()
  
  if (!cost) return null
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
      <div className="flex items-center space-x-2">
        <CurrencyDollarIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              Estimated API Cost
            </span>
            <span className="text-sm font-semibold text-blue-900">
              ${cost.total.toFixed(3)}
            </span>
          </div>
          
          {showDetailed && (
            <div className="mt-2 space-y-1 text-xs text-blue-700">
              <div className="flex justify-between">
                <span>Transcription ({cost.minutes.toFixed(1)} min):</span>
                <span>${cost.whisper.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Summary generation:</span>
                <span>${cost.gpt.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-2 text-xs text-blue-600">
        Actual costs may vary based on audio content
      </p>
    </div>
  )
}

export default CostEstimate