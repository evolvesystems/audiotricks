import React, { useState, useEffect } from 'react'
import { ScissorsIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline'
import { AudioProcessingResponse } from '../types'
import VoiceSynthesis from './VoiceSynthesis'
import APIErrorBoundary from './APIErrorBoundary'
import { useAudioControls } from './AudioEditor/useAudioControls'
import { useWordSelection } from './AudioEditor/useWordSelection'
import { useTranscriptParsing } from './AudioEditor/useTranscriptParsing'
import AudioControls from './AudioEditor/AudioControls'
import TranscriptEditor from './AudioEditor/TranscriptEditor'
import AudioEditorStats from './AudioEditor/AudioEditorStats'

interface AudioEditorProps {
  results: AudioProcessingResponse
  elevenLabsKey: string
}

const AudioEditor: React.FC<AudioEditorProps> = ({ results, elevenLabsKey }) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'synthesis'>('edit')
  const [audioSrc, setAudioSrc] = useState<string>('')
  
  // Initialize audio source
  useEffect(() => {
    if (results.audioUrl) {
      setAudioSrc(results.audioUrl)
    } else if (results.audioFile) {
      const url = URL.createObjectURL(results.audioFile)
      setAudioSrc(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [results.audioUrl, results.audioFile])

  // Custom hooks
  const { words, isLoading, setWords, getEditedWords, exportEditedTranscript } = useTranscriptParsing({
    transcriptText: results.transcript.text,
    totalDuration: results.summary.total_duration || 0
  })

  const { 
    isPlaying, 
    currentTime, 
    audioRef, 
    togglePlayPause, 
    seekToTime, 
    handleTimeUpdate, 
    handleProgressClick, 
    formatTime,
    setIsPlaying
  } = useAudioControls({
    totalDuration: results.summary.total_duration || 0,
    onTimeUpdate: (_time) => {
      // Auto-scroll handled in TranscriptEditor
    }
  })

  const seekToWord = (wordIndex: number) => {
    if (words[wordIndex]) {
      seekToTime(words[wordIndex].start)
    }
  }

  const {
    selectedWords,
    handleWordClick,
    handleWordMouseDown,
    handleWordMouseEnter,
    deleteSelectedWords,
    undoDelete,
    selectAllWords,
    selectNoneWords
  } = useWordSelection({
    words,
    onWordsUpdate: setWords,
    onSeekToWord: seekToWord
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading audio editor...</div>
      </div>
    )
  }

  // Check if we have audio source
  if (!audioSrc) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <ScissorsIcon className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Audio Editor Not Available</h3>
              <p className="text-yellow-700 mt-1">
                The audio editor requires the original audio file. This feature is only available for newly processed audio, not for items from history.
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                To use the audio editor, please upload and process a new audio file.
              </p>
            </div>
          </div>
        </div>
        
        {/* Still show the transcript as read-only */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Read-Only Transcript</h4>
          <div className="prose prose-lg max-w-none leading-relaxed bg-gray-50 p-4 rounded-lg">
            {results.transcript.text}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Audio Editor</h3>
          <div className="text-sm text-gray-500">
            {formatTime(currentTime)} / {formatTime(results.summary.total_duration || 0)}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'edit' 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ScissorsIcon className="h-5 w-5" />
            <span>Edit Transcript</span>
          </button>
          
          <button
            onClick={() => setActiveTab('synthesis')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'synthesis' 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SpeakerWaveIcon className="h-5 w-5" />
            <span>Voice Synthesis</span>
          </button>
        </div>
      </div>

      {activeTab === 'edit' ? (
        <>
          <audio
            ref={audioRef}
            src={audioSrc}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />

          <AudioControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            totalDuration={results.summary.total_duration || 0}
            selectedWordsCount={selectedWords.size}
            onTogglePlayPause={togglePlayPause}
            onDeleteSelected={deleteSelectedWords}
            onUndoDelete={undoDelete}
            onSelectAll={selectAllWords}
            onSelectNone={selectNoneWords}
            onExportTranscript={exportEditedTranscript}
            onProgressClick={handleProgressClick}
            formatTime={formatTime}
          />

          <TranscriptEditor
            words={words}
            currentTime={currentTime}
            selectedWords={selectedWords}
            onWordClick={handleWordClick}
            onWordMouseDown={handleWordMouseDown}
            onWordMouseEnter={handleWordMouseEnter}
            formatTime={formatTime}
          />

          <AudioEditorStats
            words={words}
            selectedWordsCount={selectedWords.size}
          />
        </>
      ) : (
        <APIErrorBoundary apiProvider="elevenlabs">
          <VoiceSynthesis 
            results={results} 
            editedWords={getEditedWords()}
            elevenLabsKey={elevenLabsKey}
          />
        </APIErrorBoundary>
      )}
    </div>
  )
}

export default AudioEditor