import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  saveBackup, 
  loadBackup, 
  deleteBackup, 
  checkStorageQuota, 
  initPersistentStorage,
  closeDatabase,
  resetDbForTesting
} from '../../src/services/backupService';

// Mock IndexedDB
class MockRequest {
  onsuccess: any = null;
  onerror: any = null;
  onupgradeneeded: any = null;
  onblocked: any = null;
  result: any = null;
  error: any = null;
  readyState: string = 'pending';

  fireSuccess(result: any) {
    this.result = result;
    this.readyState = 'done';
    if (this.onsuccess) this.onsuccess({ target: this });
  }

  fireError(error: any) {
    this.error = error;
    this.readyState = 'done';
    if (this.onerror) this.onerror({ target: this });
  }

  fireUpgradeNeeded(db: any) {
    this.result = db;
    if (this.onupgradeneeded) this.onupgradeneeded({ target: this });
  }

  fireBlocked() {
    if (this.onblocked) this.onblocked({ target: this });
  }
}

const STORE_NAME = 'app_state';

describe('backupService', () => {
  let mockDb: any;
  let mockTransaction: any;
  let mockStore: any;
  let openRequest: MockRequest;
  let lastGetRequest: any = null;

  beforeEach(() => {
    vi.clearAllMocks();
    resetDbForTesting();
    lastGetRequest = null;
    
    // Mock console
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockStore = {
      put: vi.fn().mockReturnValue({}),
      get: vi.fn().mockImplementation(() => {
        const req = new MockRequest();
        lastGetRequest = req;
        return req;
      }),
      delete: vi.fn().mockReturnValue({}),
    };

    mockTransaction = {
      objectStore: vi.fn().mockReturnValue(mockStore),
      oncomplete: null,
      onerror: null,
      error: { message: 'Transaction error' }
    };

    mockDb = {
      transaction: vi.fn().mockReturnValue(mockTransaction),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true)
      },
      createObjectStore: vi.fn(),
      deleteObjectStore: vi.fn(),
      close: vi.fn(),
      onclose: null,
      onerror: null
    };

    openRequest = new MockRequest();
    vi.stubGlobal('indexedDB', {
      open: vi.fn().mockReturnValue(openRequest),
      deleteDatabase: vi.fn().mockReturnValue(new MockRequest())
    });

    vi.stubGlobal('navigator', {
      storage: {
        persist: vi.fn().mockResolvedValue(true),
        estimate: vi.fn().mockResolvedValue({ usage: 100, quota: 1000 }),
        persisted: vi.fn().mockResolvedValue(true)
      }
    });

    // Default structuredClone
    (global as any).structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saveBackup should save state', async () => {
    const savePromise = saveBackup({ test: 'data' });
    await Promise.resolve();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    if (mockTransaction.oncomplete) mockTransaction.oncomplete();
    await savePromise;
    expect(mockStore.put).toHaveBeenCalledWith({ test: 'data' }, 'latest_backup');
  });

  it('saveBackup should work without structuredClone', async () => {
    const originalStructuredClone = global.structuredClone;
    delete (global as any).structuredClone;
    
    const savePromise = saveBackup({ test: 'data' });
    await Promise.resolve();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    if (mockTransaction.oncomplete) mockTransaction.oncomplete();
    await savePromise;
    expect(mockStore.put).toHaveBeenCalledWith({ test: 'data' }, 'latest_backup');
    
    (global as any).structuredClone = originalStructuredClone;
  });

  it('saveBackup should handle missing navigator.storage', async () => {
    vi.stubGlobal('navigator', {});
    const savePromise = saveBackup({ test: 'data' });
    await Promise.resolve();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    if (mockTransaction.oncomplete) mockTransaction.oncomplete();
    await savePromise;
    expect(mockStore.put).toHaveBeenCalledWith({ test: 'data' }, 'latest_backup');
  });

  it('saveBackup should trigger persistence if not persisted', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        persisted: vi.fn().mockResolvedValue(false),
        persist: vi.fn().mockResolvedValue(true)
      }
    });
    const savePromise = saveBackup({ test: 'data' });
    await Promise.resolve();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    if (mockTransaction.oncomplete) mockTransaction.oncomplete();
    await savePromise;
    expect(navigator.storage.persist).toHaveBeenCalled();
  });

  it('loadBackup should load state', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess({ data: 'saved' });
    const result = await loadPromise;
    expect(result).toEqual({ data: 'saved' });
  });

  it('deleteBackup should delete state', async () => {
    const deletePromise = deleteBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    if (mockTransaction.oncomplete) mockTransaction.oncomplete();
    await deletePromise;
    expect(mockStore.delete).toHaveBeenCalledWith('latest_backup');
  });

  it('checkStorageQuota should return estimate', async () => {
    const result = await checkStorageQuota();
    expect(result).toEqual({ usage: 100, quota: 1000 });
  });

  it('checkStorageQuota should handle error', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        estimate: async () => { throw new Error('Quota error'); }
      }
    });
    const result = await checkStorageQuota();
    expect(result).toBeNull();
  });

  it('initPersistentStorage should return true', async () => {
    const result = await initPersistentStorage();
    expect(result).toBe(true);
  });

  it('initPersistentStorage should handle error', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        persist: async () => { throw new Error('Persist error'); }
      }
    });
    const result = await initPersistentStorage();
    expect(result).toBe(false);
  });

  it('should handle open error', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireError({ message: 'Open failed' });
    const result = await loadPromise;
    expect(result).toBeNull();
  });

  it('should handle onupgradeneeded (store exists)', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    mockDb.objectStoreNames.contains.mockReturnValue(true);
    openRequest.fireUpgradeNeeded(mockDb);
    expect(mockDb.deleteObjectStore).toHaveBeenCalledWith(STORE_NAME);
    expect(mockDb.createObjectStore).toHaveBeenCalledWith(STORE_NAME);
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await loadPromise;
  });

  it('should handle onupgradeneeded (store does not exist)', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    mockDb.objectStoreNames.contains.mockReturnValue(false);
    openRequest.fireUpgradeNeeded(mockDb);
    expect(mockDb.deleteObjectStore).not.toHaveBeenCalled();
    expect(mockDb.createObjectStore).toHaveBeenCalledWith(STORE_NAME);
    
    // IMPORTANT: Reset contains to true so loadBackup doesn't enter recreation loop
    mockDb.objectStoreNames.contains.mockReturnValue(true);
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await loadPromise;
  });

  it('should handle onblocked', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireBlocked();
    const result = await loadPromise;
    expect(result).toBeNull();
  });

  it('should handle missing store and recreate', async () => {
    mockDb.objectStoreNames.contains.mockReturnValueOnce(false);
    const deleteRequest = new MockRequest();
    (indexedDB.deleteDatabase as any).mockReturnValue(deleteRequest);
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    deleteRequest.fireSuccess(null);
    await Promise.resolve();
    const secondOpenRequest = (indexedDB.open as any).mock.results[1].value;
    secondOpenRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await loadPromise;
    expect(indexedDB.open).toHaveBeenCalledTimes(2);
  });

  it('should handle recreate failure', async () => {
    mockDb.objectStoreNames.contains.mockReturnValueOnce(false);
    const deleteRequest = new MockRequest();
    (indexedDB.deleteDatabase as any).mockReturnValue(deleteRequest);
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    deleteRequest.fireError(new Error('Delete failed'));
    const result = await loadPromise;
    expect(result).toBeNull();
  });

  it('should handle transaction error in saveBackup', async () => {
    const savePromise = saveBackup({});
    await Promise.resolve();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    if (mockTransaction.onerror) mockTransaction.onerror();
    await expect(savePromise).rejects.toThrow();
  });

  it('should handle load error gracefully', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireError({ message: 'Get failed' });
    const result = await loadPromise;
    expect(result).toBeNull();
  });

  it('closeDatabase should close connection', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await loadPromise;
    
    closeDatabase();
    expect(mockDb.close).toHaveBeenCalled();
  });

  it('should handle dbInstance onclose', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await loadPromise;
    
    if (mockDb.onclose) mockDb.onclose();
    // Should reset internal state, next call should open again
    const p2 = loadBackup();
    await Promise.resolve();
    expect(indexedDB.open).toHaveBeenCalledTimes(2);
  });

  it('should handle dbInstance onerror', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await loadPromise;
    
    if (mockDb.onerror) mockDb.onerror(new Event('error'));
    expect(console.error).toHaveBeenCalled();
  });

  it('should reuse existing dbInitPromise', async () => {
    const p1 = loadBackup();
    const p2 = loadBackup();
    expect(indexedDB.open).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    // Both calls will use the same lastGetRequest if they happen sequentially
    // But here they happen in parallel.
    // Wait, loadBackup calls getDb, then creates a new promise.
    // So they will both call mockStore.get.
    // lastGetRequest will be the SECOND one.
    const req2 = lastGetRequest;
    req2.fireSuccess(null);
    // We need the first one too.
    const req1 = mockStore.get.mock.results[0].value;
    req1.fireSuccess(null);
    await p1;
    await p2;
  });

  it('should reuse existing dbInstance', async () => {
    const p1 = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await p1;
    const p2 = loadBackup();
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await p2;
    expect(indexedDB.open).toHaveBeenCalledTimes(1);
  });

  it('should handle transaction error in loadBackup', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    if (mockTransaction.onerror) mockTransaction.onerror();
    const result = await loadPromise;
    expect(result).toBeNull();
  });

  it('should handle transaction error in deleteBackup', async () => {
    const deletePromise = deleteBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    if (mockTransaction.onerror) mockTransaction.onerror();
    await expect(deletePromise).rejects.toThrow();
  });

  it('should handle missing navigator.storage in init/quota', async () => {
    vi.stubGlobal('navigator', {});
    expect(await initPersistentStorage()).toBe(false);
    expect(await checkStorageQuota()).toBeNull();
  });

  it('should handle throw in getDb', async () => {
    (indexedDB.open as any).mockImplementationOnce(() => {
      throw new Error('Sync open error');
    });
    const loadPromise = loadBackup();
    const result = await loadPromise;
    expect(result).toBeNull();
  });

  it('should handle throw in saveBackup transaction', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await loadPromise;

    mockDb.transaction.mockImplementationOnce(() => {
      throw new Error('Transaction throw');
    });
    await expect(saveBackup({})).rejects.toThrow('Transaction throw');
  });

  it('should handle throw in loadBackup transaction', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await loadPromise;

    mockDb.transaction.mockImplementationOnce(() => {
      throw new Error('Transaction throw');
    });
    const result = await loadBackup();
    expect(result).toBeNull();
  });

  it('should handle throw in deleteBackup transaction', async () => {
    const loadPromise = loadBackup();
    await Promise.resolve();
    openRequest.fireSuccess(mockDb);
    await Promise.resolve();
    await Promise.resolve();
    lastGetRequest.fireSuccess(null);
    await loadPromise;

    mockDb.transaction.mockImplementationOnce(() => {
      throw new Error('Transaction throw');
    });
    await expect(deleteBackup()).rejects.toThrow('Transaction throw');
  });
});
