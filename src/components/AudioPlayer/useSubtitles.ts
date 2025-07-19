import { useState, useEffect } from 'react'

interface UseSubtitlesProps {
  transcript?: string
  currentTime: number
  duration: number
  showSubtitles?: boolean
}

export const useSubtitles = ({ transcript, currentTime, duration, showSubtitles = false }: UseSubtitlesProps) => {
  const [showSubtitlePanel, setShowSubtitlePanel] = useState(showSubtitles)
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('')

  // Extract subtitle for current time
  const getSubtitleForTime = (time: number): string => {
    if (!transcript || !showSubtitlePanel) return ''
    
    // Simple subtitle extraction - split transcript into sentences
    // and estimate timing based on duration
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim())
    if (sentences.length === 0) return ''
    
    const timePerSentence = duration / sentences.length
    const currentSentenceIndex = Math.floor(time / timePerSentence)
    
    if (currentSentenceIndex >= 0 && currentSentenceIndex < sentences.length) {
      return sentences[currentSentenceIndex].trim()
    }
    
    return ''
  }

  useEffect(() => {
    const subtitle = getSubtitleForTime(currentTime)
    setCurrentSubtitle(subtitle)
  }, [currentTime, transcript, duration, showSubtitlePanel])

  return {
    showSubtitlePanel,
    setShowSubtitlePanel,
    currentSubtitle
  }
}