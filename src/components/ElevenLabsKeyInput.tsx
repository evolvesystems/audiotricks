import React, { useState } from 'react'
import { 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

interface ElevenLabsKeyInputProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
}

const ElevenLabsKeyInput: React.FC<ElevenLabsKeyInputProps> = ({ apiKey, onApiKeyChange }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value
    onApiKeyChange(newKey)
    localStorage.setItem('elevenlabs_api_key', newKey)
    setIsValid(null) // Reset validation when key changes
  }

  const validateKey = async () => {
    if (!apiKey.trim()) {
      setIsValid(false)
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': apiKey
        }
      })
      
      setIsValid(response.ok)
    } catch (error) {
      setIsValid(false)
    } finally {
      setIsValidating(false)
    }
  }

  const getStatusIcon = () => {
    if (isValidating) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    }
    if (isValid === true) {
      return <CheckCircleIcon className="h-4 w-4 text-green-600" />
    }
    if (isValid === false) {
      return <ExclamationCircleIcon className="h-4 w-4 text-red-600" />
    }
    return null
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type={isVisible ? 'text' : 'password'}
            value={apiKey}
            onChange={handleKeyChange}
            placeholder="ElevenLabs API Key"
            className="w-48 pl-8 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <KeyIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-2 top-2.5 p-0.5 hover:bg-gray-100 rounded"
            type="button"
          >
            {isVisible ? (
              <EyeSlashIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        
        {apiKey && (
          <button
            onClick={validateKey}
            disabled={isValidating}
            className="px-3 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Test
          </button>
        )}
        
        {getStatusIcon()}
      </div>
      
      {isValid === false && (
        <p className="mt-1 text-xs text-red-600">
          Invalid API key. Please check your ElevenLabs API key.
        </p>
      )}
      
      {isValid === true && (
        <p className="mt-1 text-xs text-green-600">
          API key is valid!
        </p>
      )}
      
      {!apiKey && (
        <p className="mt-1 text-xs text-gray-500">
          Get your API key from{' '}
          <a 
            href="https://elevenlabs.io/app/speech-synthesis" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            ElevenLabs
          </a>
        </p>
      )}
    </div>
  )
}

export default ElevenLabsKeyInput