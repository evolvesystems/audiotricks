import { ApiKeyInfo, ApiKeyUsageStats } from '../../services/api';

export interface KeyState {
  [provider: string]: {
    info: ApiKeyInfo | null;
    loading: boolean;
    editing: boolean;
    testing: boolean;
    usage: ApiKeyUsageStats | null;
    showUsage: boolean;
  };
}

export interface ApiKeyManagerProps {
  onKeysUpdated?: () => void;
}

export const PROVIDERS = ['openai', 'elevenlabs'] as const;
export type Provider = typeof PROVIDERS[number];