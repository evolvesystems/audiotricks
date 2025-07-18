import React from 'react'
import { 
  MicrophoneIcon, 
  SparklesIcon, 
  LanguageIcon, 
  SpeakerWaveIcon, 
  ScissorsIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const FeaturesSection: React.FC = () => {
  const mainFeatures = [
    {
      icon: MicrophoneIcon,
      title: 'Accurate Transcription',
      description: 'Powered by OpenAI Whisper for industry-leading accuracy across 100+ languages',
      details: [
        'State-of-the-art speech recognition',
        'Handles accents, dialects, and noise',
        'Automatic punctuation and formatting',
        'Word-level timestamps included'
      ],
      color: 'blue'
    },
    {
      icon: SparklesIcon,
      title: 'Smart Summaries',
      description: 'GPT-4 creates comprehensive summaries with key takeaways and action items',
      details: [
        'Intelligent content analysis',
        'Key moments identification',
        'Action items extraction',
        'Customizable summary styles'
      ],
      color: 'purple'
    },
    {
      icon: SpeakerWaveIcon,
      title: 'Voice Synthesis',
      description: 'Transform transcripts into natural speech with ElevenLabs AI voices',
      details: [
        'Multiple voice options',
        'Natural-sounding speech',
        'Adjustable speed and tone',
        'High-quality audio output'
      ],
      color: 'green'
    },
    {
      icon: ScissorsIcon,
      title: 'Audio Editor',
      description: 'Word-level editing with timestamps and precise audio splicing',
      details: [
        'Click-to-edit transcripts',
        'Automatic audio sync',
        'Precise clip creation',
        'Export edited segments'
      ],
      color: 'orange'
    }
  ]

  const additionalFeatures = [
    {
      icon: LanguageIcon,
      title: 'Multi-Language',
      description: 'Transcribe in any language, summarize in 10+ languages'
    },
    {
      icon: ClockIcon,
      title: 'Fast Processing',
      description: 'Get results in minutes, not hours'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Private',
      description: 'Your data is encrypted and never stored permanently'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Cost Effective',
      description: 'Pay only for what you use with transparent pricing'
    }
  ]

  return (
    <div className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Audio Analysis
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From transcription to analysis, editing to synthesis - all the tools you need 
            to extract maximum value from your audio content.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {mainFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl bg-${feature.color}-100 flex-shrink-0`}>
                    <Icon className={`h-8 w-8 text-${feature.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-500">
                          <CheckCircleIcon className={`h-4 w-4 text-${feature.color}-500 mr-2 flex-shrink-0`} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {additionalFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Audio?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of users who are already extracting valuable insights from their audio content. 
              Start your first transcription today - no credit card required.
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-white text-gray-900 text-lg font-semibold rounded-full hover:bg-gray-50 transition-colors">
              Get Started Free
              <SparklesIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturesSection