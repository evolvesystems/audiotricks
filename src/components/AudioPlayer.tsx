import React, { useState, useRef, useEffect } from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon
} from '@heroicons/react/24/solid'
import AudioWaveform from './AudioWaveform'

interface AudioPlayerProps {
  audioUrl?: string
  audioFile?: File
  title?: string
  transcript?: string
  showSubtitles?: boolean
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, audioFile, title, transcript, showSubtitles = false }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string>('')
  const [showSubtitlePanel, setShowSubtitlePanel] = useState(showSubtitles)
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('')
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set up audio source
    if (audioUrl) {
      setAudioSrc(audioUrl)
    } else if (audioFile) {
      const url = URL.createObjectURL(audioFile)
      setAudioSrc(url)
      
      // Clean up object URL on unmount
      return () => URL.revokeObjectURL(url)
    }
  }, [audioUrl, audioFile])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', () => setIsPlaying(false))

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', () => setIsPlaying(false))
    }
  }, [audioSrc])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const progress = progressRef.current
    if (!audio || !progress) return

    const rect = progress.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleWaveformSeek = (seekTime: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Extract subtitle for current time
  const getSubtitleForTime = (time: number): string => {
    if (!transcript || !showSubtitlePanel) return ''
    
    // Simple subtitle extraction - split transcript into sentences
    // and estimate timing based on duration
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim())
    if (sentences.length === 0) return ''
    
    const timePerSentence = duration / sentences.length
    const currentSentenceIndex = Math.floor(time / timePerSentence)
    
    if (currentSentenceIndex < sentences.length) {
      return sentences[currentSentenceIndex].trim()
    }
    
    return ''
  }

  // Update subtitle when time changes
  useEffect(() => {
    if (transcript && showSubtitlePanel) {
      const subtitle = getSubtitleForTime(currentTime)
      setCurrentSubtitle(subtitle)
    }
  }, [currentTime, transcript, showSubtitlePanel, duration])

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!audioSrc) return null

  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <audio ref={audioRef} src={audioSrc} />
      
      {title && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        </div>
      )}

      {/* Waveform Visualization */}
      <div className="mb-4">
        <AudioWaveform
          audioUrl={audioUrl}
          audioFile={audioFile}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleWaveformSeek}
          height={80}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Skip Backward */}
          <button
            onClick={() => skip(-10)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Skip back 10s"
          >
            <BackwardIcon className="h-5 w-5 text-gray-700" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <PauseIcon className="h-6 w-6" />
            ) : (
              <PlayIcon className="h-6 w-6" />
            )}
          </button>

          {/* Skip Forward */}
          <button
            onClick={() => skip(10)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Skip forward 10s"
          >
            <ForwardIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <SpeakerXMarkIcon className="h-5 w-5 text-gray-700" />
            ) : (
              <SpeakerWaveIcon className="h-5 w-5 text-gray-700" />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-32 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer volume-slider"
            title="Volume"
          />
        </div>

        {/* Subtitle Toggle */}
        {transcript && (
          <button
            onClick={() => setShowSubtitlePanel(!showSubtitlePanel)}
            className={`ml-2 px-3 py-1 text-xs rounded-md transition-colors ${
              showSubtitlePanel 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Toggle Subtitles"
          >
            CC
          </button>
        )}
      </div>

      {/* Subtitle Panel */}
      {showSubtitlePanel && transcript && (
        <div className="mt-4 p-3 bg-black rounded-lg text-white text-center min-h-[60px] flex items-center justify-center">
          <p className="text-sm leading-relaxed">
            {currentSubtitle || 'Subtitles will appear here during playback...'}
          </p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .volume-slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #2563eb;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .volume-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #2563eb;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        `
      }} />
    </div>
  )
}

export default AudioPlayer