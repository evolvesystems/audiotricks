import React from 'react'
import { 
  ClockIcon, 
  QuestionMarkCircleIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

interface QuickActionsProps {
  onShowHistory: () => void
  onShowHelp: () => void
  historyCount: number
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  onShowHistory, 
  onShowHelp, 
  historyCount 
}) => {
  const quickLinks = [
    {
      title: 'Getting Started',
      description: 'New to AudioTricks? Start here',
      icon: RocketLaunchIcon,
      action: onShowHelp,
      color: 'blue'
    },
    {
      title: 'API Costs',
      description: 'Understand pricing and estimates',
      icon: CurrencyDollarIcon,
      action: onShowHelp,
      color: 'green'
    },
    {
      title: 'Privacy & Security',
      description: 'How we protect your data',
      icon: ShieldCheckIcon,
      action: onShowHelp,
      color: 'purple'
    }
  ]

  const features = [
    '🎯 Accurate transcription with Whisper',
    '✨ AI-powered summaries with GPT-4',
    '🗣️ Voice synthesis with ElevenLabs',
    '✂️ Word-level audio editing',
    '🌍 Multi-language support',
    '📊 Key moments extraction',
    '💾 Automatic history saving',
    '🔒 Secure & private processing'
  ]

  return (
    <>
      {/* History Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
            Recent History
          </h3>
          <span className="text-sm text-gray-500">{historyCount} items</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Access your previously processed audio transcripts and summaries
        </p>
        
        <button
          onClick={onShowHistory}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          View History
        </button>
      </div>

      {/* Quick Help */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <QuestionMarkCircleIcon className="h-5 w-5 mr-2 text-green-600" />
          Quick Help
        </h3>
        
        <div className="space-y-3">
          {quickLinks.map((link, index) => (
            <button
              key={index}
              onClick={link.action}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start">
                <link.icon className={`h-5 w-5 mr-3 text-${link.color}-600 flex-shrink-0 mt-0.5`} />
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{link.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{link.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features List */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SparklesIcon className="h-5 w-5 mr-2 text-indigo-600" />
          What You Can Do
        </h3>
        
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="text-sm text-gray-700">
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">
          💡 Pro Tip
        </h4>
        <p className="text-xs text-yellow-800">
          For best results, use high-quality audio with clear speech. 
          MP3 format at 128kbps or higher is recommended.
        </p>
      </div>
    </>
  )
}

export default QuickActions