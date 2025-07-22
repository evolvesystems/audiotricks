/**
 * Stub Audio Processor Service for compilation
 * Original implementation moved to temp-excluded directory
 */
export class AudioProcessorService {
  async processAudio(params: any): Promise<{ jobId: string }> {
    throw new Error('AudioProcessorService not implemented - service temporarily disabled');
  }

  async listJobs(userId: string, workspaceId?: string, options?: any): Promise<{ jobs: any[]; total: number }> {
    throw new Error('AudioProcessorService not implemented - service temporarily disabled');
  }
}