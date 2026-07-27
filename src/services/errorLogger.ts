/**
 * Error Logger Service
 * Tracks and persists application errors, navigation failures, and debug information
 */

export interface ErrorLog {
  id: string;
  timestamp: string;
  type: 'navigation' | 'ai' | 'analytics' | 'sync' | 'validation' | 'general';
  severity: 'error' | 'warning' | 'info';
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
  userAction?: string;
  view?: string;
}

const LOG_STORAGE_KEY = 'app_error_logs';
const MAX_LOGS = 100; // Mantieni ultimi 100 errori
const LOG_RETENTION_DAYS = 7;

class ErrorLoggerService {
  /**
   * Log an error event
   */
  logError(
    message: string,
    type: ErrorLog['type'] = 'general',
    severity: ErrorLog['severity'] = 'error',
    context?: Record<string, unknown>,
    stack?: string,
    userAction?: string,
    view?: string
  ): void {
    try {
      const errorLog: ErrorLog = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type,
        severity,
        message,
        context,
        stack,
        userAction,
        view,
      };

      // Add to localStorage
      this.addLogToStorage(errorLog);

      // Console log for development with appropriate severity
      const logMessage = `[${type.toUpperCase()}] ${message}`;
      const logData = {
        severity,
        context,
        stack,
        userAction,
        view,
      };

      if (severity === 'error') {
        console.error(logMessage, logData);
      } else if (severity === 'warning') {
        console.warn(logMessage, logData);
      } else {
        console.info(logMessage, logData);
      }
    } catch (err) {
      // Silent fail to prevent infinite loops
      console.error('Failed to log error:', err);
    }
  }

  /**
   * Log a navigation error
   */
  logNavigationError(targetView: string, error: Error, fromView?: string): void {
    this.logError(
      `Navigation failed to "${targetView}": ${error?.message || String(error)}`,
      'navigation',
      'error',
      { targetView, fromView },
      error?.stack,
      'navigate',
      fromView
    );
  }

  /**
   * Log an AI interaction error
   */
  logAiError(feature: string, error: unknown, context?: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.logError(
      `AI error in ${feature}: ${errorMessage}`,
      'ai',
      'error',
      { feature, ...context },
      errorStack,
      `ai_${feature}`
    );
  }

  /**
   * Log a warning
   */
  logWarning(message: string, type: ErrorLog['type'] = 'general', context?: Record<string, unknown>): void {
    this.logError(message, type, 'warning', context);
  }

  /**
   * Log an info event
   */
  logInfo(message: string, type: ErrorLog['type'] = 'general', context?: Record<string, unknown>): void {
    this.logError(message, type, 'info', context);
  }

  /**
   * Get all stored logs
   */
  getAllLogs(): ErrorLog[] {
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY);
      if (!stored) return [];

      const logs = JSON.parse(stored) as ErrorLog[];
      return this.filterByRetention(logs);
    } catch (err) {
      console.error('Failed to retrieve logs:', err);
      return [];
    }
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: ErrorLog['type']): ErrorLog[] {
    return this.getAllLogs().filter((log) => log.type === type);
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: ErrorLog['severity']): ErrorLog[] {
    return this.getAllLogs().filter((log) => log.severity === severity);
  }

  /**
   * Get recent error logs (for dashboard)
   */
  getRecentErrors(count: number = 20): ErrorLog[] {
    return this.getAllLogs().reverse().slice(0, count);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    mostRecent?: ErrorLog;
  } {
    const logs = this.getAllLogs();

    return {
      total: logs.length,
      byType: logs.reduce((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: logs.reduce((acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      mostRecent: logs[logs.length - 1],
    };
  }

  /**
   * Clear all logs
   */
  clearAllLogs(): void {
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
      console.info('All error logs cleared');
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogsAsJson(): string {
    try {
      const logs = this.getAllLogs();
      return JSON.stringify(logs, null, 2);
    } catch (err) {
      console.error('Failed to export logs:', err);
      return '{}';
    }
  }

  /**
   * Private: Add log to storage
   */
  private addLogToStorage(errorLog: ErrorLog): void {
    try {
      let logs = this.getAllLogs();

      // Add new log
      logs.push(errorLog);

      // Keep only recent logs
      if (logs.length > MAX_LOGS) {
        logs = logs.slice(-MAX_LOGS);
      }

      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to store error log:', err);
    }
  }

  /**
   * Private: Filter logs by retention period
   */
  private filterByRetention(logs: ErrorLog[]): ErrorLog[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);

    return logs.filter((log) => {
      try {
        return new Date(log.timestamp) >= cutoffDate;
      } catch {
        return false;
      }
    });
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggerService();

// Also expose for window debugging
if (typeof window !== 'undefined') {
  (globalThis as typeof globalThis & { __errorLogger: typeof errorLogger }).__errorLogger = errorLogger;
}

