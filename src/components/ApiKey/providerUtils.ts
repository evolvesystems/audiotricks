/**
 * Provider utilities - Helper functions for API provider information
 */

export const getProviderName = (provider: string): string => {
  switch (provider) {
    case 'openai': return 'OpenAI';
    case 'elevenlabs': return 'ElevenLabs';
    default: return provider;
  }
};

export const getProviderDescription = (provider: string): string => {
  switch (provider) {
    case 'openai': return 'Used for audio transcription and text analysis';
    case 'elevenlabs': return 'Used for voice synthesis and audio generation';
    default: return 'API key for external service';
  }
};

export const getProviderUrl = (provider: string): string => {
  switch (provider) {
    case 'openai': return 'https://platform.openai.com/api-keys';
    case 'elevenlabs': return 'https://elevenlabs.io/app/settings/api';
    default: return '#';
  }
};