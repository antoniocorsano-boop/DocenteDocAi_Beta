import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorLogger, ErrorLog } from '../../src/services/errorLogger';

describe('ErrorLoggerService', () => {
  const LOG_STORAGE_KEY = 'app_error_logs';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logError', () => {
    it('should log an error and store it in localStorage', () => {
      errorLogger.logError('Test error message', 'general', 'error');

      const storedLogs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
      expect(storedLogs).toHaveLength(1);
      expect(storedLogs[0].message).toBe('Test error message');
      expect(storedLogs[0].severity).toBe('error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[GENERAL] Test error message'), expect.any(Object));
    });

    it('should log a warning', () => {
      errorLogger.logError('Test warning message', 'validation', 'warning');

      const storedLogs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
      expect(storedLogs[0].severity).toBe('warning');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[VALIDATION] Test warning message'), expect.any(Object));
    });

    it('should log an info message', () => {
      errorLogger.logError('Test info message', 'analytics', 'info');

      const storedLogs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
      expect(storedLogs[0].severity).toBe('info');
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('[ANALYTICS] Test info message'), expect.any(Object));
    });

    it('should log an error with an Error object as context', () => {
      const error = new Error('Original error');
      error.stack = 'test stack';
      // Signature: message, type, severity, context, stack, userAction, view
      errorLogger.logError('Test error message', 'general', 'error', { err: error }, error.stack);

      const storedLogs = errorLogger.getAllLogs();
      expect(storedLogs[0].stack).toBe('test stack');
    });

    it('should handle errors during logging gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      errorLogger.logError('Test error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[GENERAL] Test error'),
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should catch unexpected errors in logError', () => {
      // Mock addLogToStorage to throw without its own catch (by spying and throwing)
      // Actually, I'll mock Date to throw
      const dateSpy = vi.spyOn(global, 'Date').mockImplementation(() => {
        throw new Error('Date failed');
      });

      errorLogger.logError('Test');
      expect(console.error).toHaveBeenCalledWith('Failed to log error:', expect.any(Error));
      dateSpy.mockRestore();
    });
  });

  describe('Helper logging methods', () => {
    it('should log navigation errors', () => {
      const error = new Error('Nav failed');
      errorLogger.logNavigationError('Dashboard', error, 'Home');

      const logs = errorLogger.getLogsByType('navigation');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Navigation failed to "Dashboard"');
      expect(logs[0].context).toEqual({ targetView: 'Dashboard', fromView: 'Home' });
    });

    it('should log AI errors', () => {
      const error = new Error('AI failed');
      errorLogger.logAiError('Chat', error, { prompt: 'hello' });

      const logs = errorLogger.getLogsByType('ai');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('AI error in Chat');
      expect(logs[0].context).toMatchObject({ feature: 'Chat', prompt: 'hello' });
    });

    it('should log navigation errors with null error', () => {
      // @ts-ignore
      errorLogger.logNavigationError('Dashboard', null, 'Home');

      const logs = errorLogger.getLogsByType('navigation');
      expect(logs).toHaveLength(1);
    });

    it('should log AI errors with non-Error object', () => {
      errorLogger.logAiError('Chat', 'Something went wrong', { prompt: 'hello' });

      const logs = errorLogger.getLogsByType('ai');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Something went wrong');
    });

    it('should log warnings via logWarning', () => {
      errorLogger.logWarning('Warning message', 'sync');
      const logs = errorLogger.getLogsBySeverity('warning');
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('sync');
    });

    it('should log info via logInfo', () => {
      errorLogger.logInfo('Info message', 'analytics');
      const logs = errorLogger.getLogsBySeverity('info');
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('analytics');
    });
  });

  describe('Retrieval and Stats', () => {
    beforeEach(() => {
      errorLogger.logError('Error 1', 'general', 'error');
      errorLogger.logError('Error 2', 'ai', 'error');
      errorLogger.logWarning('Warning 1', 'validation');
    });

    it('should get all logs', () => {
      expect(errorLogger.getAllLogs()).toHaveLength(3);
    });

    it('should get logs by type', () => {
      expect(errorLogger.getLogsByType('ai')).toHaveLength(1);
    });

    it('should get logs by severity', () => {
      expect(errorLogger.getLogsBySeverity('error')).toHaveLength(2);
    });

    it('should get recent errors', () => {
      const recent = errorLogger.getRecentErrors(2);
      expect(recent).toHaveLength(2);
      expect(recent[0].message).toBe('Warning 1'); // Reversed
    });

    it('should get error stats', () => {
      const stats = errorLogger.getErrorStats();
      expect(stats.total).toBe(3);
      expect(stats.byType.general).toBe(1);
      expect(stats.bySeverity.error).toBe(2);
      expect(stats.mostRecent?.message).toBe('Warning 1');
    });

    it('should handle corrupted JSON in localStorage', () => {
      localStorage.setItem(LOG_STORAGE_KEY, 'invalid-json');
      expect(errorLogger.getAllLogs()).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to retrieve logs:', expect.any(Error));
    });
  });

  describe('Maintenance', () => {
    it('should clear all logs', () => {
      errorLogger.logError('Test');
      errorLogger.clearAllLogs();
      expect(errorLogger.getAllLogs()).toHaveLength(0);
    });

    it('should handle errors during clearAllLogs', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Remove failed');
      });

      errorLogger.clearAllLogs();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to clear logs'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      localStorage.removeItem = originalRemoveItem;
    });

    it('should export logs as JSON', () => {
      errorLogger.logError('Test');
      const json = errorLogger.exportLogsAsJson();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test');
    });

    it('should handle export errors', () => {
      // Mock getAllLogs to throw
      vi.spyOn(errorLogger, 'getAllLogs').mockImplementation(() => {
        throw new Error('Export failed');
      });
      expect(errorLogger.exportLogsAsJson()).toBe('{}');
    });

    it('should enforce MAX_LOGS limit', () => {
      for (let i = 0; i < 110; i++) {
        errorLogger.logError(`Error ${i}`);
      }
      const logs = errorLogger.getAllLogs();
      expect(logs).toHaveLength(100);
      expect(logs[logs.length - 1].message).toBe('Error 109');
    });

    it('should filter logs by retention period', () => {
      const oldLog: ErrorLog = {
        id: 'old',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        type: 'general',
        severity: 'error',
        message: 'Old error'
      };
      const newLog: ErrorLog = {
        id: 'new',
        timestamp: new Date().toISOString(),
        type: 'general',
        severity: 'error',
        message: 'New error'
      };

      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify([oldLog, newLog]));
      
      const logs = errorLogger.getAllLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('new');
    });

    it('should handle invalid timestamps during retention filtering', () => {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify([{ id: 'test' }]));
      
      // Mock JSON.parse to return a log with a symbol timestamp which will make new Date() throw
      vi.spyOn(JSON, 'parse').mockReturnValue([{
        id: 'invalid',
        timestamp: Symbol('test'),
        type: 'general',
        severity: 'error',
        message: 'Invalid date'
      }]);

      expect(errorLogger.getAllLogs()).toHaveLength(0);
    });

    it('should expose errorLogger on globalThis', () => {
      expect((globalThis as any).__errorLogger).toBeDefined();
      expect((globalThis as any).__errorLogger).toBe(errorLogger);
    });
  });
});
