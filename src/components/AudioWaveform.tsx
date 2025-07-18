import React, { useRef, useEffect, useState } from 'react'

interface AudioWaveformProps {
  audioUrl?: string
  audioFile?: File
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  height?: number
  className?: string
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioUrl,
  audioFile,
  currentTime,
  duration,
  onSeek,
  height = 80,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!audioUrl && !audioFile) return

    const loadAudioData = async () => {
      try {
        setIsLoading(true)
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        let arrayBuffer: ArrayBuffer
        if (audioFile) {
          arrayBuffer = await audioFile.arrayBuffer()
        } else if (audioUrl) {
          const response = await fetch(audioUrl)
          arrayBuffer = await response.arrayBuffer()
        } else {
          return
        }

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const rawData = audioBuffer.getChannelData(0) // Get first channel
        
        // Downsample to create waveform data (500 points for visualization)
        const samples = 500
        const blockSize = Math.floor(rawData.length / samples)
        const filteredData = []
        
        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j])
          }
          filteredData.push(sum / blockSize)
        }
        
        // Normalize the data
        const maxVal = Math.max(...filteredData)
        const normalizedData = filteredData.map(val => val / maxVal)
        
        setWaveformData(normalizedData)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading audio data:', error)
        setIsLoading(false)
        // Generate fake waveform data as fallback
        const fakeData = Array.from({ length: 500 }, () => Math.random() * 0.8 + 0.1)
        setWaveformData(fakeData)
      }
    }

    loadAudioData()
  }, [audioUrl, audioFile])

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const barWidth = width / waveformData.length
    const progressPosition = duration > 0 ? (currentTime / duration) * width : 0

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw waveform
    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth
      const barHeight = amplitude * height * 0.8
      const y = (height - barHeight) / 2

      // Color based on progress
      if (x < progressPosition) {
        // Played portion - blue gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, '#3b82f6')
        gradient.addColorStop(1, '#1d4ed8')
        ctx.fillStyle = gradient
      } else {
        // Unplayed portion - gray
        ctx.fillStyle = '#d1d5db'
      }

      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight)
    })

    // Draw progress line
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(progressPosition, 0)
    ctx.lineTo(progressPosition, height)
    ctx.stroke()

  }, [waveformData, currentTime, duration])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || duration === 0) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const seekTime = percentage * duration
    
    onSeek(seekTime)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <div className="text-gray-500 text-sm">Loading waveform...</div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        className="w-full h-full cursor-pointer rounded-lg bg-gray-50"
        onClick={handleClick}
        style={{ height }}
      />
      <div className="absolute bottom-1 left-2 text-xs text-gray-500">
        Click waveform to seek
      </div>
    </div>
  )
}

export default AudioWaveform