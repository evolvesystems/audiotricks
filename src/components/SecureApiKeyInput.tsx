// Secure API Key Input component that supports backend storage
import React, { useState, useEffect, useRef } from 'react'
import { EyeIcon, EyeSlashIcon, KeyIcon, QuestionMarkCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useApiKeys } from '../hooks/useApiKeys'

interface SecureApiKeyInputProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  isGuest?: boolean
  token?: string | null
  keyType: 'openai' | 'elevenlabs'
}

const SecureApiKeyInput: React.FC<SecureApiKeyInputProps> = ({ 
  apiKey, 
  onApiKeyChange, 
  isGuest = false,
  token = null,
  keyType
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)
  const [saving, setSaving] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)
  
  const { saveApiKeys, hasKeys } = useApiKeys(token)
  const hasBackendKey = keyType === 'openai' ? hasKeys.hasOpenAI : hasKeys.hasElevenLabs

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setShowHelp(false)
      }
    }

    if (showHelp) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHelp])

  const handleSave = async () => {
    setSaving(true)
    
    try {
      if (!isGuest && token) {
        // Save to backend for authenticated users
        const success = await saveApiKeys({
          [keyType]: tempKey
        })
        
        if (success) {
          onApiKeyChange(tempKey)
        }
      } else {
        // Save to localStorage for guests
        onApiKeyChange(tempKey)
        localStorage.setItem(`${keyType}_api_key`, tempKey)
      }
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setTempKey(apiKey)
    setIsEditing(false)
  }

  const getHelpContent = () => {
    if (keyType === 'openai') {
      return {
        title: 'How to get OpenAI API Key',
        steps: [
          'Go to platform.openai.com',
          'Sign up or log in to your account',
          'Navigate to "API Keys" section',
          'Click "Create new secret key"',
          'Copy the key (starts with "sk-")',
          'Paste it here'
        ],
        url: 'https://platform.openai.com'
      }
    } else {
      return {
        title: 'How to get ElevenLabs API Key',
        steps: [
          'Go to elevenlabs.io',
          'Sign up or log in to your account',
          'Click on your profile picture',
          'Select "Profile" from the dropdown',
          'Find your API key in the API section',
          'Copy and paste it here'
        ],
        url: 'https://elevenlabs.io'
      }
    }
  }

  if (!isEditing && (apiKey || hasBackendKey)) {
    return (
      <div className="flex items-center space-x-2">
        <KeyIcon className="h-5 w-5 text-green-500" />
        <span className="text-sm text-green-600 flex items-center gap-1">
          {keyType === 'openai' ? 'OpenAI' : 'ElevenLabs'} Key Set 
          {!isGuest && hasBackendKey && (
            <>
              <ShieldCheckIcon className="h-4 w-4" />
              <span className="text-xs">(Secured)</span>
            </>
          )}
          {!isGuest && !hasBackendKey && (
            <span className="text-xs">(Local)</span>
          )}
          {isGuest && (
            <span className="text-xs">(Your key)</span>
          )}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Change
        </button>
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-400 hover:text-gray-600"
            title={`How to get ${keyType === 'openai' ? 'OpenAI' : 'ElevenLabs'} API key`}
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
          </button>
          {showHelp && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
              <h4 className="font-semibold text-gray-900 mb-2">{getHelpContent().title}</h4>
              <ol className="text-sm text-gray-700 space-y-1">
                {getHelpContent().steps.map((step, index) => (
                  <li key={index}>
                    {index + 1}. {index === 0 ? (
                      <>Go to <a href={getHelpContent().url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{getHelpContent().url.replace('https://', '')}</a></>
                    ) : (
                      step
                    )}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-gray-500 mt-2">
                {!isGuest && token ? (
                  <>🔒 Your key will be encrypted and stored securely</>
                ) : (
                  <>💡 Your key is stored locally and never sent to our servers</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          placeholder={`Enter ${keyType === 'openai' ? 'OpenAI' : 'ElevenLabs'} API Key`}
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
        disabled={!tempKey.trim() || saving}
        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      
      {isEditing && (
        <button
          onClick={handleCancel}
          className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      )}
      
      <div className="relative">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-400 hover:text-gray-600"
          title={`How to get ${keyType === 'openai' ? 'OpenAI' : 'ElevenLabs'} API key`}
        >
          <QuestionMarkCircleIcon className="h-4 w-4" />
        </button>
        {showHelp && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <h4 className="font-semibold text-gray-900 mb-2">{getHelpContent().title}</h4>
            <ol className="text-sm text-gray-700 space-y-1">
              {getHelpContent().steps.map((step, index) => (
                <li key={index}>
                  {index + 1}. {index === 0 ? (
                    <>Go to <a href={getHelpContent().url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{getHelpContent().url.replace('https://', '')}</a></>
                  ) : (
                    step
                  )}
                </li>
              ))}
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              {!isGuest && token ? (
                <>🔒 Your key will be encrypted and stored securely</>
              ) : (
                <>💡 Your key is stored locally and never sent to our servers</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SecureApiKeyInput