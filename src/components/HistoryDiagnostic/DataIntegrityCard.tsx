import React from 'react'

interface DataIntegrityCardProps {
  dataIntegrity: {
    totalItems: number
    validItems: number
    invalidItems: number
    corruptedItems: number
    duplicateItems: number
  }
}

const DataIntegrityCard: React.FC<DataIntegrityCardProps> = ({ dataIntegrity }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Data Integrity Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{dataIntegrity.totalItems}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{dataIntegrity.validItems}</div>
          <div className="text-sm text-gray-600">Valid Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{dataIntegrity.invalidItems}</div>
          <div className="text-sm text-gray-600">Invalid Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{dataIntegrity.corruptedItems}</div>
          <div className="text-sm text-gray-600">Corrupted Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{dataIntegrity.duplicateItems}</div>
          <div className="text-sm text-gray-600">Duplicate Items</div>
        </div>
      </div>
    </div>
  )
}

export default DataIntegrityCard