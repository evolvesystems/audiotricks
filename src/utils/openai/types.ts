export interface GPTSettings {
  temperature?: number
  maxTokens?: number
}

export const STYLE_INSTRUCTIONS = {
  formal: 'Use a formal, technical, and analytical tone. Be precise and professional.',
  creative: 'Use a creative, friendly, and engaging tone. Make it interesting and accessible.',
  conversational: 'Use a natural, casual, and conversational tone. Write as if explaining to a friend.'
}

export const LANGUAGE_MAP: { [key: string]: string } = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese'
}

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB (OpenAI's actual limit)