import React from 'react'
import { MicrophoneIcon, SparklesIcon, LanguageIcon, SpeakerWaveIcon, ScissorsIcon } from '@heroicons/react/24/outline'

const HeroSection: React.FC = () => {
  const features = [
    {
      icon: MicrophoneIcon,
      title: 'Accurate Transcription',
      description: 'Powered by OpenAI Whisper for industry-leading accuracy'
    },
    {
      icon: SparklesIcon,
      title: 'Smart Summaries',
      description: 'GPT-4 creates comprehensive summaries with key takeaways'
    },
    {
      icon: SpeakerWaveIcon,
      title: 'Voice Synthesis',
      description: 'Transform transcripts into natural speech with ElevenLabs AI'
    },
    {
      icon: ScissorsIcon,
      title: 'Audio Editor',
      description: 'Word-level editing with timestamps and audio splicing'
    },
    {
      icon: LanguageIcon,
      title: 'Multi-Language',
      description: 'Transcribe any language, summarize in 10+ languages'
    }
  ]

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Transform Audio into Actionable Insights
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Upload or link to any audio file and get accurate transcripts, 
          comprehensive summaries, and key moments. Then edit with precision, 
          create audio clips, and generate natural speech from your text.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <Icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default HeroSection