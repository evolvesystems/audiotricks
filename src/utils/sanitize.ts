import DOMPurify from 'dompurify'

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @param options - Additional DOMPurify options
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string, options?: DOMPurify.Config): string {
  // Configure allowed tags and attributes for our use cases
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'div', 'strong', 'b', 'em', 'i', 'u',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'style',
      'data-timestamp', 'data-index', 'data-id'
    ],
    ALLOW_DATA_ATTR: false, // We explicitly allow only specific data attributes
    KEEP_CONTENT: true,
    ADD_ATTR: ['target'], // Allow target for links
    ...options
  }

  // Sanitize with our configuration
  const clean = DOMPurify.sanitize(dirty, defaultConfig)
  
  return clean
}

/**
 * Sanitizes HTML for markdown content specifically
 * More permissive for code blocks and formatting
 */
export function sanitizeMarkdownHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'div', 'strong', 'b', 'em', 'i', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'hr', 'details', 'summary'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'style',
      'src', 'alt', 'width', 'height', 'align',
      'data-language', 'data-timestamp'
    ]
  })
}

/**
 * Sanitizes HTML for rich text editor content
 * Allows styling attributes for editor functionality
 */
export function sanitizeEditorHtml(dirty: string): string {
  // Create a custom hook to handle style filtering
  const hook = DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'style') {
      const allowedStyles = [
        'color', 'background-color', 'font-size', 'font-weight',
        'font-style', 'text-decoration', 'text-align'
      ]
      
      const styleValue = data.attrValue
      const styleRules = styleValue.split(';').map(rule => rule.trim()).filter(Boolean)
      const filteredRules = styleRules.filter(rule => {
        const property = rule.split(':')[0].trim()
        return allowedStyles.includes(property)
      })
      
      data.attrValue = filteredRules.join('; ')
      if (filteredRules.length === 0) {
        data.keepAttr = false
      }
    }
  })

  const result = sanitizeHtml(dirty, {
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'style',
      'contenteditable', 'data-placeholder', 'data-format'
    ]
  })

  // Remove the hook after use
  DOMPurify.removeHook('uponSanitizeAttribute')

  return result
}