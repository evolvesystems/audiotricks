import React from 'react'
import { 
  Cog6ToothIcon, 
  QuestionMarkCircleIcon, 
  ClockIcon, 
  HomeIcon
} from '@heroicons/react/24/outline'
import SecureApiKeyInput from '../SecureApiKeyInput'
import HistoryDropdown from '../HistoryDropdown'
import ApiKeySafetyDropdown from './ApiKeySafetyDropdown'
import UserAuth from '../UserAuth'
import { AudioProcessingResponse } from '../../types'
import { HistoryItem } from '../../hooks/useHistory'

interface AppHeaderProps {
  apiKey: string
  elevenLabsKey: string
  isGuest?: boolean
  token?: string | null
  hasSecureKeys?: { hasOpenAI: boolean; hasElevenLabs: boolean }
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
}

const AppHeader: React.FC<AppHeaderProps> = ({
  apiKey,
  elevenLabsKey,
  isGuest = false,
  token = null,
  hasSecureKeys,
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
  onShowSettings
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
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={onNewUpload}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1"
              >
                <HomeIcon className="h-4 w-4" />
                <span>New Upload</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              
              <div className="relative">
                <button
                  onClick={onHistoryToggle}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md relative"
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

              {/* User Auth */}
              <div className="pl-2 ml-2 border-l border-gray-200">
                <UserAuth />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppHeader