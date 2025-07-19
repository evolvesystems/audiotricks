import React from 'react'
import { WordTimestamp } from './useWordSelection'

interface AudioEditorStatsProps {
  words: WordTimestamp[]
  selectedWordsCount: number
}

const AudioEditorStats: React.FC<AudioEditorStatsProps> = ({ words, selectedWordsCount }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {words.filter(w => !w.deleted).length}
          </div>
          <div className="text-sm text-gray-600">Words Remaining</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">
            {words.filter(w => w.deleted).length}
          </div>
          <div className="text-sm text-gray-600">Words Deleted</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {selectedWordsCount}
          </div>
          <div className="text-sm text-gray-600">Words Selected</div>
        </div>
      </div>
    </div>
  )
}

export default AudioEditorStats