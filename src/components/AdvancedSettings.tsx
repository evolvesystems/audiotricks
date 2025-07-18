import React from 'react'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

interface AdvancedSettingsProps {
  temperature: number
  onTemperatureChange: (value: number) => void
  maxTokens: number
  onMaxTokensChange: (value: number) => void
  disabled?: boolean
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  disabled = false
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-2">
        <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-900">Advanced Settings</h3>
      </div>

      {/* Temperature Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="temperature" className="text-sm font-medium text-gray-700">
            Creativity (Temperature)
          </label>
          <span className="text-sm font-mono text-gray-900">{temperature.toFixed(2)}</span>
        </div>
        <input
          type="range"
          id="temperature"
          min="0"
          max="1"
          step="0.05"
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Focused</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Higher values (e.g., 0.8) make output more random and creative. Lower values (e.g., 0.2) make it more focused and deterministic.
        </p>
      </div>

      {/* Max Tokens Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="maxTokens" className="text-sm font-medium text-gray-700">
            Summary Length
          </label>
          <span className="text-sm font-mono text-gray-900">{maxTokens}</span>
        </div>
        <input
          type="range"
          id="maxTokens"
          min="500"
          max="4000"
          step="100"
          value={maxTokens}
          onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Brief</span>
          <span>Standard</span>
          <span>Detailed</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Controls the maximum length of the generated summary. Higher values allow for more detailed summaries.
        </p>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        
        .slider:disabled::-webkit-slider-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .slider:disabled::-moz-range-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default AdvancedSettings