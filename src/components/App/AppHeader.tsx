import React from 'react'
import { 
  Cog6ToothIcon, 
  QuestionMarkCircleIcon, 
  ClockIcon, 
  HomeIcon, 
  ArrowRightOnRectangleIcon, 
  UserIcon
} from '@heroicons/react/24/outline'
import ApiKeyInput from '../ApiKeyInput'
import ElevenLabsKeyInput from '../ElevenLabsKeyInput'
import HistoryDropdown from '../HistoryDropdown'
import ApiKeySafetyDropdown from './ApiKeySafetyDropdown'
import { AudioProcessingResponse } from '../../types'
import { HistoryItem } from '../../hooks/useHistory'

interface AppHeaderProps {
  apiKey: string
  elevenLabsKey: string
  isGuest: boolean
  history: HistoryItem[]
  showHistory: boolean
  onApiKeyChange: (key: string) => void
  onElevenLabsKeyChange: (key: string) => void
  onHistoryToggle: () => void
  onSelectHistoryItem: (item: AudioProcessingResponse) => void
  onDeleteHistoryItem: (id: string) => void
  onClearHistory: () => void
  onRecoverHistory: (items: any[]) => void
  onHistoryChange: () => void
  onHistoryClose: () => void
  onNewUpload: () => void
  onShowHelp: () => void
  onShowSettings: () => void
  onLogout: () => void
}

const AppHeader: React.FC<AppHeaderProps> = ({
  apiKey,
  elevenLabsKey,
  isGuest,
  history,
  showHistory,
  onApiKeyChange,
  onElevenLabsKeyChange,
  onHistoryToggle,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  onRecoverHistory,
  onHistoryChange,
  onHistoryClose,
  onNewUpload,
  onShowHelp,
  onShowSettings,
  onLogout
}) => {
  return (
    <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">AudioTricks</h1>
            <span className="text-sm text-gray-500">AI Audio Processing</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* API Key Safety Dropdown */}
            <ApiKeySafetyDropdown />

            {/* API Key Inputs */}
            <div className="flex items-center space-x-3">
              <ApiKeyInput 
                apiKey={apiKey} 
                onApiKeyChange={onApiKeyChange}
                isGuest={isGuest}
              />
              <ElevenLabsKeyInput 
                apiKey={elevenLabsKey} 
                onApiKeyChange={onElevenLabsKeyChange}
                isGuest={isGuest}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onNewUpload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="New Upload"
              >
                <HomeIcon className="h-5 w-5" />
              </button>
              
              <div className="relative">
                <button
                  onClick={onHistoryToggle}
                  className={`p-2 rounded-md relative ${
                    showHistory 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="History"
                >
                  <ClockIcon className="h-5 w-5" />
                  {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 rounded-full text-xs text-white flex items-center justify-center min-w-[0.75rem] h-3 px-1">
                      {history.length > 99 ? '99+' : history.length}
                    </span>
                  )}
                </button>
                
                <HistoryDropdown
                  history={history}
                  onSelectItem={onSelectHistoryItem}
                  onDeleteItem={onDeleteHistoryItem}
                  onClearHistory={onClearHistory}
                  onRecoverHistory={onRecoverHistory}
                  onHistoryChange={onHistoryChange}
                  isOpen={showHistory}
                  onClose={onHistoryClose}
                />
              </div>
              
              <button
                onClick={onShowHelp}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Help"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={onShowSettings}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Settings"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-2 pl-2 ml-2 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {isGuest ? 'Guest' : 'Admin'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppHeader