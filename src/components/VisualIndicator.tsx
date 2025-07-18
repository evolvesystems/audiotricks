import React from 'react'

interface VisualIndicatorProps {
  value: number
  max: number
  label: string
  color?: 'blue' | 'green' | 'purple' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
}

const VisualIndicator: React.FC<VisualIndicatorProps> = ({ 
  value, 
  max, 
  label, 
  color = 'blue',
  size = 'md' 
}) => {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    yellow: 'from-yellow-500 to-orange-500'
  }
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{value} / {max}</span>
      </div>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default VisualIndicator