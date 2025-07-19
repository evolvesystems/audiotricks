import React from 'react'

interface StorageAnalysisCardProps {
  storageAnalysis: {
    totalKeys: number
    historyKeys: string[]
    storageUsage: number
    quotaExceeded: boolean
  }
}

const StorageAnalysisCard: React.FC<StorageAnalysisCardProps> = ({ storageAnalysis }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Storage Analysis</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{storageAnalysis.totalKeys}</div>
          <div className="text-sm text-gray-600">Total Keys</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{storageAnalysis.historyKeys.length}</div>
          <div className="text-sm text-gray-600">History Keys</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(storageAnalysis.storageUsage / 1024)}KB
          </div>
          <div className="text-sm text-gray-600">Storage Used</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${storageAnalysis.quotaExceeded ? 'text-red-600' : 'text-green-600'}`}>
            {storageAnalysis.quotaExceeded ? 'YES' : 'NO'}
          </div>
          <div className="text-sm text-gray-600">Quota Exceeded</div>
        </div>
      </div>
      
      {storageAnalysis.historyKeys.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Found History Keys:</h4>
          <div className="flex flex-wrap gap-2">
            {storageAnalysis.historyKeys.map(key => (
              <code key={key} className="px-2 py-1 bg-gray-200 rounded text-xs">{key}</code>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StorageAnalysisCard