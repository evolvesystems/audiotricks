import React from 'react'
import { useAudioPlayer } from './AudioPlayer/useAudioPlayer'
import { useSubtitles } from './AudioPlayer/useSubtitles'
import AudioControls from './AudioPlayer/AudioControls'
import ProgressBar from './AudioPlayer/ProgressBar'
import AudioWaveform from './AudioWaveform'
import { formatTime } from './AudioPlayer/utils'

interface AudioPlayerProps {
  audioUrl?: string
  audioFile?: File
  title?: string
  transcript?: any
  showSubtitles?: boolean
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  audioFile, 
  title, 
  transcript, 
  showSubtitles = false 
}) => {
  const {
    audioRef,
    audioSrc,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlayPause,
    handleVolumeChange,
    toggleMute,
    skip,
    seek
  } = useAudioPlayer({ audioUrl, audioFile })

  const {
    showSubtitlePanel,
    setShowSubtitlePanel,
    currentSubtitle
  } = useSubtitles({ 
    transcript: transcript?.text, 
    currentTime, 
    duration, 
    showSubtitles 
  })

  if (!audioSrc) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
        No audio source available
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Title */}
      {title && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}

      {/* Main Player */}
      <div className="p-6 space-y-6">
        {/* Waveform Visualization */}
        <div className="h-24 bg-gray-100 rounded-lg overflow-hidden">
          <AudioWaveform
            audioUrl={audioSrc}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
          />
        </div>

        {/* Progress Bar */}
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          formatTime={formatTime}
        />

        {/* Controls */}
        <AudioControls
          isPlaying={isPlaying}
          volume={volume}
          isMuted={isMuted}
          onTogglePlayPause={togglePlayPause}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onSkip={skip}
        />

        {/* Subtitle Toggle */}
        {transcript && (
          <div className="flex items-center justify-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSubtitlePanel}
                onChange={(e) => setShowSubtitlePanel(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show subtitles</span>
            </label>
          </div>
        )}
      </div>

      {/* Subtitle Panel */}
      {showSubtitlePanel && currentSubtitle && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="text-center">
            <p className="text-lg text-gray-800">{currentSubtitle}</p>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
      />
    </div>
  )
}

export default AudioPlayer