import { describe, it, expect, vi } from 'vitest';
import { validateBackupData, isBackupRecent, hasMinimumData } from '../../src/utils/dataValidator';

describe('dataValidator', () => {
  describe('validateBackupData', () => {
    it('should return null for null or non-object input', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(validateBackupData(null)).toBeNull();
      expect(validateBackupData(undefined)).toBeNull();
      expect(validateBackupData('string')).toBeNull();
      expect(validateBackupData(123)).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return a validated object with default values for empty object', () => {
      const result = validateBackupData({});
      expect(result).toBeDefined();
      expect(result?.students).toEqual([]);
      expect(result?.lessons).toEqual({});
      expect(result?.evaluations).toEqual([]);
      expect(result?.dismissedSuggestions).toBeInstanceOf(Set);
      expect(result?.analyticsMetrics).toBeDefined();
      expect(result?.analyticsMetrics.totalDocumentsGenerated).toBe(0);
    });

    it('should preserve valid data', () => {
      const input = {
        students: [{ id: '1', nome: 'Mario', cognome: 'Rossi', classe: '1A' }],
        user: { name: 'Test User' },
        dismissedSuggestions: ['sug-1', 'sug-2']
      };
      const result = validateBackupData(input);
      expect(result?.students).toHaveLength(1);
      expect(result?.students[0].nome).toBe('Mario');
      expect(result?.user).toEqual({ name: 'Test User' });
      expect(result?.dismissedSuggestions.has('sug-1')).toBe(true);
      expect(result?.dismissedSuggestions.has('sug-2')).toBe(true);
    });

    it('should handle invalid array fields by defaulting to empty array', () => {
      const input = {
        students: 'not-an-array',
        evaluations: null
      };
      const result = validateBackupData(input);
      expect(result?.students).toEqual([]);
      expect(result?.evaluations).toEqual([]);
    });

    it('should handle invalid object fields by defaulting to empty object', () => {
      const input = {
        lessons: [],
        slots: 'not-an-object'
      };
      const result = validateBackupData(input);
      expect(result?.lessons).toEqual({});
      expect(result?.slots).toEqual({});
    });

    it('should handle invalid dismissedSuggestions by defaulting to empty Set', () => {
      const input = {
        dismissedSuggestions: { not: 'an-array' }
      };
      const result = validateBackupData(input);
      expect(result?.dismissedSuggestions).toBeInstanceOf(Set);
      expect(result?.dismissedSuggestions.size).toBe(0);
    });

    it('should filter non-string items from dismissedSuggestions', () => {
      const input = {
        dismissedSuggestions: ['sug-1', 123, null, 'sug-2']
      };
      const result = validateBackupData(input);
      expect(result?.dismissedSuggestions.has('sug-1')).toBe(true);
      expect(result?.dismissedSuggestions.has('sug-2')).toBe(true);
      expect(result?.dismissedSuggestions.size).toBe(2);
    });

    it('should provide default analyticsMetrics if missing', () => {
      const result = validateBackupData({});
      expect(result?.analyticsMetrics).toEqual(expect.objectContaining({
        totalDocumentsGenerated: 0,
        documentsByType: {},
        featuresUsage: {},
        templatesCreated: 0,
        exportBatchesCount: 0,
        aiInteractionsCount: 0,
        averageSessionDuration: 0
      }));
      expect(result?.analyticsMetrics.lastUpdated).toBeDefined();
    });

    it('should provide default analyticsSettings if missing', () => {
      const result = validateBackupData({});
      expect(result?.analyticsSettings).toEqual({
        enabled: true,
        collectFeatureUsage: true,
        collectDocumentMetrics: true,
        collectPerformanceMetrics: false,
        retentionDays: 90,
        lastReset: null
      });
    });

    it('should provide default backupState and driveSyncState if missing', () => {
      const result = validateBackupData({});
      expect(result?.backupState).toEqual({ status: 'synced', lastBackup: null });
      expect(result?.driveSyncState).toEqual({ isAuthenticated: false, isSyncing: false, lastSyncTime: null });
    });

    it('should handle errors during validation', () => {
      // This is tricky because ensureArray/ensureObject are very safe.
      // But we can mock console.error to verify it's called if something fails.
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // We can't easily make it throw without changing the code or using a very weird object
      // that throws on property access.
      const weirdObject = {};
      Object.defineProperty(weirdObject, 'students', {
        get: () => { throw new Error('Validation error'); }
      });

      expect(validateBackupData(weirdObject)).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('isBackupRecent', () => {
    it('should return false for invalid input', () => {
      expect(isBackupRecent(null)).toBe(false);
      expect(isBackupRecent({})).toBe(false);
      expect(isBackupRecent({ _savedAt: 123 })).toBe(false);
    });

    it('should return true for recent backup', () => {
      const now = new Date().toISOString();
      expect(isBackupRecent({ _savedAt: now })).toBe(true);
    });

    it('should return false for old backup', () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      expect(isBackupRecent({ _savedAt: oldDate })).toBe(false);
    });

    it('should return false for invalid date string', () => {
      expect(isBackupRecent({ _savedAt: 'not-a-date' })).toBe(false);
    });

    it('should return false if date calculation throws', () => {
      const backup = { _savedAt: '2023-01-01' };
      // Mock Date constructor to throw
      const dateSpy = vi.spyOn(global, 'Date').mockImplementation(() => {
        throw new Error('Date error');
      });
      expect(isBackupRecent(backup as any)).toBe(false);
      dateSpy.mockRestore();
    });
  });

  describe('hasMinimumData', () => {
    it('should return true if user exists', () => {
      const data = validateBackupData({ user: { id: '1' } });
      expect(hasMinimumData(data!)).toBe(true);
    });

    it('should return true if students exist', () => {
      const data = validateBackupData({ students: [{ id: '1' }] });
      expect(hasMinimumData(data!)).toBe(true);
    });

    it('should return true if lessons exist', () => {
      const data = validateBackupData({ lessons: { '1': {} } });
      expect(hasMinimumData(data!)).toBe(true);
    });

    it('should return true if slots exist', () => {
      const data = validateBackupData({ slots: { '1': {} } });
      expect(hasMinimumData(data!)).toBe(true);
    });

    it('should return false if no significant data exists', () => {
      const data = validateBackupData({});
      expect(hasMinimumData(data!)).toBe(false);
    });
  });
});
