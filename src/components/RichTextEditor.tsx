import React, { useState } from 'react'
import { 
  CodeBracketIcon, 
  EyeIcon, 
  DocumentTextIcon,
  ArrowsRightLeftIcon 
} from '@heroicons/react/24/outline'

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

  // Convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    let html = markdown

    // Split into lines for better processing
    const lines = html.split('\n')
    const processedLines: string[] = []
    let inList = false

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]

      // Check if line starts with ** and ends with **
      if (line.match(/^\*\*(.+?)\*\*$/)) {
        // This is a title line
        const title = line.replace(/^\*\*(.+?)\*\*$/, '$1')
        processedLines.push(`<h4 class="font-semibold text-gray-900 mt-4 mb-2">${title}</h4>`)
      } else if (line.trim().startsWith('**') && line.includes('**')) {
        // Bold text within a line
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        processedLines.push(`<p class="mb-2">${line}</p>`)
      } else if (line.trim().startsWith('* ')) {
        // List item
        if (!inList) {
          processedLines.push('<ul class="list-disc ml-4">')
          inList = true
        }
        processedLines.push(`<li>${line.substring(2)}</li>`)
      } else if (line.trim() === '') {
        // Empty line
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        processedLines.push('<br/>')
      } else {
        // Regular paragraph
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        // Process inline formatting
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        line = line.replace(/\*(.+?)\*/g, '<em>$1</em>')
        if (line.trim()) {
          processedLines.push(`<p class="mb-2">${line}</p>`)
        }
      }
    }

    // Close any open list
    if (inList) {
      processedLines.push('</ul>')
    }

    return processedLines.join('\n')
  }

  // Convert HTML to markdown
  const htmlToMarkdown = (html: string): string => {
    let markdown = html

    // Remove HTML tags but keep content
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*')
    markdown = markdown.replace(/<li>(.*?)<\/li>/gi, '* $1\n')
    markdown = markdown.replace(/<ul>(.*?)<\/ul>/gis, '$1')
    markdown = markdown.replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n')
    
    // Remove any remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '')
    
    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim()

    return markdown
  }

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
      {/* Toolbar */}
      <div className="flex items-center justify-between border border-gray-200 rounded-t-md bg-gray-50 px-2 py-1">
        <div className="flex items-center space-x-1">
          {viewMode === 'edit' && (
            <>
              <button
                onClick={() => formatSelection('bold')}
                className="p-1 rounded hover:bg-gray-200"
                title="Bold"
              >
                <span className="font-bold text-sm">B</span>
              </button>
              <button
                onClick={() => formatSelection('italic')}
                className="p-1 rounded hover:bg-gray-200"
                title="Italic"
              >
                <span className="italic text-sm">I</span>
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <button
                onClick={() => formatSelection('h1')}
                className="p-1 rounded hover:bg-gray-200 text-sm"
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => formatSelection('h2')}
                className="p-1 rounded hover:bg-gray-200 text-sm"
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => formatSelection('h3')}
                className="p-1 rounded hover:bg-gray-200 text-sm"
                title="Heading 3"
              >
                H3
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <button
                onClick={() => formatSelection('list')}
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
            onClick={handleConvertToMarkdown}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            title="Convert HTML to Markdown"
          >
            <ArrowsRightLeftIcon className="h-3 w-3" />
            <span>Convert to MD</span>
          </button>
          
          <div className="flex items-center bg-white border border-gray-300 rounded">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1 text-xs flex items-center space-x-1 ${viewMode === 'edit' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Edit Mode"
            >
              <DocumentTextIcon className="h-3 w-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-xs flex items-center space-x-1 ${viewMode === 'preview' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Preview Mode"
            >
              <EyeIcon className="h-3 w-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('html')}
              className={`px-3 py-1 text-xs flex items-center space-x-1 ${viewMode === 'html' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              title="HTML Code"
            >
              <CodeBracketIcon className="h-3 w-3" />
              <span>HTML</span>
            </button>
          </div>
        </div>
      </div>

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
              __html: content.includes('<') ? content : markdownToHtml(content) 
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