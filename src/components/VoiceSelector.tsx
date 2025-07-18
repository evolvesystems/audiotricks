import React, { useState, useEffect } from 'react'
import { 
  SpeakerWaveIcon, 
  PlayIcon, 
  PauseIcon,
  ChevronDownIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline'
import { ElevenLabsVoice, getElevenLabsVoices, POPULAR_VOICES } from '../utils/elevenlabs'

interface VoiceSelectorProps {
  selectedVoice: ElevenLabsVoice | null
  onVoiceSelect: (voice: ElevenLabsVoice) => void
  apiKey: string
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceSelect, apiKey }) => {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>(POPULAR_VOICES)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all')
  const [filterLanguage, setFilterLanguage] = useState<'all' | 'en' | 'es' | 'fr' | 'de'>('all')

  useEffect(() => {
    if (apiKey) {
      loadVoices()
    }
  }, [apiKey])

  const loadVoices = async () => {
    setIsLoading(true)
    try {
      const fetchedVoices = await getElevenLabsVoices(apiKey)
      setVoices(fetchedVoices)
    } catch (error) {
      console.error('Failed to load voices:', error)
      setVoices(POPULAR_VOICES)
    } finally {
      setIsLoading(false)
    }
  }

  const playVoicePreview = async (voice: ElevenLabsVoice) => {
    if (playingVoice === voice.voice_id) {
      setPlayingVoice(null)
      return
    }

    setPlayingVoice(voice.voice_id)
    
    try {
      // Generate a short preview with ElevenLabs
      const previewText = "Hello! This is a preview of my voice. I can help bring your transcript to life with natural-sounding speech."
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: previewText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          setPlayingVoice(null)
          URL.revokeObjectURL(audioUrl)
        }
        
        audio.play()
      } else {
        console.error('Preview generation failed')
        setPlayingVoice(null)
      }
    } catch (error) {
      console.error('Error playing voice preview:', error)
      setPlayingVoice(null)
    }
  }

  const filteredVoices = voices.filter(voice => {
    const genderMatch = filterGender === 'all' || voice.gender === filterGender
    const languageMatch = filterLanguage === 'all' || voice.language === filterLanguage
    return genderMatch && languageMatch
  })

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <div className="flex items-center space-x-3">
          <SpeakerWaveIcon className="h-5 w-5 text-gray-500" />
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {selectedVoice ? selectedVoice.name : 'Select Voice'}
            </div>
            {selectedVoice && (
              <div className="text-sm text-gray-500">
                {selectedVoice.description}
              </div>
            )}
          </div>
        </div>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Gender:</label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Language:</label>
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
            
            {!apiKey && (
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ ElevenLabs API key required for voice previews
              </div>
            )}
          </div>

          {/* Voice List */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading voices...
              </div>
            ) : (
              <>
                {filteredVoices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className={`p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer ${
                      selectedVoice?.voice_id === voice.voice_id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      onVoiceSelect(voice)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <MicrophoneIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{voice.name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            voice.gender === 'male' 
                              ? 'bg-blue-100 text-blue-800' 
                              : voice.gender === 'female'
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {voice.gender}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {voice.description}
                        </div>
                      </div>
                      
                      {apiKey && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            playVoicePreview(voice)
                          }}
                          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          title="Play Preview"
                        >
                          {playingVoice === voice.voice_id ? (
                            <PauseIcon className="h-4 w-4 text-gray-600" />
                          ) : (
                            <PlayIcon className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredVoices.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No voices found matching your filters
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceSelector