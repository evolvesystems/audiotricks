import React from 'react'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
]

interface LanguageSelectorProps {
  selectedLanguage: string
  onLanguageChange: (language: string) => void
  disabled?: boolean
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  selectedLanguage, 
  onLanguageChange, 
  disabled = false 
}) => {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Output Language
      </label>
      <div className="relative">
        <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={disabled}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Summary will be generated in this language
      </p>
    </div>
  )
}

export default LanguageSelector