import React, { useState, useRef } from 'react'
import { 
  SpeakerWaveIcon, 
  PlayIcon, 
  PauseIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { AudioProcessingResponse } from '../types'
import { ElevenLabsVoice, ElevenLabsSettings, DEFAULT_ELEVENLABS_SETTINGS, generateSpeechFromTranscript } from '../utils/elevenlabs'
import VoiceSelector from './VoiceSelector'
import ElevenLabsKeyInput from './ElevenLabsKeyInput'

interface VoiceSynthesisProps {
  results: AudioProcessingResponse
  editedWords: Array<{word: string, deleted: boolean}>
}

const VoiceSynthesis: React.FC<VoiceSynthesisProps> = ({ results, editedWords }) => {
  const [elevenLabsKey, setElevenLabsKey] = useState<string>(
    localStorage.getItem('elevenlabs_api_key') || ''
  )
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
      console.error('Voice generation failed:', error)
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
      {/* API Key Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ElevenLabs Configuration</h3>
        <ElevenLabsKeyInput 
          apiKey={elevenLabsKey} 
          onApiKeyChange={setElevenLabsKey}
        />
      </div>

      {/* Voice Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Selection</h3>
        <VoiceSelector
          selectedVoice={selectedVoice}
          onVoiceSelect={setSelectedVoice}
          apiKey={elevenLabsKey}
        />
      </div>

      {/* Voice Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Voice Settings</h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            <span>{showSettings ? 'Hide' : 'Show'} Settings</span>
          </button>
        </div>

        {showSettings && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stability: {settings.stability}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.stability}
                onChange={(e) => setSettings({...settings, stability: parseFloat(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>More Variable</span>
                <span>More Stable</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Similarity Boost: {settings.similarity_boost}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.similarity_boost}
                onChange={(e) => setSettings({...settings, similarity_boost: parseFloat(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low Similarity</span>
                <span>High Similarity</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style: {settings.style}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.style}
                onChange={(e) => setSettings({...settings, style: parseFloat(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Natural</span>
                <span>Expressive</span>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.use_speaker_boost}
                onChange={(e) => setSettings({...settings, use_speaker_boost: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Use Speaker Boost (improves similarity for longer texts)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Generation Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generate Voice</h3>
          <div className="text-sm text-gray-500">
            {wordCount} words • ~${estimatedCost.toFixed(2)} estimated cost
          </div>
        </div>

        <div className="mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preview Text (first 200 characters):</h4>
            <p className="text-sm text-gray-700">
              {getEditedTranscript().substring(0, 200)}
              {getEditedTranscript().length > 200 && '...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={generateVoice}
            disabled={isGenerating || !elevenLabsKey || !selectedVoice}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating... {Math.round(progress * 100)}%</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                <span>Generate Voice</span>
              </>
            )}
          </button>

          {generatedAudio && (
            <>
              <button
                onClick={togglePlayback}
                className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={downloadAudio}
                className="flex items-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span>Download</span>
              </button>
            </>
          )}
        </div>
      </div>

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