export const markdownToHtml = (markdown: string): string => {
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

export const htmlToMarkdown = (html: string): string => {
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