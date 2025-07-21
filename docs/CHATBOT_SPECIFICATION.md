# Chatbot System Specification

## Overview
The My Most Trusted (MMT) platform chatbot is a sophisticated AI assistant designed to help users navigate their professional network through search, recommendations, and platform guidance. It combines multiple technologies for speech recognition, text-to-speech, and intelligent conversation management.

## Core Architecture

### 1. Component Structure
```
src/components/
├── ChatButton.tsx          # Floating chat button with responsive design
├── Chatbot.tsx            # Main chatbot interface component
├── ElevenLabsAudio.tsx    # Audio settings configuration
├── LocalSpeechRecognition.tsx # Local speech recognition fallback
└── OpenAISpeechRecognition.tsx # Primary speech recognition service
```

### 2. Utilities & Types
```
src/utils/
└── chatbot.ts             # Core chatbot logic and response generation

src/types/
└── chat.ts               # TypeScript interfaces for chat system
```

## Technical Specifications

### Chat Message Interface
```typescript
interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  searchResults?: any[];      // Network search results
  recommendations?: any[];    // Introduction recommendations
}
```

### Key Features

#### 1. Multi-Modal Input Support
- **Text Input**: Standard text input with Enter key support
- **Voice Input**: Multiple speech recognition options:
  - Primary: OpenAI Whisper API (cloud-based, high accuracy)
  - Fallback: Browser SpeechRecognition API
  - Local: Hugging Face Transformers (offline capability)

#### 2. Audio Output (Text-to-Speech)
- **Primary**: ElevenLabs API with configurable voices and models
- **Fallback**: Browser speechSynthesis API
- **Voice Options**: 6 professional voices (Sarah, Roger, Aria, George, Charlotte, Liam)
- **Models**: Turbo v2.5, Multilingual v2, Turbo v2

#### 3. Intelligent Response System
The chatbot handles four main interaction types:

##### Search Queries
- **Keywords**: "find", "search", "look for", "show me", "who do i know"
- **Output**: Network search results with user profile cards
- **Integration**: Uses `executeSearch()` from search engine

##### Recommendation Requests  
- **Keywords**: "recommend", "introduction", "suggest", "who should i introduce"
- **Output**: AI-generated introduction recommendations
- **Integration**: Uses `generateRecommendations()` from search engine

##### Platform Help
- **Keywords**: "how do", "platform", "features", "help", "MMT", "Trust-O-Meter"
- **Output**: Detailed explanations of platform features and usage

##### General Conversation
- **Fallback**: Friendly responses guiding users to available features

### 4. Multilingual Support
- **Languages**: English (en) and Japanese (ja)
- **Dynamic**: Language-specific keywords and responses
- **Context-Aware**: Speech recognition language adapts to user preference

## Mobile-First Design

### Responsive Breakpoints
- **Small Screens**: `<640px` - Optimized layouts, hidden non-essential buttons
- **Large Screens**: `≥640px` - Full feature set, expanded layouts

### Touch-Friendly Interface
- **Minimum Touch Targets**: 44px x 44px for all interactive elements
- **Gesture Support**: `touch-manipulation` CSS for better mobile interaction
- **Dynamic Sizing**: Responsive chat window sizing with viewport constraints

### Mobile Optimizations
- **Chat Window**: `max-w-[calc(100vw-32px)]` and `max-h-[calc(100vh-32px)]`
- **Button Sizing**: Responsive scaling (`w-14 h-14 sm:w-16 sm:h-16`)
- **Content Padding**: Adaptive spacing (`p-3 sm:p-4`)
- **Text Sizing**: Progressive enhancement (`text-base` minimum)

## State Management

### Core State Variables
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [inputValue, setInputValue] = useState("");
const [isTyping, setIsTyping] = useState(false);
const [audioEnabled, setAudioEnabled] = useState(true);
const [isListening, setIsListening] = useState(false);
const [speechStatus, setSpeechStatus] = useState<'idle' | 'loading' | 'listening' | 'processing'>('idle');
```

### Audio Configuration State
```typescript
const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
const [selectedVoice, setSelectedVoice] = useState("EXAVITQu4vr4xnSDxMaL");
const [selectedModel, setSelectedModel] = useState("eleven_turbo_v2_5");
```

## Setup Requirements

### Dependencies
```json
{
  "@huggingface/transformers": "^3.6.3",
  "lucide-react": "^0.462.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2"
}
```

### Environment Configuration
- **ElevenLabs API Key**: Required for premium TTS features
- **OpenAI API Key**: Required for high-quality speech recognition
- **Browser Permissions**: Microphone access for voice input

### Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Speech Recognition**: WebKit Speech Recognition API
- **Audio**: Web Audio API support
- **Local AI**: WebGPU support preferred, CPU fallback available

## Integration Points

### Search Engine Integration
```typescript
import { executeSearch, generateRecommendations } from "./searchEngine";
```

### User Data Integration  
```typescript
import { getCurrentUser, getUserById } from "../data/mockData";
```

### Internationalization
```typescript
import { useLanguage } from "../contexts/LanguageContext";
```

## Security Considerations

### API Key Management
- **Local Storage**: API keys stored in component state (not persistent)
- **Input Masking**: Password-type inputs for sensitive data
- **No Environment Variables**: Frontend-only implementation

### Privacy
- **Audio Processing**: Local browser processing when possible
- **Data Retention**: No conversation persistence beyond session
- **Permissions**: Explicit microphone permission requests

## Performance Optimizations

### Lazy Loading
- **AI Models**: Local speech recognition models loaded on-demand
- **Audio Processing**: Chunked audio processing for large files
- **Message Rendering**: Efficient React re-rendering with proper keys

### Fallback Strategies
1. **Speech Recognition**: OpenAI → Browser API → Local AI
2. **Text-to-Speech**: ElevenLabs → Browser speechSynthesis
3. **Network**: Graceful degradation for offline scenarios

## Styling & Design System

### Design Tokens
```css
--chat-green: [HSL color value]
--chat-green-hover: [HSL color value]  
--chat-green-foreground: [HSL color value]
--shadow-elevated: [shadow definition]
```

### Component Classes
- **Semantic Tokens**: Using design system variables
- **Responsive Utilities**: Tailwind responsive prefixes
- **Animation Classes**: Smooth transitions and hover effects

## Testing Strategy

### Audio Testing Features
- **Microphone Test**: 3-second recording with playback
- **Speaker Test**: Text-to-speech verification
- **Permission Testing**: Graceful permission handling

### Error Handling
- **Speech Recognition Errors**: Specific error messages for common issues
- **Network Errors**: Fallback mechanisms with user feedback
- **API Failures**: Graceful degradation to basic functionality

## Deployment Considerations

### Build Requirements
- **Vite Configuration**: ES modules support for transformers.js
- **Bundle Size**: Tree-shaking for unused AI models
- **Asset Optimization**: Audio processing libraries

### Runtime Requirements  
- **Memory Usage**: AI model loading can be memory-intensive
- **Network**: Streaming audio for TTS features
- **Storage**: Temporary audio blob storage during processing

This specification provides the complete foundation for replicating the MMT chatbot system with all its sophisticated features, responsive design, and robust error handling.