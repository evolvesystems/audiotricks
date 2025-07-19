import React, { useState, useRef } from 'react'
import { AudioProcessingResponse } from '../types'
import { ElevenLabsVoice, ElevenLabsSettings, DEFAULT_ELEVENLABS_SETTINGS, generateSpeechFromTranscript } from '../utils/elevenlabs'
import VoiceSelector from './VoiceSelector'
import VoiceSettings from './VoiceSynthesis/VoiceSettings'
import GenerationControls from './VoiceSynthesis/GenerationControls'

interface VoiceSynthesisProps {
  results: AudioProcessingResponse
  editedWords: Array<{word: string, deleted: boolean}>
  elevenLabsKey: string
}

const VoiceSynthesis: React.FC<VoiceSynthesisProps> = ({ results, editedWords, elevenLabsKey }) => {
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice | null>(null)
  const [settings, setSettings] = useState<ElevenLabsSettings>(DEFAULT_ELEVENLABS_SETTINGS)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState<Blob | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  const getEditedTranscript = () => {
    return editedWords
      .filter(word => !word.deleted)
      .map(word => word.word)
      .join(' ')
  }

  const generateVoice = async () => {
    if (!elevenLabsKey || !selectedVoice) {
      alert('Please enter your ElevenLabs API key and select a voice')
      return
    }

    const transcript = getEditedTranscript()
    if (!transcript.trim()) {
      alert('No text to synthesize. Please ensure your transcript is not empty.')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setGeneratedAudio(null)

    try {
      const audioBlob = await generateSpeechFromTranscript(
        transcript,
        selectedVoice.voice_id,
        elevenLabsKey,
        settings,
        setProgress
      )

      setGeneratedAudio(audioBlob)
      
      // Create audio URL for playback
      const audioUrl = URL.createObjectURL(audioBlob)
      if (audioRef.current) {
        audioRef.current.src = audioUrl
      }
      
    } catch (error) {
      alert('Failed to generate voice. Please check your API key and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current || !generatedAudio) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const downloadAudio = () => {
    if (!generatedAudio) return

    const url = URL.createObjectURL(generatedAudio)
    const a = document.createElement('a')
    a.href = url
    a.download = `synthesized-voice-${selectedVoice?.name || 'audio'}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const wordCount = getEditedTranscript().split(' ').length
  const estimatedCost = Math.ceil(wordCount / 1000) * 0.30 // Rough estimate

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Selection</h3>
        <VoiceSelector
          selectedVoice={selectedVoice}
          onVoiceSelect={setSelectedVoice}
          apiKey={elevenLabsKey}
        />
      </div>

      <VoiceSettings
        settings={settings}
        onSettingsChange={setSettings}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      <GenerationControls
        wordCount={wordCount}
        estimatedCost={estimatedCost}
        previewText={getEditedTranscript()}
        isGenerating={isGenerating}
        progress={progress}
        generatedAudio={generatedAudio}
        isPlaying={isPlaying}
        canGenerate={!!elevenLabsKey && !!selectedVoice}
        onGenerate={generateVoice}
        onTogglePlayback={togglePlayback}
        onDownload={downloadAudio}
      />

      {/* Audio Player */}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        controls
        style={{ display: generatedAudio ? 'block' : 'none' }}
        className="w-full"
      />

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Voice Synthesis Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Edit your transcript first to remove unwanted words</li>
          <li>• Choose a voice that matches your content style</li>
          <li>• Adjust voice settings for different moods and tones</li>
          <li>• Preview voices before generating to find the perfect match</li>
          <li>• Longer texts may take more time and cost more credits</li>
        </ul>
      </div>
    </div>
  )
}

export default VoiceSynthesis