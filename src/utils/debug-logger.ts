/**
 * Debug Logger for Development
 * Creates rotating log files for debugging with AI assistance
 */

import { logger } from './logger';

interface DebugLogEntry {
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info';
  context: string;
  message: string;
  data?: any;
  stack?: string;
}

interface DebugLogger {
  log(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: any): void;
  getLogs(): DebugLogEntry[];
  clearLogs(): void;
  exportLogs(): string;
}

// In-memory storage for debug logs (browser environment)
const debugLogsMap = new Map<string, DebugLogEntry[]>();
const MAX_LOGS_PER_CONTEXT = 1000;

/**
 * Creates a debug logger for a specific context
 * @param context - The debugging context (e.g., 'payment-flow', 'auth', 'audio-processing')
 * @returns DebugLogger instance
 */
export function createDebugLogger(context: string): DebugLogger {
  // Initialize logs array for this context if not exists
  if (!debugLogsMap.has(context)) {
    debugLogsMap.set(context, []);
  }

  const addLog = (level: DebugLogEntry['level'], message: string, data?: any) => {
    const logs = debugLogsMap.get(context) || [];
    
    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
      stack: level === 'error' && data instanceof Error ? data.stack : undefined
    };

    logs.push(entry);

    // Rotate logs if exceeding limit
    if (logs.length > MAX_LOGS_PER_CONTEXT) {
      logs.shift(); // Remove oldest log
    }

    debugLogsMap.set(context, logs);

    // Also log to console in development
    if (import.meta.env.DEV) {
      const logMethod = level === 'error' ? logger.error : logger[level] || logger.log;
      logMethod(`[${context}] ${message}`, data);
    }
  };

  return {
    log: (message: string, data?: any) => addLog('log', message, data),
    info: (message: string, data?: any) => addLog('info', message, data),
    warn: (message: string, data?: any) => addLog('warn', message, data),
    error: (message: string, error?: any) => addLog('error', message, error),
    
    getLogs: () => debugLogsMap.get(context) || [],
    
    clearLogs: () => debugLogsMap.set(context, []),
    
    exportLogs: () => {
      const logs = debugLogsMap.get(context) || [];
      return JSON.stringify(logs, null, 2);
    }
  };
}

/**
 * Get all debug logs across all contexts
 */
export function getAllDebugLogs(): Record<string, DebugLogEntry[]> {
  const allLogs: Record<string, DebugLogEntry[]> = {};
  
  debugLogsMap.forEach((logs, context) => {
    allLogs[context] = logs;
  });
  
  return allLogs;
}

/**
 * Export all debug logs as formatted string
 */
export function exportAllDebugLogs(): string {
  const allLogs = getAllDebugLogs();
  let output = '=== DEBUG LOGS EXPORT ===\n';
  output += `Generated at: ${new Date().toISOString()}\n\n`;
  
  Object.entries(allLogs).forEach(([context, logs]) => {
    output += `\n--- Context: ${context} ---\n`;
    logs.forEach(log => {
      output += `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}\n`;
      if (log.data) {
        output += `  Data: ${JSON.stringify(log.data, null, 2)}\n`;
      }
      if (log.stack) {
        output += `  Stack: ${log.stack}\n`;
      }
    });
  });
  
  return output;
}

/**
 * Clear all debug logs
 */
export function clearAllDebugLogs(): void {
  debugLogsMap.clear();
}

// Expose debug functions on window in development for easy access
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__debugLogs = {
    getAll: getAllDebugLogs,
    exportAll: exportAllDebugLogs,
    clearAll: clearAllDebugLogs,
    contexts: () => Array.from(debugLogsMap.keys())
  };
}