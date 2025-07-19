import React, { useState, useRef, useEffect } from 'react'
import { ShieldCheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
// Force rebuild to clear any cache issues

const ApiKeySafetyDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors"
        title="Learn about API key security"
      >
        <ShieldCheckIcon className="h-4 w-4" />
        <span className="font-medium">API Keys Safe</span>
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Your API Keys are 100% Safe</h3>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-800">Stored locally in your browser</div>
                  <div className="text-xs">Keys are saved in your browser's localStorage, never on our servers</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-800">Direct API calls only</div>
                  <div className="text-xs">Your keys go directly to OpenAI/ElevenLabs - we never see them</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-800">Open source & auditable</div>
                  <div className="text-xs">You can verify our code - no hidden tracking or data collection</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-xs text-blue-800">
                <div className="font-medium mb-1">💡 How it works:</div>
                <div>Your browser → OpenAI/ElevenLabs APIs directly</div>
                <div className="text-blue-600">Our servers are never involved in API calls</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiKeySafetyDropdown