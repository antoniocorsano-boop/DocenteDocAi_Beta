
import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as backupService from '../../src/services/backupService';

describe('backupService', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Reset internal state of backupService
        backupService.closeDatabase();
        backupService.resetDbForTesting();
        
        // Clear database
        const DB_NAME = 'OrarioDocAI_BackupDB';
        await new Promise((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = resolve;
            req.onerror = resolve;
        });

        // Mock navigator.storage
        (global as any).navigator.storage = {
            persist: vi.fn().mockResolvedValue(true),
            persisted: vi.fn().mockResolvedValue(true),
            estimate: vi.fn().mockResolvedValue({ usage: 100, quota: 1000 })
        };
    });

    it('initPersistentStorage should return true when successful', async () => {
        const result = await backupService.initPersistentStorage();
        expect(result).toBe(true);
        expect(navigator.storage.persist).toHaveBeenCalled();
    });

    it('checkStorageQuota should return estimate', async () => {
        const result = await backupService.checkStorageQuota();
        expect(result).toEqual({ usage: 100, quota: 1000 });
    });

    it('saveBackup and loadBackup should work together', async () => {
        const testState = { user: 'test', data: [1, 2, 3] };
        
        await backupService.saveBackup(testState);
        const loadedState = await backupService.loadBackup();
        
        expect(loadedState).toEqual(testState);
    });

    it('loadBackup should return null if no backup exists', async () => {
        const loadedState = await backupService.loadBackup();
        expect(loadedState).toBeNull();
    });

    it('deleteBackup should remove the backup', async () => {
        const testState = { id: 1 };
        await backupService.saveBackup(testState);
        
        await backupService.deleteBackup();
        const loadedState = await backupService.loadBackup();
        
        expect(loadedState).toBeNull();
    });

    it('exportBackupAsJson should return a valid JSON string', async () => {
        const testState = { id: 1 };
        await backupService.saveBackup(testState);
        
        const json = await backupService.exportBackupAsJson();
        const parsed = JSON.parse(json);
        
        expect(parsed).toEqual(testState);
    });
});
