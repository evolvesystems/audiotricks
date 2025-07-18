import React from 'react'
import { AcademicCapIcon, SparklesIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline'

export type SummaryStyle = 'formal' | 'creative' | 'conversational'

interface SummaryStyleSelectorProps {
  selectedStyle: SummaryStyle
  onStyleChange: (style: SummaryStyle) => void
  disabled?: boolean
}

const SummaryStyleSelector: React.FC<SummaryStyleSelectorProps> = ({ 
  selectedStyle, 
  onStyleChange, 
  disabled = false 
}) => {
  const styles = [
    {
      id: 'formal' as SummaryStyle,
      name: 'Formal',
      description: 'Technical and analytical',
      icon: AcademicCapIcon,
      color: 'blue'
    },
    {
      id: 'creative' as SummaryStyle,
      name: 'Creative',
      description: 'Friendly and engaging',
      icon: SparklesIcon,
      color: 'purple'
    },
    {
      id: 'conversational' as SummaryStyle,
      name: 'Conversational',
      description: 'Natural and casual',
      icon: ChatBubbleBottomCenterTextIcon,
      color: 'green'
    }
  ]

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Summary Style</label>
      <div className="grid grid-cols-3 gap-4">
        {styles.map((style) => {
          const Icon = style.icon
          const isSelected = selectedStyle === style.id
          return (
            <button
              key={style.id}
              onClick={() => onStyleChange(style.id)}
              disabled={disabled}
              className={`
                relative p-4 rounded-xl border-2 transition-all min-h-[100px] flex flex-col items-center justify-center text-center
                ${isSelected 
                  ? style.color === 'blue' ? 'border-blue-500 bg-blue-50' :
                    style.color === 'purple' ? 'border-purple-500 bg-purple-50' :
                    'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <Icon className={`h-7 w-7 mx-auto mb-2 ${
                isSelected 
                  ? style.color === 'blue' ? 'text-blue-600' :
                    style.color === 'purple' ? 'text-purple-600' :
                    'text-green-600'
                  : 'text-gray-400'
              }`} />
              <div className="text-sm font-medium text-gray-900 mb-1">{style.name}</div>
              <div className="text-xs text-gray-500 leading-tight">{style.description}</div>
              {isSelected && (
                <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                  style.color === 'blue' ? 'bg-blue-500' :
                  style.color === 'purple' ? 'bg-purple-500' :
                  'bg-green-500'
                }`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SummaryStyleSelector