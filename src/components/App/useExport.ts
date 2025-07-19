import { AudioProcessingResponse } from '../../types'

export const useExport = () => {
  const handleExport = (results: AudioProcessingResponse, format: 'txt' | 'json') => {
    if (!results) return

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'txt') {
      content = `TRANSCRIPT:\n\n${results.transcript.text}\n\nSUMMARY:\n\n${results.summary.summary}\n\nKEY MOMENTS:\n\n${results.summary.key_moments.map(moment => `${moment.timestamp} - ${moment.title}\n${moment.description}`).join('\n\n')}`
      filename = 'transcript-summary.txt'
      mimeType = 'text/plain'
    } else {
      content = JSON.stringify(results, null, 2)
      filename = 'transcript-summary.json'
      mimeType = 'application/json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { handleExport }
}