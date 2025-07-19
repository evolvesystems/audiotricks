import React from 'react'
import { 
  CodeBracketIcon, 
  EyeIcon, 
  DocumentTextIcon,
  ArrowsRightLeftIcon 
} from '@heroicons/react/24/outline'

interface EditorToolbarProps {
  viewMode: 'edit' | 'preview' | 'html'
  onViewModeChange: (mode: 'edit' | 'preview' | 'html') => void
  onFormatSelection: (format: string) => void
  onConvertToMarkdown: () => void
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  viewMode,
  onViewModeChange,
  onFormatSelection,
  onConvertToMarkdown
}) => {
  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-t-md bg-gray-50 px-2 py-1">
      <div className="flex items-center space-x-1">
        {viewMode === 'edit' && (
          <>
            <button
              onClick={() => onFormatSelection('bold')}
              className="p-1 rounded hover:bg-gray-200"
              title="Bold"
            >
              <span className="font-bold text-sm">B</span>
            </button>
            <button
              onClick={() => onFormatSelection('italic')}
              className="p-1 rounded hover:bg-gray-200"
              title="Italic"
            >
              <span className="italic text-sm">I</span>
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              onClick={() => onFormatSelection('h1')}
              className="p-1 rounded hover:bg-gray-200 text-sm"
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => onFormatSelection('h2')}
              className="p-1 rounded hover:bg-gray-200 text-sm"
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => onFormatSelection('h3')}
              className="p-1 rounded hover:bg-gray-200 text-sm"
              title="Heading 3"
            >
              H3
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              onClick={() => onFormatSelection('list')}
              className="p-1 rounded hover:bg-gray-200"
              title="Bullet List"
            >
              <span className="text-sm">• List</span>
            </button>
          </>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onConvertToMarkdown}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          title="Convert HTML to Markdown"
        >
          <ArrowsRightLeftIcon className="h-3 w-3" />
          <span>Convert to MD</span>
        </button>
        
        <div className="flex items-center bg-white border border-gray-300 rounded">
          <button
            onClick={() => onViewModeChange('edit')}
            className={`px-3 py-1 text-xs flex items-center space-x-1 ${viewMode === 'edit' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Edit Mode"
          >
            <DocumentTextIcon className="h-3 w-3" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onViewModeChange('preview')}
            className={`px-3 py-1 text-xs flex items-center space-x-1 ${viewMode === 'preview' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Preview Mode"
          >
            <EyeIcon className="h-3 w-3" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => onViewModeChange('html')}
            className={`px-3 py-1 text-xs flex items-center space-x-1 ${viewMode === 'html' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="HTML Code"
          >
            <CodeBracketIcon className="h-3 w-3" />
            <span>HTML</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditorToolbar