/**
 * Types and interfaces for usage tracking system
 */

export interface UsageQuota {
  storageBytes: bigint;
  processingMinutes: number;
  apiCalls: number;
  transcriptionMinutes: number;
  aiTokens: number;
}

export interface CurrentUsage {
  storageBytes: bigint;
  processingMinutes: number;
  apiCalls: number;
  transcriptionMinutes: number;
  aiTokens: number;
  percentUsed: {
    storage: number;
    processing: number;
    apiCalls: number;
    transcription: number;
    aiTokens: number;
  };
}

export interface UsageReport {
  period: string;
  startDate: Date;
  endDate: Date;
  usage: CurrentUsage;
  quota: UsageQuota;
  costs: {
    storage: number;
    processing: number;
    apiCalls: number;
    total: number;
  };
}

export interface QuotaCheckResult {
  exceeded: boolean;
  current: number;
  limit: number;
  percentUsed: number;
}

export interface QuotaEnforcementResult {
  allowed: boolean;
  reason?: string;
  suggestion?: string;
}

export type ResourceType = 
  | 'storage' 
  | 'processing' 
  | 'apiCalls' 
  | 'transcription' 
  | 'aiTokens';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface UsageCosts {
  storage: number;
  processing: number;
  apiCalls: number;
  total: number;
}

export interface UsageTrackingData {
  workspaceId: string;
  resourceType: string;
  amount: number;
  metadata?: Record<string, any>;
}

export interface UsageAggregation {
  storageBytes: bigint;
  processingMinutes: number;
  apiCalls: number;
  transcriptionMinutes: number;
  aiTokens: number;
}

export interface QuotaWarning {
  workspaceId: string;
  resourceType: ResourceType;
  percentUsed: number;
  current: number;
  limit: number;
}