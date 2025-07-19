import React from 'react'
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface HistoryHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onClose: () => void
}

const HistoryHeader: React.FC<HistoryHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onClose
}) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">History</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-md"
        >
          <XMarkIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>
      
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
    </div>
  )
}

export default HistoryHeader