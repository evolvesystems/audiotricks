import { describe, test, expect } from 'vitest'
import { sanitizeHtml, sanitizeMarkdownHtml, sanitizeEditorHtml } from '../../utils/sanitize'

describe('sanitizeHtml', () => {
  test('allows safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    const output = sanitizeHtml(input)
    expect(output).toBe('<p>Hello <strong>world</strong></p>')
  })

  test('removes dangerous script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>'
    const output = sanitizeHtml(input)
    expect(output).toBe('<p>Hello</p>')
  })

  test('removes onclick attributes', () => {
    const input = '<p onclick="alert(\'XSS\')">Click me</p>'
    const output = sanitizeHtml(input)
    expect(output).toBe('<p>Click me</p>')
  })

  test('removes javascript: URLs', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Link</a>'
    const output = sanitizeHtml(input)
    expect(output).toBe('<a>Link</a>')
  })

  test('keeps allowed attributes', () => {
    const input = '<a href="https://example.com" target="_blank">Link</a>'
    const output = sanitizeHtml(input)
    expect(output).toBe('<a href="https://example.com" target="_blank">Link</a>')
  })

  test('keeps data attributes we explicitly allow', () => {
    const input = '<span data-timestamp="123" data-evil="bad">Text</span>'
    const output = sanitizeHtml(input)
    expect(output).toBe('<span data-timestamp="123">Text</span>')
  })

  test('removes iframe tags', () => {
    const input = '<iframe src="https://evil.com"></iframe>'
    const output = sanitizeHtml(input)
    expect(output).toBe('')
  })

  test('removes form elements', () => {
    const input = '<form action="/submit"><input type="text" /></form>'
    const output = sanitizeHtml(input)
    expect(output).toBe('')
  })

  test('handles malformed HTML gracefully', () => {
    const input = '<p>Unclosed paragraph<script>alert("XSS")'
    const output = sanitizeHtml(input)
    expect(output).not.toContain('script')
    expect(output).toContain('Unclosed paragraph')
  })
})

describe('sanitizeMarkdownHtml', () => {
  test('allows markdown-specific tags like img', () => {
    const input = '<img src="image.png" alt="Test" />'
    const output = sanitizeMarkdownHtml(input)
    expect(output).toBe('<img src="image.png" alt="Test">')
  })

  test('allows code blocks with data-language', () => {
    const input = '<pre><code data-language="javascript">const x = 1;</code></pre>'
    const output = sanitizeMarkdownHtml(input)
    expect(output).toBe('<pre><code data-language="javascript">const x = 1;</code></pre>')
  })

  test('still removes dangerous content', () => {
    const input = '<img src="x" onerror="alert(\'XSS\')" />'
    const output = sanitizeMarkdownHtml(input)
    expect(output).toBe('<img src="x">')
  })
})

describe('sanitizeEditorHtml', () => {
  test('allows style attributes', () => {
    const input = '<p style="color: red; font-size: 16px;">Styled text</p>'
    const output = sanitizeEditorHtml(input)
    // The output might not have the trailing semicolon, which is fine
    expect(output).toMatch(/<p style="color: red; font-size: 16px;?">Styled text<\/p>/)
  })

  test('removes disallowed styles', () => {
    const input = '<p style="position: fixed; z-index: 9999;">Text</p>'
    const output = sanitizeEditorHtml(input)
    // DOMPurify doesn't remove the style attribute entirely, just the disallowed styles
    expect(output).toContain('<p')
    expect(output).toContain('Text</p>')
    expect(output).not.toContain('position')
    expect(output).not.toContain('z-index')
  })

  test('allows contenteditable attribute', () => {
    const input = '<div contenteditable="true">Editable</div>'
    const output = sanitizeEditorHtml(input)
    expect(output).toBe('<div contenteditable="true">Editable</div>')
  })
})