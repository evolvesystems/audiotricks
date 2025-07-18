import React, { useState, useEffect } from 'react'
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { SummaryStyle } from './SummaryStyleSelector'

export interface UserSettings {
  summaryStyle: SummaryStyle
  outputLanguage: string
  temperature: number
  maxTokens: number
  showCostEstimates: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  summaryStyle: 'formal',
  outputLanguage: 'en',
  temperature: 0.3,
  maxTokens: 2000,
  showCostEstimates: true
}

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange: (settings: UserSettings) => void
  currentSettings: UserSettings
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, onSettingsChange, currentSettings }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(currentSettings)

  useEffect(() => {
    setLocalSettings(currentSettings)
  }, [currentSettings])

  const handleSave = () => {
    onSettingsChange(localSettings)
    localStorage.setItem('audioTricksSettings', JSON.stringify(localSettings))
    onClose()
  }

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Default Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Summary Style
            </label>
            <select
              value={localSettings.summaryStyle}
              onChange={(e) => setLocalSettings({ ...localSettings, summaryStyle: e.target.value as SummaryStyle })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="formal">Formal - Technical and analytical</option>
              <option value="creative">Creative - Friendly and engaging</option>
              <option value="conversational">Conversational - Natural and casual</option>
            </select>
          </div>

          {/* Output Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Output Language
            </label>
            <select
              value={localSettings.outputLanguage}
              onChange={(e) => setLocalSettings({ ...localSettings, outputLanguage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Default Creativity (Temperature)
              </label>
              <span className="text-sm font-mono text-gray-900">{localSettings.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localSettings.temperature}
              onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Focused</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Default Summary Length
              </label>
              <span className="text-sm font-mono text-gray-900">{localSettings.maxTokens}</span>
            </div>
            <input
              type="range"
              min="500"
              max="4000"
              step="100"
              value={localSettings.maxTokens}
              onChange={(e) => setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Brief</span>
              <span>Standard</span>
              <span>Detailed</span>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={localSettings.showCostEstimates}
                onChange={(e) => setLocalSettings({ ...localSettings, showCostEstimates: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Show cost estimates</span>
            </label>
            
            <div className="text-xs text-gray-500 mt-2">
              <p>• All transcripts are automatically saved to history</p>
              <p>• Access history using the clock icon in the header</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Reset to Defaults
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
export { DEFAULT_SETTINGS }