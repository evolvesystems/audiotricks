export const convertMarkdownToHtml = (markdown: string): string => {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900 border-b border-gray-200 pb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-6 text-gray-900">$1</h1>')
    // Bold and Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Lists
    .replace(/^\d+\. (.+)$/gim, '<li class="ml-6 mb-2 list-decimal">$1</li>')
    .replace(/^\* (.+)$/gim, '<li class="ml-6 mb-2 list-disc">$1</li>')
    // Code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
    // Tables
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(cell => cell.trim())
      const isHeader = cells.every(cell => cell.includes('---'))
      if (isHeader) return ''
      
      const cellHtml = cells.map(cell => `<td class="border border-gray-300 px-3 py-2">${cell.trim()}</td>`).join('')
      return `<tr>${cellHtml}</tr>`
    })
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
  
  // Wrap in paragraph tags
  html = '<p class="mb-4 text-gray-700 leading-relaxed">' + html + '</p>'
  
  // Wrap lists
  html = html.replace(/(<li class="ml-6 mb-2 list-disc">.*<\/li>)/s, '<ul class="mb-4">$1</ul>')
  html = html.replace(/(<li class="ml-6 mb-2 list-decimal">.*<\/li>)/s, '<ol class="mb-4">$1</ol>')
  
  // Wrap tables
  html = html.replace(/(<tr>.*<\/tr>)/s, '<table class="mb-4 w-full border-collapse">$1</table>')
  
  // Clean up
  html = html.replace(/<p class="mb-4 text-gray-700 leading-relaxed"><\/p>/g, '')
  
  return html
}