import React, { useState } from 'react'
import { EyeIcon, EyeSlashIcon, KeyIcon } from '@heroicons/react/24/outline'

interface ApiKeyInputProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, onApiKeyChange }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)

  const handleSave = () => {
    onApiKeyChange(tempKey)
    localStorage.setItem('openai_api_key', tempKey)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempKey(apiKey)
    setIsEditing(false)
  }

  if (!isEditing && apiKey) {
    return (
      <div className="flex items-center space-x-2">
        <KeyIcon className="h-5 w-5 text-green-500" />
        <span className="text-sm text-green-600">API Key Set</span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          placeholder="Enter OpenAI API Key"
          value={tempKey}
          onChange={(e) => setTempKey(e.target.value)}
          className="pr-10 pl-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ApiKeyInput