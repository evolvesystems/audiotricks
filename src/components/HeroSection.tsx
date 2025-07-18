import React from 'react'
import { MicrophoneIcon, SparklesIcon, LanguageIcon, SpeakerWaveIcon, ScissorsIcon, ArrowRightIcon, CloudArrowUpIcon, PlayIcon } from '@heroicons/react/24/outline'

interface HeroSectionProps {
  onGetStarted: () => void
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-white bg-opacity-5 bg-repeat" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8">
            <SparklesIcon className="h-4 w-4 mr-2" />
            Powered by OpenAI Whisper & GPT-4
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight">
            Transform Audio into
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Actionable Insights
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Upload any audio file and get accurate transcripts, AI-powered summaries, and key moments. 
            Then edit with precision, create audio clips, and generate natural speech from your text.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <CloudArrowUpIcon className="h-6 w-6 mr-3 group-hover:text-blue-600 transition-colors" />
              Start Processing Audio
              <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="inline-flex items-center px-6 py-3 border-2 border-white text-white text-lg font-medium rounded-full hover:bg-white hover:text-gray-900 transition-all duration-300">
              <PlayIcon className="h-5 w-5 mr-2" />
              Watch Demo
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">99.5%</div>
            <div className="text-blue-100">Transcription Accuracy</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">100+</div>
            <div className="text-blue-100">Languages Supported</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">10x</div>
            <div className="text-blue-100">Faster Than Manual</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection