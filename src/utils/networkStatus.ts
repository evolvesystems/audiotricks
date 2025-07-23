// Network status monitoring utility
import { logger } from './logger';

export class NetworkStatus {
  private static instance: NetworkStatus;
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(online: boolean) => void> = new Set();

  private constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  static getInstance(): NetworkStatus {
    if (!NetworkStatus.instance) {
      NetworkStatus.instance = new NetworkStatus();
    }
    return NetworkStatus.instance;
  }

  private handleOnline = () => {
    logger.info('Network status: online');
    this.isOnline = true;
    this.notifyListeners();
  };

  private handleOffline = () => {
    logger.warn('Network status: offline');
    this.isOnline = false;
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  subscribe(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  async checkConnectivity(url: string = '/api/health'): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      logger.warn('Connectivity check failed:', error);
      return false;
    }
  }
}

export const networkStatus = NetworkStatus.getInstance();