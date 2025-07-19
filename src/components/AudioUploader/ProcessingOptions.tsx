import React from 'react'
import SummaryStyleSelector, { SummaryStyle } from '../SummaryStyleSelector'
import LanguageSelector from '../LanguageSelector'
import AdvancedSettings from '../AdvancedSettings'

interface ProcessingOptionsProps {
  summaryStyle: SummaryStyle
  onSummaryStyleChange: (style: SummaryStyle) => void
  outputLanguage: string
  onLanguageChange: (language: string) => void
  temperature: number
  onTemperatureChange: (temp: number) => void
  maxTokens: number
  onMaxTokensChange: (tokens: number) => void
  showAdvanced: boolean
  onToggleAdvanced: () => void
  disabled: boolean
}

const ProcessingOptions: React.FC<ProcessingOptionsProps> = ({
  summaryStyle,
  onSummaryStyleChange,
  outputLanguage,
  onLanguageChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  showAdvanced,
  onToggleAdvanced,
  disabled
}) => {
  return (
    <div className="space-y-4 mb-6">
      <h4 className="text-sm font-medium text-gray-700">Processing Options</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryStyleSelector
          selectedStyle={summaryStyle}
          onStyleChange={onSummaryStyleChange}
          disabled={disabled}
        />
        <LanguageSelector
          selectedLanguage={outputLanguage}
          onLanguageChange={onLanguageChange}
          disabled={disabled}
        />
      </div>
      
      {/* Advanced Settings Toggle */}
      <div className="mt-3">
        <button
          onClick={onToggleAdvanced}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
        
        {showAdvanced && (
          <div className="mt-3 p-4 bg-gray-50 rounded-md">
            <AdvancedSettings
              temperature={temperature}
              onTemperatureChange={onTemperatureChange}
              maxTokens={maxTokens}
              onMaxTokensChange={onMaxTokensChange}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ProcessingOptions