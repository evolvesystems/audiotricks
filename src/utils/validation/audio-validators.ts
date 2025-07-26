/**
 * Audio-specific Validation Rules
 * Validators for audio processing workflows
 */

import { ValidationRule, rules, patterns, ValidationSchema } from './index';
import { createDebugLogger } from '../debug-logger';

const debug = createDebugLogger('audio-validation');

/**
 * Audio file validation
 */
export const audioFileRules: ValidationRule[] = [
  {
    validate: (file: File) => file instanceof File,
    message: 'Invalid file object'
  },
  {
    validate: (file: File) => {
      const validTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/mp4',
        'audio/x-m4a',
        'audio/flac',
        'audio/ogg',
        'audio/webm',
        'audio/opus'
      ];
      return validTypes.includes(file.type);
    },
    message: 'Invalid audio file type. Supported: MP3, WAV, M4A, FLAC, OGG, OPUS'
  },
  {
    validate: (file: File) => file.size <= 100 * 1024 * 1024, // 100MB
    message: 'File size must be less than 100MB'
  },
  {
    validate: (file: File) => file.size > 0,
    message: 'File is empty'
  }
];

/**
 * API key validation schemas
 */
export const apiKeySchemas = {
  openai: {
    apiKey: [
      rules.required('OpenAI API key is required'),
      rules.pattern(/^sk-[a-zA-Z0-9]{48,}$/, 'Invalid OpenAI API key format')
    ]
  },
  
  elevenlabs: {
    apiKey: [
      rules.required('ElevenLabs API key is required'),
      rules.minLength(32, 'Invalid ElevenLabs API key')
    ]
  }
};

/**
 * Audio processing settings validation
 */
export const audioSettingsSchema: ValidationSchema = {
  summaryStyle: [
    rules.required('Summary style is required'),
    rules.oneOf(['formal', 'casual', 'technical', 'creative'], 'Invalid summary style')
  ],
  
  outputLanguage: [
    rules.required('Output language is required'),
    rules.pattern(/^[a-z]{2}$/, 'Language code must be 2 lowercase letters')
  ],
  
  temperature: [
    rules.required('Temperature is required'),
    rules.numeric('Temperature must be a number'),
    rules.inRange(0, 2, 'Temperature must be between 0 and 2')
  ],
  
  maxTokens: [
    rules.required('Max tokens is required'),
    rules.numeric('Max tokens must be a number'),
    rules.min(100, 'Max tokens must be at least 100'),
    rules.max(4000, 'Max tokens cannot exceed 4000')
  ]
};

/**
 * Voice synthesis settings validation
 */
export const voiceSynthesisSchema: ValidationSchema = {
  voiceId: [
    rules.required('Voice ID is required'),
    rules.pattern(/^[a-zA-Z0-9_-]+$/, 'Invalid voice ID format')
  ],
  
  stability: [
    rules.required('Stability is required'),
    rules.numeric('Stability must be a number'),
    rules.inRange(0, 1, 'Stability must be between 0 and 1')
  ],
  
  similarityBoost: [
    rules.required('Similarity boost is required'),
    rules.numeric('Similarity boost must be a number'),
    rules.inRange(0, 1, 'Similarity boost must be between 0 and 1')
  ],
  
  style: [
    rules.numeric('Style must be a number'),
    rules.inRange(0, 1, 'Style must be between 0 and 1')
  ],
  
  useSpeakerBoost: [
    {
      validate: (value) => typeof value === 'boolean',
      message: 'Speaker boost must be a boolean'
    }
  ]
};

/**
 * Validate audio URL
 */
export function validateAudioUrl(url: string): ValidationRule[] {
  return [
    rules.required('Audio URL is required'),
    rules.url('Invalid URL format'),
    {
      validate: (url: string) => {
        try {
          const parsed = new URL(url);
          const validExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.opus', '.webm'];
          return validExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext));
        } catch {
          return false;
        }
      },
      message: 'URL must point to a valid audio file'
    }
  ];
}

/**
 * Validate transcript text
 */
export const transcriptRules: ValidationRule[] = [
  rules.required('Transcript text is required'),
  rules.minLength(10, 'Transcript is too short'),
  rules.maxLength(1000000, 'Transcript exceeds maximum length'),
  {
    validate: (text: string) => {
      // Check for potential injection attempts
      const dangerousPatterns = [
        /<script/i,
        /<iframe/i,
        /javascript:/i,
        /on\w+\s*=/i
      ];
      return !dangerousPatterns.some(pattern => pattern.test(text));
    },
    message: 'Transcript contains potentially dangerous content'
  }
];

/**
 * Validate audio processing request
 */
export const audioProcessingRequestSchema: ValidationSchema = {
  audioFile: audioFileRules,
  
  apiKey: [
    rules.required('API key is required'),
    rules.minLength(20, 'Invalid API key')
  ],
  
  settings: [
    rules.required('Processing settings are required'),
    {
      validate: (settings) => typeof settings === 'object' && settings !== null,
      message: 'Settings must be an object'
    }
  ]
};

/**
 * Validate speaker detection settings
 */
export const speakerDetectionSchema: ValidationSchema = {
  enableSpeakerDetection: [
    {
      validate: (value) => typeof value === 'boolean',
      message: 'Speaker detection must be a boolean'
    }
  ],
  
  maxSpeakers: [
    rules.numeric('Max speakers must be a number'),
    rules.inRange(1, 10, 'Max speakers must be between 1 and 10')
  ],
  
  minSpeakerDuration: [
    rules.numeric('Min speaker duration must be a number'),
    rules.min(0.5, 'Min speaker duration must be at least 0.5 seconds')
  ]
};