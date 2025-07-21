import React from 'react'
import { AudioProcessingResponse } from '../../types'
import { UserSettings } from '../Settings'
import { BackendAudioUploader } from '../AudioUploader/BackendAudioUploader'
import ResultsDisplay2 from '../ResultsDisplay2'
import HeroSection from '../HeroSection'
import HeroUploadSection from '../HeroUploadSection'
import FeaturesSection from '../FeaturesSection'
import UseCasesSection from '../UseCasesSection'
import QuickActions from '../QuickActions'

interface AppContentProps {
  results: AudioProcessingResponse | null
  error: string | null
  apiKey: string
  elevenLabsKey: string
  settings: UserSettings
  showQuickActions: boolean
  history?: any[]
  isGuest?: boolean
  token?: string | null
  onProcessingComplete: (results: AudioProcessingResponse) => void
  onError: (error: Error) => void
  onExport: (format: 'txt' | 'json' | 'pdf' | 'srt' | 'docx') => void
  onReprocess: (newResults: AudioProcessingResponse) => void
  onToggleQuickActions: () => void
  onNewUpload: () => void
}

const AppContent: React.FC<AppContentProps> = ({
  results,
  error,
  apiKey,
  elevenLabsKey,
  settings,
  showQuickActions,
  history,
  isGuest = false,
  token = null,
  onProcessingComplete,
  onError,
  onExport,
  onReprocess,
  onToggleQuickActions,
  onNewUpload
}) => {
  if (results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6">
            <div className="flex-1">
              <ResultsDisplay2 
                results={results}
                onExport={onExport}
                onReprocess={onReprocess}
                elevenLabsKey={elevenLabsKey}
                currentSettings={settings}
              />
            </div>
            {showQuickActions && (
              <div className="w-80 flex-shrink-0">
                <QuickActions onClose={onToggleQuickActions} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection onGetStarted={() => {
        const uploadSection = document.getElementById('upload-section')
        if (uploadSection) {
          uploadSection.scrollIntoView({ behavior: 'smooth' })
        }
      }} />
      <HeroUploadSection
        apiKey={apiKey}
        onProcessingComplete={onProcessingComplete}
        onError={onError}
        defaultSettings={settings}
      />
      <FeaturesSection />
      <UseCasesSection />
      
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppContent