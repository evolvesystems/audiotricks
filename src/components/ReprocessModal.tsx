import React, { useState } from 'react'
import { 
  XMarkIcon, 
  ArrowPathIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { SummaryStyle } from './SummaryStyleSelector'
import SummaryStyleSelector from './SummaryStyleSelector'
import LanguageSelector from './LanguageSelector'
import { GPTSettings } from '../utils/openai'

interface ReprocessModalProps {
  isOpen: boolean
  onClose: () => void
  onReprocess: (summaryStyle: SummaryStyle, language: string, gptSettings: GPTSettings) => void
  isProcessing: boolean
  currentSettings: {
    summaryStyle: SummaryStyle
    language: string
    gptSettings: GPTSettings
  }
}

const ReprocessModal: React.FC<ReprocessModalProps> = ({
  isOpen,
  onClose,
  onReprocess,
  isProcessing,
  currentSettings
}) => {
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>(currentSettings.summaryStyle)
  const [language, setLanguage] = useState(currentSettings.language)
  const [temperature, setTemperature] = useState(currentSettings.gptSettings.temperature || 0.3)
  const [maxTokens, setMaxTokens] = useState(currentSettings.gptSettings.maxTokens || 2000)

  const handleReprocess = () => {
    onReprocess(summaryStyle, language, {
      temperature,
      maxTokens
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <ArrowPathIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Re-process Audio</h2>
              <p className="text-sm text-gray-500">Generate a new summary with different settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary Style
            </label>
            <SummaryStyleSelector 
              value={summaryStyle} 
              onChange={setSummaryStyle}
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <LanguageSelector 
              value={language} 
              onChange={setLanguage}
            />
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Cog6ToothIcon className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Advanced Settings</label>
            </div>
            
            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creativity Level: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservative</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary Length
              </label>
              <select
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1000}>Short (1000 tokens)</option>
                <option value={2000}>Medium (2000 tokens)</option>
                <option value={3000}>Long (3000 tokens)</option>
                <option value={4000}>Extra Long (4000 tokens)</option>
              </select>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Additional API Costs
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Re-processing will use the existing transcript but generate a new summary,
                    which will incur additional GPT-4 API costs (~$0.02-0.05).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReprocess}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Re-processing...</span>
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4" />
                <span>Re-process Audio</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReprocessModal