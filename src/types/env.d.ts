/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_ACCESS_PASSWORD: string
  readonly VITE_ELEVENLABS_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}