import React, { useState } from 'react'
import { sanitizeEditorHtml } from '../utils/sanitize'
import { markdownToHtml, htmlToMarkdown } from '../utils/markdownUtils'
import EditorToolbar from './RichTextEditor/EditorToolbar'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  height?: string
  defaultViewMode?: 'edit' | 'preview' | 'html'
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  content, 
  onChange, 
  placeholder = 'Enter text...',
  height = 'h-48',
  defaultViewMode = 'edit'
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'html'>(defaultViewMode)


  const handleConvertToMarkdown = () => {
    const htmlContent = markdownToHtml(content)
    const markdownContent = htmlToMarkdown(htmlContent)
    onChange(markdownContent)
    setViewMode('edit')
  }

  const formatSelection = (format: string) => {
    const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    if (!selectedText) return

    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'h1':
        formattedText = `# ${selectedText}`
        break
      case 'h2':
        formattedText = `## ${selectedText}`
        break
      case 'h3':
        formattedText = `### ${selectedText}`
        break
      case 'list':
        formattedText = selectedText.split('\n').map(line => `* ${line}`).join('\n')
        break
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end)
    onChange(newContent)

    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = start
      textarea.selectionEnd = start + formattedText.length
      textarea.focus()
    }, 0)
  }

  return (
    <div className="space-y-2">
      <EditorToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFormatSelection={formatSelection}
        onConvertToMarkdown={handleConvertToMarkdown}
      />

      {/* Content Area */}
      {viewMode === 'edit' && (
        <textarea
          id="rich-editor"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${height} p-3 border border-gray-300 rounded-b-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          placeholder={placeholder}
        />
      )}

      {viewMode === 'preview' && (
        <div className={`w-full ${height} p-3 border border-gray-300 rounded-b-md overflow-y-auto relative`}>
          {/* Edit hint overlay */}
          <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs opacity-75">
            Click "Edit" to modify content
          </div>
          <div 
            className="formatted-content prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeEditorHtml(content.includes('<') ? content : markdownToHtml(content)) 
            }}
          />
        </div>
      )}

      {viewMode === 'html' && (
        <div className={`w-full ${height} p-3 border border-gray-300 rounded-b-md overflow-y-auto`}>
          <pre className="text-xs font-mono text-gray-700">
            {markdownToHtml(content)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default RichTextEditor