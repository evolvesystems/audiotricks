import React, { useState } from 'react'
import { 
  CloudArrowUpIcon, 
  MicrophoneIcon, 
  LinkIcon, 
  PlayIcon,
  DocumentIcon,
  SpeakerWaveIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import AudioUploader from './AudioUploader'

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
  const [selectedMethod, setSelectedMethod] = useState<'upload' | 'link' | 'record'>('upload')

  const uploadMethods = [
    {
      id: 'upload',
      title: 'Upload File',
      description: 'Drop your audio file here',
      icon: CloudArrowUpIcon,
      color: 'blue'
    },
    {
      id: 'link',
      title: 'URL Link',
      description: 'Paste YouTube, podcast, or media URL',
      icon: LinkIcon,
      color: 'green'
    },
    {
      id: 'record',
      title: 'Record Now',
      description: 'Record directly from your microphone',
      icon: MicrophoneIcon,
      color: 'purple'
    }
  ]

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
    <div className="bg-white py-20 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Start Processing Your Audio
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your preferred method to get started. We support files, URLs, and live recording.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Upload Interface */}
          <div className="order-2 lg:order-1">
            {/* Method Selection */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {uploadMethods.map((method) => {
                const Icon = method.icon
                const isSelected = selectedMethod === method.id
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id as any)}
                    className={`flex items-center px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {method.title}
                  </button>
                )
              })}
            </div>

            {/* Upload Component */}
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
              <AudioUploader
                apiKey={apiKey}
                onProcessingComplete={onProcessingComplete}
                onError={onError}
                defaultSettings={defaultSettings}
              />
            </div>

            {/* Supported Formats */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Supported formats:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['MP3', 'WAV', 'M4A', 'FLAC', 'OGG', 'MP4', 'MOV', 'AVI'].map((format) => (
                  <span key={format} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    {format}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Maximum file size: 25MB</p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="order-1 lg:order-2">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What You'll Get</h3>
              
              <div className="space-y-6 mb-8">
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
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
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
        </div>
      </div>
    </div>
  )
}

export default HeroUploadSection