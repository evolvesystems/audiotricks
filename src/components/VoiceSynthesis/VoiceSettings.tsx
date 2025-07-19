import React from 'react'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { ElevenLabsSettings } from '../../utils/elevenlabs'

interface VoiceSettingsProps {
  settings: ElevenLabsSettings
  onSettingsChange: (settings: ElevenLabsSettings) => void
  showSettings: boolean
  onToggleSettings: () => void
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings,
  onSettingsChange,
  showSettings,
  onToggleSettings
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Voice Settings</h3>
        <button
          onClick={onToggleSettings}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          <span>{showSettings ? 'Hide' : 'Show'} Settings</span>
        </button>
      </div>

      {showSettings && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stability: {settings.stability}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.stability}
              onChange={(e) => onSettingsChange({...settings, stability: parseFloat(e.target.value)})}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>More Variable</span>
              <span>More Stable</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Similarity Boost: {settings.similarity_boost}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.similarity_boost}
              onChange={(e) => onSettingsChange({...settings, similarity_boost: parseFloat(e.target.value)})}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low Similarity</span>
              <span>High Similarity</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style: {settings.style}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.style}
              onChange={(e) => onSettingsChange({...settings, style: parseFloat(e.target.value)})}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Natural</span>
              <span>Expressive</span>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.use_speaker_boost}
              onChange={(e) => onSettingsChange({...settings, use_speaker_boost: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Use Speaker Boost (improves similarity for longer texts)
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceSettings