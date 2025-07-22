/**
 * Stub Usage Tracking Service for compilation
 * Implementation needed but not present in current codebase
 */
export class UsageTrackingService {
  async enforceQuota(workspaceId: string, quotaType: string, amount: number): Promise<{ allowed: boolean; reason?: string; suggestion?: string }> {
    // Default to allowing all requests for now
    return { allowed: true };
  }
}