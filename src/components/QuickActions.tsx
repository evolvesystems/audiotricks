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
  compact?: boolean
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
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center pb-2 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-500">Get help and access your history</p>
      </div>

      {/* History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">History</span>
          </div>
          <span className="text-xs text-gray-500">{historyCount} items</span>
        </div>
        
        <button
          onClick={onShowHistory}
          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          View History
        </button>
      </div>

      {/* Help */}
      <div className="space-y-3">
        <div className="flex items-center">
          <QuestionMarkCircleIcon className="h-4 w-4 mr-2 text-green-600" />
          <span className="text-sm font-medium text-gray-900">Help</span>
        </div>
        
        <div className="space-y-2">
          {quickLinks.map((link, index) => (
            <button
              key={index}
              onClick={link.action}
              className="w-full text-left p-2 rounded-md border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center">
                <link.icon className={`h-4 w-4 mr-2 text-${link.color}-600 flex-shrink-0`} />
                <div>
                  <h4 className="font-medium text-gray-900 text-xs">{link.title}</h4>
                  <p className="text-xs text-gray-500">{link.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <h4 className="text-xs font-semibold text-yellow-900 mb-1">
          💡 Pro Tip
        </h4>
        <p className="text-xs text-yellow-800">
          For best results, use high-quality audio with clear speech.
        </p>
      </div>
    </div>
  )
}

export default QuickActions