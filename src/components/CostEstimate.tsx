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
  const GPT4_COST_PER_1K_TOKENS = 0.01 // GPT-4o mini pricing
  const AVERAGE_TOKENS_PER_MINUTE = 200 // More accurate estimate for transcripts
  
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
    <div className="text-white">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <CurrencyDollarIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium opacity-90">
              Estimated API Cost
            </span>
            <span className="text-2xl font-bold">
              ${cost.total.toFixed(2)}
            </span>
          </div>
          
          {showDetailed && (
            <div className="mt-2 grid grid-cols-2 gap-x-4 text-xs opacity-80">
              <div className="flex justify-between">
                <span>Transcription:</span>
                <span>${cost.whisper.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span>AI Summary:</span>
                <span>${cost.gpt.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CostEstimate