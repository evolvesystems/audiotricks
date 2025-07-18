import React, { useState } from 'react'
import { EyeIcon, EyeSlashIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline'

interface ElevenLabsKeyInputProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  isGuest?: boolean
}

const ElevenLabsKeyInput: React.FC<ElevenLabsKeyInputProps> = ({ apiKey, onApiKeyChange, isGuest = false }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)

  const handleSave = () => {
    onApiKeyChange(tempKey)
    if (isGuest) {
      localStorage.setItem('elevenlabs_api_key', tempKey)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempKey(apiKey)
    setIsEditing(false)
  }

  if (!isEditing && apiKey) {
    return (
      <div className="flex items-center space-x-2">
        <SpeakerWaveIcon className="h-5 w-5 text-purple-500" />
        <span className="text-sm text-purple-600">
          ElevenLabs Key Set {!isGuest ? '(admin)' : '(your key)'}
        </span>
        {isGuest && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Change
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          placeholder={isGuest ? "Enter Your ElevenLabs API Key" : "Admin ElevenLabs Key Active"}
          value={tempKey}
          onChange={(e) => setTempKey(e.target.value)}
          className="pr-10 pl-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {isVisible ? (
            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
          ) : (
            <EyeIcon className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>
      
      <button
        onClick={handleSave}
        disabled={!tempKey.trim()}
        className="px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save
      </button>
      
      {isEditing && (
        <button
          onClick={handleCancel}
          className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      )}
    </div>
  )
}

export default ElevenLabsKeyInput