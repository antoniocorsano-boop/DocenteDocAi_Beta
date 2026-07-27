// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    saveBackup, 
    loadBackup, 
    deleteBackup, 
    initPersistentStorage, 
    checkStorageQuota, 
    closeDatabase,
    resetDbForTesting as resetBackupDb
} from '../../src/services/backupService';
import { 
    saveKbContentToIndexedDB, 
    loadKbContentFromIndexedDB, 
    deleteKbContentFromIndexedDB, 
    clearIndexedDB,
    deleteMainAppBackup,
    resetDbForTesting as resetKbDb
} from '../../src/services/indexedDbService';
import { KnowledgeBaseEntry } from '../../src/types';

// Use fake timers to control setTimeout in tests
vi.useFakeTimers();

// Mock di IndexedDB
const mockDb = {
    transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
            put: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
            getAll: vi.fn(),
            clear: vi.fn(),
        })),
        oncomplete: null,
        onerror: null,
    })),
    close: vi.fn(),
    objectStoreNames: {
        contains: vi.fn(() => true),
    },
    createObjectStore: vi.fn(),
    deleteObjectStore: vi.fn(),
};

const mockRequest = {
    result: mockDb,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
};

const mockStoreRequest = {
    result: null,
    onsuccess: null,
    onerror: null,
};


describe('backupService (IndexedDB app_state)', () => {
    it('should initialize persistent storage', async () => {
        const result = await initPersistentStorage();
        expect(result).toBe(true);
        expect(navigator.storage.persist).toHaveBeenCalled();
    });

    it('should return false if persistent storage is not supported', async () => {
        const originalStorage = global.navigator.storage;
        global.navigator.storage = {};
        const result = await initPersistentStorage();
        expect(result).toBe(false);
        global.navigator.storage = originalStorage;
    });

    it('should check storage quota', async () => {
        const result = await checkStorageQuota();
        expect(result).toEqual({ quota: 1000, usage: 500 });
        expect(navigator.storage.estimate).toHaveBeenCalled();
    });

    it('should return null if storage estimate is not supported', async () => {
        const originalStorage = global.navigator.storage;
        global.navigator.storage = {};
        const result = await checkStorageQuota();
        expect(result).toBeNull();
        global.navigator.storage = originalStorage;
    });

    beforeEach(() => {
        // Ensure fake timers are applied for each test (other suites may toggle timers)
        vi.useFakeTimers();
        vi.clearAllMocks();
        resetBackupDb();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'debug').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        // Mock navigator.storage
        global.navigator.storage = {
            persist: vi.fn().mockResolvedValue(true),
            persisted: vi.fn().mockResolvedValue(true),
            estimate: vi.fn().mockResolvedValue({ quota: 1000, usage: 500 })
        };
        
        // Reset mockDb properly - ensure result is set immediately for sync mock
        mockRequest.result = mockDb;
        mockRequest.onsuccess = null;
        mockRequest.onerror = null;
        mockRequest.onupgradeneeded = null;
        
        global.indexedDB = {
            open: vi.fn(() => {
                // Trigger onsuccess asynchronously but before timers advance
                setTimeout(() => {
                    if (mockRequest.onsuccess) mockRequest.onsuccess({ target: mockRequest } as any);
                }, 0);
                return mockRequest;
            }),
            deleteDatabase: vi.fn(),
        };

        // Resetta i mock per ogni operazione di IndexedDB
        mockDb.transaction.mockClear();
        mockDb.transaction.mockImplementation(() => {
            const store = {
                put: vi.fn(() => {
                    const req = { result: null, onsuccess: null, onerror: null };
                    // Fire onsuccess synchronously
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
                get: vi.fn(() => {
                    const req = { result: null, onsuccess: null, onerror: null };
                    // Fire onsuccess synchronously
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
                delete: vi.fn(() => {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
                getAll: vi.fn(() => {
                    const req = { result: [], onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
                clear: vi.fn(() => {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
            };
            const tx = {
                objectStore: vi.fn(() => store),
                oncomplete: null,
                onerror: null,
            };
            // Simulate transaction completion after store operations
            setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
            return tx;
        });

        mockStoreRequest.result = null; // Default a null per get/getAll
    });

    it('dovrebbe salvare un backup nello store app_state', async () => {
        const testState = { user: { id: '123' }, settings: {} };
        const savePromise = saveBackup(testState);
        
        // Advance timers to trigger callbacks
        await vi.runAllTimersAsync();
        await savePromise;

        expect(global.indexedDB.open).toHaveBeenCalledWith('OrarioDocAI_BackupDB', 3);
        const transaction = mockDb.transaction.mock.results[0].value;
        expect(transaction.objectStore).toHaveBeenCalledWith('app_state');
        expect(transaction.objectStore().put).toHaveBeenCalledWith(testState, 'latest_backup');
    });

    it('dovrebbe caricare un backup dallo store app_state', async () => {
        const testState = { user: { id: '123' } };
        
        // Setup: mockDb.transaction returns a tx with proper get behavior
        mockDb.transaction.mockImplementationOnce(() => {
            const store = {
                get: vi.fn(() => {
                    const req = { result: testState, onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
            };
            const tx = {
                objectStore: vi.fn(() => store),
                oncomplete: null,
                onerror: null,
            };
            setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
            return tx;
        });

        const loadPromise = loadBackup();
        
        // Advance timers to trigger callbacks
        await vi.runAllTimersAsync();
        const loadedState = await loadPromise;

        // DB may already be open from previous test (cached), so just verify the result
        expect(loadedState).toEqual(testState);
    });

    it('dovrebbe eliminare un backup dallo store app_state', async () => {
        const deletePromise = deleteBackup();
        
        // Advance timers to trigger callbacks
        await vi.runAllTimersAsync();
        await deletePromise;

        // Verify deletion was called
        const transaction = mockDb.transaction.mock.results[0].value;
        expect(transaction.objectStore).toHaveBeenCalledWith('app_state');
        expect(transaction.objectStore().delete).toHaveBeenCalledWith('latest_backup');
    });

    it('should close the database', async () => {
        const promise = loadBackup();
        await vi.runAllTimersAsync();
        await promise;
        closeDatabase();
        expect(mockDb.close).toHaveBeenCalled();
    });

    it('should handle closeDatabase when already closed', () => {
        resetBackupDb();
        closeDatabase();
        expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('Database connection closed'));
    });

    describe('error handling', () => {
        beforeEach(() => {
            vi.useRealTimers();
        });

        afterEach(() => {
            vi.useFakeTimers();
        });

        it('should handle database open error', async () => {
            global.indexedDB.open = vi.fn(() => {
                const req = { onerror: null, error: { message: 'Open failed' } };
                setTimeout(() => req.onerror && req.onerror(), 0);
                return req;
            });

            await expect(saveBackup({})).rejects.toThrow('Database open failed: Open failed');
        });

        it('should handle store not found and recreate database', async () => {
            let openCount = 0;
            mockDb.objectStoreNames.contains.mockImplementation(() => {
                openCount++;
                return openCount > 1; // Second time it contains the store
            });

            const deleteRequest = { onsuccess: null, onerror: null };
            global.indexedDB.deleteDatabase = vi.fn(() => {
                setTimeout(() => deleteRequest.onsuccess && deleteRequest.onsuccess(), 0);
                return deleteRequest;
            });

            await saveBackup({});
            expect(global.indexedDB.deleteDatabase).toHaveBeenCalled();
        });

        it('should handle transaction error in saveBackup', async () => {
            mockDb.transaction.mockImplementationOnce(() => {
                const tx = {
                    objectStore: vi.fn(() => ({ put: vi.fn() })),
                    onerror: null,
                    error: new Error('Transaction failed')
                };
                setTimeout(() => tx.onerror && tx.onerror(), 0);
                return tx;
            });

            await expect(saveBackup({})).rejects.toThrow();
        });

        it('should handle request error in loadBackup', async () => {
            mockDb.transaction.mockImplementationOnce(() => {
                const store = {
                    get: vi.fn(() => {
                        const req = { onerror: null, error: new Error('Get failed') };
                        setTimeout(() => req.onerror && req.onerror(), 0);
                        return req;
                    }),
                };
                return { objectStore: () => store, onerror: null };
            });

            const result = await loadBackup();
            expect(result).toBeNull();
        });

        it('should handle transaction error in loadBackup', async () => {
            mockDb.transaction.mockImplementationOnce(() => {
                const tx = {
                    objectStore: vi.fn(() => ({ get: vi.fn(() => ({})) })),
                    onerror: null,
                    error: new Error('Transaction failed')
                };
                setTimeout(() => tx.onerror && tx.onerror(), 0);
                return tx;
            });

            const result = await loadBackup();
            expect(result).toBeNull();
        });

        it('should handle transaction error in deleteBackup', async () => {
            mockDb.transaction.mockImplementationOnce(() => {
                const tx = {
                    objectStore: vi.fn(() => ({ delete: vi.fn() })),
                    onerror: null,
                    error: new Error('Delete failed')
                };
                setTimeout(() => tx.onerror && tx.onerror(), 0);
                return tx;
            });

            await expect(deleteBackup()).rejects.toThrow();
        });

        it('should handle database open error with no message', async () => {
            global.indexedDB.open = vi.fn(() => {
                const req = { onerror: null, error: {} };
                setTimeout(() => req.onerror && req.onerror(), 0);
                return req;
            });

            await expect(saveBackup({})).rejects.toThrow('Database open failed: Unknown error');
        });

        it('should handle database upgrade blocked', async () => {
            global.indexedDB.open = vi.fn(() => {
                const req = { onblocked: null };
                setTimeout(() => req.onblocked && req.onblocked(), 0);
                return req;
            });

            await expect(saveBackup({})).rejects.toThrow('Database upgrade blocked');
        });

        it('should handle database upgrade needed', async () => {
            const mockNewDb = {
                objectStoreNames: { contains: vi.fn(() => true) },
                deleteObjectStore: vi.fn(),
                createObjectStore: vi.fn(),
                transaction: vi.fn(() => {
                    const tx = {
                        objectStore: vi.fn(() => ({ 
                            put: vi.fn(() => {
                                const req = { onsuccess: null };
                                setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                                return req;
                            }) 
                        })),
                        oncomplete: null,
                        onerror: null,
                    };
                    setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
                    return tx;
                }),
                close: vi.fn(),
            };
            global.indexedDB.open = vi.fn(() => {
                const req = { 
                    onupgradeneeded: null, 
                    onsuccess: null, 
                    result: mockNewDb 
                };
                setTimeout(() => {
                    if (req.onupgradeneeded) req.onupgradeneeded({ target: req } as any);
                    if (req.onsuccess) req.onsuccess({ target: req } as any);
                }, 0);
                return req;
            });

            await saveBackup({});
            expect(mockNewDb.createObjectStore).toHaveBeenCalledWith('app_state');
        });

        it('should handle database error after open', async () => {
            global.indexedDB.open = vi.fn(() => {
                const req = { 
                    onsuccess: null, 
                    result: { ...mockDb, onerror: null } 
                };
                setTimeout(() => req.onsuccess({ target: req } as any), 0);
                return req;
            });

            await saveBackup({});
        });

        it('should handle database close after open', async () => {
            const openRequest = { 
                onsuccess: null, 
                result: { 
                    ...mockDb, 
                    onclose: null,
                    onerror: null,
                    objectStoreNames: { contains: vi.fn().mockReturnValue(true) }
                } 
            };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);

            const savePromise = saveBackup({});
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess({ target: openRequest } as any);
                const db = openRequest.result;
                if (db.onclose) db.onclose();
                if (db.onerror) db.onerror(new Error('test error'));
                
                setTimeout(() => {
                    const txMock = (db as any).transaction as any;
                    const results = txMock?.mock?.results;

                    if (Array.isArray(results) && results.length > 0) {
                        const tx = results[results.length - 1]?.value;
                        if (tx && tx.oncomplete) tx.oncomplete();
                    }
                }, 10);
            }, 10);

            await savePromise;
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Database connection closed unexpectedly'));
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Database error:'), expect.any(Error));
        });

        it('should handle store not found and recreate database success', async () => {
            const mockDbNoStore = {
                objectStoreNames: { contains: vi.fn().mockReturnValue(false) },
                close: vi.fn()
            };
            const mockDbWithStore = {
                objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
                transaction: vi.fn().mockReturnValue({
                    objectStore: vi.fn().mockReturnValue({ put: vi.fn().mockReturnValue({ onsuccess: null }) }),
                    oncomplete: null,
                    onerror: null
                }),
                close: vi.fn()
            };

            const openRequest1 = { onsuccess: null, result: mockDbNoStore } as any;
            const openRequest2 = { onsuccess: null, result: mockDbWithStore } as any;

            let callCount = 0;
            global.indexedDB.open = vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return openRequest1;
                }
                return openRequest2;
            });

            const deleteRequest = { onsuccess: null, onerror: null };
            global.indexedDB.deleteDatabase = vi.fn().mockReturnValue(deleteRequest);

            const savePromise = saveBackup({});
            
            // 1. First open success (no store)
            setTimeout(() => {
                if (openRequest1.onsuccess) openRequest1.onsuccess();
                
                // 2. Delete success
                setTimeout(() => {
                    if (deleteRequest.onsuccess) deleteRequest.onsuccess();
                    
                    // 3. Second open success (with store)
                    setTimeout(() => {
                        if (openRequest2.onsuccess) openRequest2.onsuccess();
                        
                        // 4. Transaction complete
                        setTimeout(() => {
                            const tx = mockDbWithStore.transaction.mock.results[0].value;
                            if (tx.oncomplete) tx.oncomplete();
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);

            await savePromise;
            expect(global.indexedDB.deleteDatabase).toHaveBeenCalled();
        });

        it('should handle store not found and recreate database failure', async () => {
            const mockDbNoStore = {
                objectStoreNames: { contains: vi.fn().mockReturnValue(false) },
                close: vi.fn()
            };

            const openRequest1 = { onsuccess: null, result: mockDbNoStore } as any;
            vi.mocked(indexedDB.open).mockReturnValue(openRequest1);

            const deleteRequest = { onsuccess: null, onerror: null };
            global.indexedDB.deleteDatabase = vi.fn().mockReturnValue(deleteRequest);

            const savePromise = saveBackup({});
            
            setTimeout(() => {
                if (openRequest1.onsuccess) openRequest1.onsuccess();
                setTimeout(() => {
                    if (deleteRequest.onerror) deleteRequest.onerror();
                }, 10);
            }, 10);

            await expect(savePromise).rejects.toThrow('Failed to recreate database');
        });

        it('should trigger initPersistentStorage on saveBackup if not persisted', async () => {
            // Mock navigator.storage
            const originalStorage = navigator.storage;
            Object.defineProperty(navigator, 'storage', {
                value: {
                    persisted: vi.fn().mockResolvedValue(false),
                    persist: vi.fn().mockResolvedValue(true),
                    estimate: vi.fn().mockResolvedValue({ quota: 100, usage: 10 })
                },
                configurable: true
            });

            await saveBackup({ test: 'data' });
            expect(navigator.storage.persist).toHaveBeenCalled();

            // Restore
            Object.defineProperty(navigator, 'storage', { value: originalStorage, configurable: true });
        });

        it('should handle transaction throw in saveBackup', async () => {
            const mockDbThrow = {
                objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
                transaction: vi.fn().mockImplementation(() => {
                    throw new Error('Transaction throw');
                }),
                close: vi.fn()
            };
            const openRequest = {
                result: mockDbThrow,
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null,
                onblocked: null
            } as any;
            vi.mocked(indexedDB.open).mockReturnValue(openRequest);

            const savePromise = saveBackup({ test: 'data' });
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
            }, 10);

            await expect(savePromise).rejects.toThrow('Transaction throw');
        });

        it('should handle transaction throw in loadBackup', async () => {
            const mockDbThrow = {
                objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
                transaction: vi.fn().mockImplementation(() => {
                    throw new Error('Transaction throw');
                }),
                close: vi.fn()
            };
            const openRequest = {
                result: mockDbThrow,
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null,
                onblocked: null
            } as any;
            vi.mocked(indexedDB.open).mockReturnValue(openRequest);

            const loadPromise = loadBackup();
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
            }, 10);

            const result = await loadPromise;
            expect(result).toBeNull();
        });

        it('should handle transaction throw in deleteBackup', async () => {
            const mockDbThrow = {
                objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
                transaction: vi.fn().mockImplementation(() => {
                    throw new Error('Transaction throw');
                }),
                close: vi.fn()
            };
            const openRequest = {
                result: mockDbThrow,
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null,
                onblocked: null
            } as any;
            vi.mocked(indexedDB.open).mockReturnValue(openRequest);

            const deletePromise = deleteBackup();
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
            }, 10);

            await expect(deletePromise).rejects.toThrow('Transaction throw');
        });

        it('should reuse dbInstance and dbInitPromise', async () => {
            const openRequest = { onsuccess: null, result: mockDb } as any;
            vi.mocked(indexedDB.open).mockReturnValue(openRequest);

            const p1 = saveBackup({ test: 1 });
            const p2 = saveBackup({ test: 2 }); // Should hit dbInitPromise
            
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    const results = mockDb.transaction.mock.results;
                    if (results.length > 0) {
                        const tx = results[0].value;
                        if (tx && tx.oncomplete) tx.oncomplete();
                    }
                }, 10);
            }, 10);

            await Promise.all([p1, p2]);
            
            const p3 = saveBackup({ test: 3 }); // Should hit dbInstance
            setTimeout(() => {
                const results = mockDb.transaction.mock.results;
                if (results.length > 1) {
                    const tx = results[1].value;
                    if (tx && tx.oncomplete) tx.oncomplete();
                }
            }, 10);
            await p3;
        });

        it('should handle getDb catch block', async () => {
            global.indexedDB.open = vi.fn().mockImplementation(() => {
                throw new Error('Open throw');
            });
            
            await expect(saveBackup({})).rejects.toThrow('Open throw');
        });
    });
});

describe('indexedDbService (IndexedDB kb_content)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetKbDb();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'debug').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        global.indexedDB = {
            open: vi.fn(() => {
                // Trigger onsuccess asynchronously but before timers advance
                setTimeout(() => {
                    if (mockRequest.onsuccess) mockRequest.onsuccess({ target: mockRequest } as any);
                }, 0);
                return mockRequest;
            }),
            deleteDatabase: vi.fn(),
        };

        // Resetta i mock per ogni operazione di IndexedDB
        mockDb.transaction.mockClear();
        mockDb.transaction.mockImplementation(() => {
            const store = {
                put: vi.fn(() => {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
                get: vi.fn(() => {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
                delete: vi.fn(() => {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
                getAll: vi.fn(() => {
                    const req = { result: [], onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
                clear: vi.fn(() => {
                    const req = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
            };
            const tx = {
                objectStore: vi.fn(() => store),
                oncomplete: null,
                onerror: null,
            };
            // Simulate transaction completion after store operations
            setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
            return tx;
        });

        mockStoreRequest.result = null; // Default a null per get/getAll
    });

    it('dovrebbe salvare il contenuto pesante della Knowledge Base', async () => {
        const testKbEntries: KnowledgeBaseEntry[] = [
            { id: 'kb1', fileName: 'f1', content: 'c1', htmlContent: 'h1', fileContent: { data: 'd1', mimeType: 'm1' } },
        ];
        const savePromise = saveKbContentToIndexedDB(testKbEntries);
        
        // Advance timers to trigger callbacks
        await vi.runAllTimersAsync();
        await savePromise;

        // Verify the transaction was created and put was called
        const transaction = mockDb.transaction.mock.results[0].value;
        expect(transaction.objectStore).toHaveBeenCalledWith('kb_content');
        // Get the actual store object that was returned
        const store = transaction.objectStore.mock.results[0].value;
        // The service filters the entry to only save specific properties
        expect(store.put).toHaveBeenCalledWith({
            id: 'kb1',
            content: 'c1',
            htmlContent: 'h1',
            fileContent: { data: 'd1', mimeType: 'm1' }
        });
    });

    it('dovrebbe caricare il contenuto pesante della Knowledge Base', async () => {
        const testKbContent = {
            id: 'kb1',
            content: 'c1',
            htmlContent: 'h1',
            fileContent: { data: 'd1', mimeType: 'm1' }
        };
        
        mockDb.transaction.mockImplementationOnce(() => {
            const store = {
                getAll: vi.fn(() => {
                    const req = { result: [testKbContent], onsuccess: null, onerror: null };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                }),
            };
            const tx = {
                objectStore: vi.fn(() => store),
                oncomplete: null,
                onerror: null,
            };
            setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
            return tx;
        });

        const loadPromise = loadKbContentFromIndexedDB();
        
        // Advance timers to trigger callbacks
        await vi.runAllTimersAsync();
        const loadedContent = await loadPromise;
        
        expect(loadedContent).toEqual({ kb1: { content: 'c1', htmlContent: 'h1', fileContent: { data: 'd1', mimeType: 'm1' } } });
    });

    it('dovrebbe eliminare una singola entry dalla Knowledge Base', async () => {
        const deletePromise = deleteKbContentFromIndexedDB('kb1');
        
        // Advance timers to trigger callbacks
        await vi.runAllTimersAsync();
        await deletePromise;

        // Verify deletion was called
        const transaction = mockDb.transaction.mock.results[0].value;
        expect(transaction.objectStore).toHaveBeenCalledWith('kb_content');
        expect(transaction.objectStore().delete).toHaveBeenCalledWith('kb1');
    });

    it('dovrebbe svuotare lo store della Knowledge Base', async () => {
        const clearPromise = clearIndexedDB();
        
        // Advance timers to trigger callbacks
        await vi.runAllTimersAsync();
        await clearPromise;

        // Verify clear was called
        const transaction = mockDb.transaction.mock.results[0].value;
        expect(transaction.objectStore).toHaveBeenCalledWith('kb_content');
        expect(transaction.objectStore().clear).toHaveBeenCalledTimes(1);
    });

    describe('error handling and edge cases', () => {
        beforeEach(() => {
            vi.useRealTimers();
            resetKbDb();
        });

        it('should handle empty entries in saveKbContentToIndexedDB', async () => {
            await saveKbContentToIndexedDB([]);
            expect(mockDb.transaction).not.toHaveBeenCalled();
        });

        it('should handle database open error in getDb', async () => {
            const openRequest = { onerror: null, error: { message: 'KB Open failed' } };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);

            const promise = saveKbContentToIndexedDB([{ id: '1', content: 'test' }]);
            setTimeout(() => {
                if (openRequest.onerror) openRequest.onerror();
            }, 10);

            await expect(promise).resolves.toBeUndefined();
        });

        it('should handle database upgrade blocked in getDb', async () => {
            const openRequest = { onblocked: null };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);

            const promise = saveKbContentToIndexedDB([{ id: '1', content: 'test' }]);
            setTimeout(() => {
                if (openRequest.onblocked) openRequest.onblocked();
            }, 10);

            await expect(promise).resolves.toBeUndefined();
        });

        it('should handle store not found and recreate database', async () => {
            const mockDbNoStore = {
                objectStoreNames: { contains: vi.fn(() => false) },
                close: vi.fn(),
            };
            const openRequest1 = { onsuccess: null, result: mockDbNoStore };
            const deleteRequest = { onsuccess: null };
            const openRequest2 = { onsuccess: null, result: mockDb };
            
            global.indexedDB.open = vi.fn()
                .mockReturnValueOnce(openRequest1)
                .mockReturnValueOnce(openRequest2);
            global.indexedDB.deleteDatabase = vi.fn().mockReturnValue(deleteRequest);

            const promise = saveKbContentToIndexedDB([{ id: '1', content: 'test' }]);
            
            setTimeout(() => {
                if (openRequest1.onsuccess) openRequest1.onsuccess();
                setTimeout(() => {
                    if (deleteRequest.onsuccess) deleteRequest.onsuccess();
                    setTimeout(() => {
                        if (openRequest2.onsuccess) openRequest2.onsuccess();
                        setTimeout(() => {
                            const results = mockDb.transaction.mock.results;
                            if (results.length > 0) {
                                const tx = results[results.length - 1].value;
                                if (tx && tx.oncomplete) tx.oncomplete();
                            }
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);

            await promise;
            expect(global.indexedDB.deleteDatabase).toHaveBeenCalledWith('OrarioDocAI_Data');
        });

        it('should handle store not found and recreate database failure', async () => {
            const mockDbNoStore = {
                objectStoreNames: { contains: vi.fn(() => false) },
                close: vi.fn(),
            };
            const openRequest1 = { onsuccess: null, result: mockDbNoStore };
            const deleteRequest = { onerror: null };
            
            global.indexedDB.open = vi.fn().mockReturnValueOnce(openRequest1);
            global.indexedDB.deleteDatabase = vi.fn().mockReturnValue(deleteRequest);

            const promise = saveKbContentToIndexedDB([{ id: '1', content: 'test' }]);
            
            setTimeout(() => {
                if (openRequest1.onsuccess) openRequest1.onsuccess();
                setTimeout(() => {
                    if (deleteRequest.onerror) deleteRequest.onerror();
                }, 10);
            }, 10);

            await expect(promise).resolves.toBeUndefined();
        });

        it('should handle transaction error in saveKbContentToIndexedDB', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);
            
            mockDb.transaction.mockImplementationOnce(() => ({
                objectStore: vi.fn(() => ({ put: vi.fn() })),
                onerror: null,
            }));

            const promise = saveKbContentToIndexedDB([{ id: '1', content: 'test' }]);
            
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    const results = mockDb.transaction.mock.results;
                    if (results.length > 0) {
                        const tx = results[results.length - 1].value;
                        tx.error = new Error('KB Save failed');
                        if (tx.onerror) tx.onerror();
                    }
                }, 10);
            }, 10);

            await expect(promise).resolves.toBeUndefined();
        });

        it('should handle request error in loadKbContentFromIndexedDB', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);
            
            const mockReq = { onsuccess: null, onerror: null, error: new Error('KB Load failed') };
            mockDb.transaction.mockImplementationOnce(() => ({
                objectStore: vi.fn(() => ({ getAll: vi.fn(() => mockReq) })),
                onerror: null,
            }));

            const promise = loadKbContentFromIndexedDB();
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    if (mockReq.onerror) mockReq.onerror();
                }, 10);
            }, 10);

            const result = await promise;
            expect(result).toEqual({});
        });

        it('should handle transaction throw in saveKbContentToIndexedDB', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);
            
            mockDb.transaction.mockImplementationOnce(() => {
                throw new Error('KB Save Transaction throw');
            });

            const promise = saveKbContentToIndexedDB([{ id: '1', content: 'test' } as any]);
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
            }, 10);

            await promise;
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save KB content'), expect.any(Error));
        });

        it('should handle transaction throw in loadKbContentFromIndexedDB', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);
            
            mockDb.transaction.mockImplementationOnce(() => {
                throw new Error('KB Load Transaction throw');
            });

            const promise = loadKbContentFromIndexedDB();
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
            }, 10);

            const result = await promise;
            expect(result).toEqual({});
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load KB content'), expect.any(Error));
        });

        it('should handle transaction throw in deleteKbContentFromIndexedDB', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);
            
            mockDb.transaction.mockImplementationOnce(() => {
                throw new Error('KB Delete Transaction throw');
            });

            const promise = deleteKbContentFromIndexedDB('1');
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
            }, 10);

            await expect(promise).rejects.toThrow('KB Delete Transaction throw');
        });

        it('should handle transaction error in loadKbContentFromIndexedDB', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);
            
            const mockTx = {
                objectStore: vi.fn(() => ({ getAll: vi.fn().mockReturnValue({ onsuccess: null }) })),
                onerror: null,
                error: new Error('KB Load Transaction failed')
            };
            mockDb.transaction.mockReturnValue(mockTx);

            const promise = loadKbContentFromIndexedDB();
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    if (mockTx.onerror) mockTx.onerror();
                }, 20);
            }, 10);

            const result = await promise;
            expect(result).toEqual({});
        });

        it('should handle transaction error in deleteKbContentFromIndexedDB', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);
            
            const mockTx = {
                objectStore: vi.fn(() => ({ delete: vi.fn() })),
                onerror: null,
                error: new Error('KB Delete failed')
            };
            mockDb.transaction.mockReturnValue(mockTx);

            const promise = deleteKbContentFromIndexedDB('1');
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    if (mockTx.onerror) mockTx.onerror();
                }, 20);
            }, 10);

            await expect(promise).rejects.toThrow('KB Delete failed');
        });

        it('should handle transaction error in clearIndexedDB', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);
            
            mockDb.transaction.mockImplementationOnce(() => ({
                objectStore: vi.fn(() => ({ clear: vi.fn() })),
                onerror: null,
            }));

            const promise = clearIndexedDB();
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    const results = mockDb.transaction.mock.results;
                    if (results.length > 0) {
                        const tx = results[results.length - 1].value;
                        tx.error = new Error('KB Clear failed');
                        if (tx.onerror) tx.onerror();
                    }
                }, 10);
            }, 10);

            await expect(promise).rejects.toThrow('KB Clear failed');
        });

        it('should handle deleteMainAppBackup success', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);

            const promise = deleteMainAppBackup();
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    const results = mockDb.transaction.mock.results;
                    if (results.length > 0) {
                        const tx = results[results.length - 1].value;
                        if (tx && tx.oncomplete) tx.oncomplete();
                    }
                }, 10);
            }, 10);

            await expect(promise).resolves.toBeUndefined();
            expect(global.indexedDB.open).toHaveBeenCalledWith('OrarioDocAI_BackupDB', 3);
        });

        it('should handle deleteMainAppBackup open error', async () => {
            const openRequest = { onerror: null };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);

            const promise = deleteMainAppBackup();
            setTimeout(() => {
                if (openRequest.onerror) openRequest.onerror();
            }, 10);

            await expect(promise).rejects.toThrow('Failed to open main app backup DB.');
        });

        it('should handle deleteMainAppBackup transaction error', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);

            mockDb.transaction.mockImplementationOnce(() => ({
                objectStore: vi.fn(() => ({ delete: vi.fn() })),
                onerror: null,
            }));

            const promise = deleteMainAppBackup();
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    const results = mockDb.transaction.mock.results;
                    if (results.length > 0) {
                        const tx = results[results.length - 1].value;
                        tx.error = new Error('Main Delete failed');
                        if (tx.onerror) tx.onerror();
                    }
                }, 10);
            }, 10);

            await expect(promise).rejects.toThrow('Main Delete failed');
        });

        it('should handle deleteMainAppBackup transaction throw', async () => {
            const openRequest = { onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);

            mockDb.transaction.mockImplementationOnce(() => {
                throw new Error('Main Transaction throw');
            });

            const promise = deleteMainAppBackup();
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
            }, 10);

            await expect(promise).rejects.toThrow('Main Transaction throw');
        });

        it('should handle deleteMainAppBackup upgrade needed', async () => {
            const openRequest = { onupgradeneeded: null, onsuccess: null, result: mockDb };
            global.indexedDB.open = vi.fn().mockReturnValue(openRequest);

            const promise = deleteMainAppBackup();
            setTimeout(() => {
                if (openRequest.onupgradeneeded) {
                    openRequest.onupgradeneeded({ target: openRequest } as any);
                }
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    const results = mockDb.transaction.mock.results;
                    if (results.length > 0) {
                        const tx = results[results.length - 1].value;
                        if (tx && tx.oncomplete) tx.oncomplete();
                    }
                }, 20);
            }, 20);

            await expect(promise).resolves.toBeUndefined();
        });

        it('should reuse dbInstance and dbInitPromise in indexedDbService', async () => {
            const openRequest = { onsuccess: null, result: mockDb } as any;
            vi.mocked(indexedDB.open).mockReturnValue(openRequest);

            const p1 = saveKbContentToIndexedDB([{ id: '1', content: 'c1' } as any]);
            const p2 = saveKbContentToIndexedDB([{ id: '2', content: 'c2' } as any]); // Should hit dbInitPromise
            
            setTimeout(() => {
                if (openRequest.onsuccess) openRequest.onsuccess();
                setTimeout(() => {
                    const results = mockDb.transaction.mock.results;
                    if (results.length > 0) {
                        const tx = results[0].value;
                        if (tx && tx.oncomplete) tx.oncomplete();
                    }
                }, 10);
            }, 10);

            await Promise.all([p1, p2]);
            
            const p3 = saveKbContentToIndexedDB([{ id: '3', content: 'c3' } as any]); // Should hit dbInstance
            setTimeout(() => {
                const results = mockDb.transaction.mock.results;
                if (results.length > 1) {
                    const tx = results[1].value;
                    if (tx && tx.oncomplete) tx.oncomplete();
                }
            }, 10);
            await p3;
        });

        it('should handle getDb catch block in indexedDbService', async () => {
            global.indexedDB.open = vi.fn().mockImplementation(() => {
                throw new Error('KB Open throw');
            });
            
            await saveKbContentToIndexedDB([{ id: '1', content: 'test' } as any]);
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save KB content'), expect.any(Error));
        });

        it('should handle database connection close in indexedDbService', async () => {
            const openRequest = { onsuccess: null, result: mockDb } as any;
            vi.mocked(indexedDB.open).mockReturnValue(openRequest);
            
            const p = loadKbContentFromIndexedDB();
            if (openRequest.onsuccess) openRequest.onsuccess();
            await p;
            
            expect(mockDb.onclose).toBeDefined();
            mockDb.onclose(); // Trigger it
            
            // Verify it was reset by trying to open again
            vi.mocked(indexedDB.open).mockClear();
            const p2 = loadKbContentFromIndexedDB();
            if (openRequest.onsuccess) openRequest.onsuccess();
            await p2;
            expect(indexedDB.open).toHaveBeenCalled();
        });

        it('should handle onupgradeneeded in indexedDbService', async () => {
            const openRequest = { onupgradeneeded: null, onsuccess: null, result: mockDb } as any;
            vi.mocked(indexedDB.open).mockReturnValue(openRequest);
            
            // Case 1: store exists
            mockDb.objectStoreNames.contains.mockReturnValue(true);
            const p = loadKbContentFromIndexedDB();
            if (openRequest.onupgradeneeded) {
                openRequest.onupgradeneeded({ target: openRequest } as any);
            }
            expect(mockDb.deleteObjectStore).toHaveBeenCalledWith('kb_content');
            expect(mockDb.createObjectStore).toHaveBeenCalledWith('kb_content', { keyPath: 'id' });
            
            if (openRequest.onsuccess) openRequest.onsuccess();
            await p;
            
            // Case 2: store doesn't exist
            resetKbDb();
            mockDb.objectStoreNames.contains.mockReturnValue(false);
            const p2 = loadKbContentFromIndexedDB();
            if (openRequest.onupgradeneeded) {
                openRequest.onupgradeneeded({ target: openRequest } as any);
            }
            expect(mockDb.deleteObjectStore).toHaveBeenCalledTimes(1); // Still 1 from previous case
            expect(mockDb.createObjectStore).toHaveBeenCalledTimes(2);
            
            mockDb.objectStoreNames.contains.mockReturnValue(true); // For onsuccess check
            if (openRequest.onsuccess) openRequest.onsuccess();
            await p2;
        });
    });
});
