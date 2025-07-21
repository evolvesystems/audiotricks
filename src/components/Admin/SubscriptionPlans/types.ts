export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName?: string;
  tier: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  
  // Basic Limits
  maxApiCalls: number;
  maxStorageMb: number;
  maxProcessingMin: number;
  maxFileSize: number;
  
  // Transcription Limits  
  maxTranscriptionsMonthly: number;
  maxFilesDaily: number;
  maxFilesMonthly: number;
  maxAudioDurationMinutes: number;
  maxConcurrentJobs: number;
  maxVoiceSynthesisMonthly: number;
  maxExportOperationsMonthly: number;
  
  // Team Features
  maxWorkspaces: number;
  maxUsers: number;
  
  // Other
  priorityLevel: number;
  features: string[];
  collaborationFeatures: string[];
  isActive: boolean;
  isPublic: boolean;
  planCategory: string;
}

export interface PlanFormData {
  name: string;
  displayName: string;
  tier: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  maxApiCalls: number;
  maxStorageMb: number;
  maxProcessingMin: number;
  maxFileSize: number;
  maxTranscriptionsMonthly: number;
  maxFilesDaily: number;
  maxFilesMonthly: number;
  maxAudioDurationMinutes: number;
  maxConcurrentJobs: number;
  maxVoiceSynthesisMonthly: number;
  maxExportOperationsMonthly: number;
  maxWorkspaces: number;
  maxUsers: number;
  priorityLevel: number;
  features: string[];
  collaborationFeatures: string[];
  isActive: boolean;
  isPublic: boolean;
  planCategory: string;
}

export const initialFormData: PlanFormData = {
  name: '',
  displayName: '',
  tier: 'personal', 
  description: '',
  price: 0,
  currency: 'AUD',
  billingInterval: 'monthly',
  maxApiCalls: 1000,
  maxStorageMb: 1024,
  maxProcessingMin: 60,
  maxFileSize: 157286400, // 150MB
  maxTranscriptionsMonthly: 50,
  maxFilesDaily: 10,
  maxFilesMonthly: 100,
  maxAudioDurationMinutes: 120,
  maxConcurrentJobs: 1,
  maxVoiceSynthesisMonthly: 10,
  maxExportOperationsMonthly: 50,
  maxWorkspaces: 1,
  maxUsers: 1,
  priorityLevel: 5,
  features: [],
  collaborationFeatures: [],
  isActive: true,
  isPublic: true,
  planCategory: 'personal'
};