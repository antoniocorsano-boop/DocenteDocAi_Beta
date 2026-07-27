
import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as indexedDbService from '../../src/services/indexedDbService';

describe('indexedDbService', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        indexedDbService.closeDatabase();
        indexedDbService.resetDbForTesting();
        
        // Clear database
        const DB_NAME = 'OrarioDocAI_Data';
        await new Promise((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = resolve;
            req.onerror = resolve;
        });
    });

    it('saveKbContentToIndexedDB and loadKbContentFromIndexedDB should work', async () => {
        const entries = [
            { id: '1', content: 'Content 1', htmlContent: 'HTML 1' },
            { id: '2', content: 'Content 2', fileContent: 'File 2' }
        ];
        
        await indexedDbService.saveKbContentToIndexedDB(entries as any);
        const loaded = await indexedDbService.loadKbContentFromIndexedDB();
        
        expect(loaded['1']).toEqual({ content: 'Content 1', htmlContent: 'HTML 1', fileContent: undefined });
        expect(loaded['2']).toEqual({ content: 'Content 2', htmlContent: '', fileContent: 'File 2' });
    });

    it('deleteKbContentFromIndexedDB should remove entry', async () => {
        const entries = [{ id: '1', content: 'Content 1' }];
        await indexedDbService.saveKbContentToIndexedDB(entries as any);
        
        await indexedDbService.deleteKbContentFromIndexedDB('1');
        const loaded = await indexedDbService.loadKbContentFromIndexedDB();
        
        expect(loaded['1']).toBeUndefined();
    });

    it('clearIndexedDB should remove all entries', async () => {
        const entries = [{ id: '1', content: 'C1' }, { id: '2', content: 'C2' }];
        await indexedDbService.saveKbContentToIndexedDB(entries as any);
        
        await indexedDbService.clearIndexedDB();
        const loaded = await indexedDbService.loadKbContentFromIndexedDB();
        
        expect(Object.keys(loaded)).toHaveLength(0);
    });

    it('deleteMainAppBackup should work', async () => {
        // Create the other DB and store first
        const MAIN_DB_NAME = 'OrarioDocAI_BackupDB';
        await new Promise((resolve, reject) => {
            const req = indexedDB.open(MAIN_DB_NAME, 3);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('app_state')) {
                    db.createObjectStore('app_state');
                }
            };
            req.onsuccess = () => {
                req.result.close();
                resolve(null);
            };
            req.onerror = () => reject(req.error);
        });

        await indexedDbService.deleteMainAppBackup();
    });
});
