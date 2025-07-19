import React from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon
} from '@heroicons/react/24/solid'

interface AudioControlsProps {
  isPlaying: boolean
  volume: number
  isMuted: boolean
  onTogglePlayPause: () => void
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onSkip: (seconds: number) => void
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  volume,
  isMuted,
  onTogglePlayPause,
  onVolumeChange,
  onToggleMute,
  onSkip
}) => {
  return (
    <div className="flex items-center justify-between">
      {/* Playback Controls */}
      <div className="flex items-center space-x-2">
        {/* Skip Backward */}
        <button
          onClick={() => onSkip(-10)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Skip back 10s"
        >
          <BackwardIcon className="h-5 w-5 text-gray-700" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlayPause}
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
          onClick={() => onSkip(10)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Skip forward 10s"
        >
          <ForwardIcon className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Volume Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleMute}
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
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-24"
          title="Volume"
        />
      </div>
    </div>
  )
}

export default AudioControls