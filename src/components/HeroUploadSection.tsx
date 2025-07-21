import React from 'react'
import { 
  PlayIcon,
  DocumentIcon,
  SpeakerWaveIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { BackendAudioUploader } from './AudioUploader/BackendAudioUploader'
import APIErrorBoundary from './APIErrorBoundary'

interface HeroUploadSectionProps {
  apiKey: string
  onProcessingComplete: (results: any) => void
  onError: (error: string) => void
  defaultSettings: any
}

const HeroUploadSection: React.FC<HeroUploadSectionProps> = ({
  apiKey,
  onProcessingComplete,
  onError,
  defaultSettings
}) => {

  const features = [
    {
      icon: DocumentIcon,
      title: 'Accurate Transcripts',
      description: 'Word-for-word transcription with timestamps'
    },
    {
      icon: SpeakerWaveIcon,
      title: 'Smart Summaries',
      description: 'AI-powered key insights and takeaways'
    },
    {
      icon: PlayIcon,
      title: 'Audio Editing',
      description: 'Edit text and sync audio automatically'
    }
  ]

  return (
    <div id="upload-section" className="bg-white py-20 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Start Processing Your Audio
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your preferred method to get started. We support files, URLs, and live recording.
          </p>
        </div>

        {/* What You'll Get - Now above the upload section */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What You'll Get</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sample Output Preview */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Sample Output</h4>
                <span className="text-xs text-gray-500">2 minutes ago</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-700 mb-1">Transcript</p>
                  <p className="text-gray-600">"Welcome to our quarterly review meeting. Today we'll cover our progress, key achievements, and upcoming goals..."</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-blue-700 mb-1">Key Summary</p>
                  <p className="text-blue-600">Quarterly review focusing on progress metrics, team achievements, and strategic planning for next quarter.</p>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">📊 247 words • 🕐 2:45 duration</span>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section - Now full width */}
        <div className="max-w-4xl mx-auto">
          {/* Upload Component - Full width */}
          <div className="bg-gray-50 rounded-2xl p-12 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <APIErrorBoundary apiProvider="backend">
              <BackendAudioUploader
                onUploadComplete={(upload) => {
                  // Convert backend upload to frontend processing complete format
                  onProcessingComplete({
                    audioFile: null,
                    audioUrl: upload.cdnUrl || upload.storageUrl,
                    transcript: { text: '' },
                    summary: { total_duration: upload.duration || 0 },
                    uploadId: upload.id
                  })
                }}
                onError={onError}
                workspaceId="default" // TODO: Use actual workspace ID from context
              />
            </APIErrorBoundary>
          </div>

          {/* Supported Formats */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Supported formats:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['MP3', 'WAV', 'M4A', 'FLAC', 'OGG', 'MP4', 'MOV', 'AVI'].map((format) => (
                <span key={format} className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg font-medium">
                  {format}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-4">Maximum file size: 150MB • Files over 25MB are automatically split</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroUploadSection