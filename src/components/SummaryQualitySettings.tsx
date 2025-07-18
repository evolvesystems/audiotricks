import React from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'

interface SummaryQualitySettingsProps {
  focusAreas: string[]
  onFocusAreasChange: (areas: string[]) => void
  includeActionItems: boolean
  onIncludeActionItemsChange: (value: boolean) => void
  includeQuotes: boolean
  onIncludeQuotesChange: (value: boolean) => void
  disabled?: boolean
}

const FOCUS_AREAS = [
  { id: 'insights', label: 'Key Insights', description: 'Extract unique and valuable insights' },
  { id: 'decisions', label: 'Decisions', description: 'Highlight decisions made and action items' },
  { id: 'problems', label: 'Problems & Solutions', description: 'Identify problems discussed and solutions proposed' },
  { id: 'numbers', label: 'Data & Numbers', description: 'Extract specific data points and statistics' },
  { id: 'quotes', label: 'Notable Quotes', description: 'Capture memorable or important quotes' },
  { id: 'emotions', label: 'Sentiment & Tone', description: 'Analyze emotional context and speaker sentiment' }
]

const SummaryQualitySettings: React.FC<SummaryQualitySettingsProps> = ({
  focusAreas,
  onFocusAreasChange,
  includeActionItems,
  onIncludeActionItemsChange,
  includeQuotes,
  onIncludeQuotesChange,
  disabled = false
}) => {
  const toggleFocusArea = (areaId: string) => {
    if (focusAreas.includes(areaId)) {
      onFocusAreasChange(focusAreas.filter(id => id !== areaId))
    } else {
      onFocusAreasChange([...focusAreas, areaId])
    }
  }

  return (
    <div className="bg-blue-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-2">
        <SparklesIcon className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-medium text-gray-900">Summary Enhancement</h3>
      </div>

      {/* Focus Areas */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Focus Areas (select what to emphasize)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_AREAS.map(area => (
            <label
              key={area.id}
              className={`flex items-start space-x-2 p-2 rounded-md border cursor-pointer transition-colors ${
                focusAreas.includes(area.id)
                  ? 'bg-blue-100 border-blue-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={focusAreas.includes(area.id)}
                onChange={() => toggleFocusArea(area.id)}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{area.label}</div>
                <div className="text-xs text-gray-500">{area.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-2 pt-2 border-t border-blue-200">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={includeActionItems}
            onChange={(e) => onIncludeActionItemsChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">
            Extract action items as a separate section
          </span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={includeQuotes}
            onChange={(e) => onIncludeQuotesChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">
            Include notable quotes with attribution
          </span>
        </label>
      </div>
    </div>
  )
}

export default SummaryQualitySettings