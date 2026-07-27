
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorLogger } from '../../src/services/errorLogger';

describe('errorLogger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    it('logError should add log to localStorage', () => {
        errorLogger.logError('Test error', 'general', 'error');
        
        const logs = errorLogger.getAllLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe('Test error');
        expect(logs[0].severity).toBe('error');
    });

    it('logNavigationError should log navigation specific error', () => {
        errorLogger.logNavigationError('Dashboard', new Error('Failed'), 'Home');
        
        const logs = errorLogger.getAllLogs();
        expect(logs[0]?.type).toBe('navigation');
        expect(logs[0]?.context?.targetView).toBe('Dashboard');
    });

    it('logAiError should log AI specific error', () => {
        errorLogger.logAiError('Chat', new Error('AI Failed'));
        
        const logs = errorLogger.getAllLogs();
        expect(logs[0].type).toBe('ai');
        expect(logs[0].message).toContain('AI Failed');
    });

    it('clearLogs should remove all logs', () => {
        errorLogger.logError('Error 1');
        errorLogger.clearAllLogs();
        
        expect(errorLogger.getAllLogs()).toHaveLength(0);
    });

    it('should limit logs to MAX_LOGS', () => {
        // We need to know MAX_LOGS, it's 100 in the file
        for (let i = 0; i < 110; i++) {
            errorLogger.logError(`Error ${i}`);
        }
        
        expect(errorLogger.getAllLogs()).toHaveLength(100);
    });

    it('getLogsBySeverity should filter logs', () => {
        errorLogger.logError('E1', 'general', 'error');
        errorLogger.logError('W1', 'general', 'warning');
        
        const errors = errorLogger.getLogsBySeverity('error');
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toBe('E1');
    });
});
