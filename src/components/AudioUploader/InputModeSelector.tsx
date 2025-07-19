import React from 'react'

interface InputModeSelectorProps {
  inputMode: 'upload' | 'url'
  onModeChange: (mode: 'upload' | 'url') => void
  onClearError: () => void
}

const InputModeSelector: React.FC<InputModeSelectorProps> = ({
  inputMode,
  onModeChange,
  onClearError
}) => {
  return (
    <div className="flex space-x-1 mb-4 border-b border-gray-200">
      <button
        onClick={() => {
          onModeChange('upload')
          onClearError()
        }}
        className={`px-4 py-2 text-sm font-medium ${
          inputMode === 'upload'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Upload File
      </button>
      <button
        onClick={() => {
          onModeChange('url')
          onClearError()
        }}
        className={`px-4 py-2 text-sm font-medium ${
          inputMode === 'url'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        From URL
      </button>
    </div>
  )
}

export default InputModeSelector