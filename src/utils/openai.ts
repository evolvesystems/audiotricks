// Re-export all OpenAI functionality from the modular structure
export { 
  processAudioWithOpenAI, 
  processAudioFromUrl, 
  generateSummary,
  transcribeAudio,
  type GPTSettings 
} from './openai/index'