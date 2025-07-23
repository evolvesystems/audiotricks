// Health check utility for API status
import { apiClient } from '../services/api';
import { logger } from './logger';

export interface HealthStatus {
  api: boolean;
  database: boolean;
  storage: boolean;
  timestamp: number;
}

export class HealthChecker {
  private static instance: HealthChecker;
  private lastCheck: HealthStatus | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      // Try a simple API call to check if backend is responding
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });

      const status: HealthStatus = {
        api: response.ok,
        database: response.ok, // Simplified - real backend would check DB
        storage: response.ok,  // Simplified - real backend would check storage
        timestamp: Date.now()
      };

      this.lastCheck = status;
      return status;
    } catch (error) {
      logger.warn('Health check failed:', error);
      const status: HealthStatus = {
        api: false,
        database: false,
        storage: false,
        timestamp: Date.now()
      };

      this.lastCheck = status;
      return status;
    }
  }

  getLastCheck(): HealthStatus | null {
    return this.lastCheck;
  }

  startPeriodicCheck(intervalMs: number = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }

  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  isHealthy(): boolean {
    if (!this.lastCheck) {
      return true; // Assume healthy until proven otherwise
    }

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return this.lastCheck.api && this.lastCheck.timestamp > fiveMinutesAgo;
  }
}

export const healthChecker = HealthChecker.getInstance();