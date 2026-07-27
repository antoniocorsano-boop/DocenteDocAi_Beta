import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('lazyStores', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe('Async Getters', () => {
    it('should lazy load student store', async () => {
      vi.doMock('../../src/stores/useStudentStore', () => ({
        useStudentStore: { name: 'useStudentStore' }
      }));
      const { getStudentStore } = await import('../../src/stores/lazyStores');
      const store = await getStudentStore();
      expect(store).toEqual({ name: 'useStudentStore' });
    });

    it('should lazy load academic store', async () => {
      vi.doMock('../../src/stores/useAcademicStore', () => ({
        useAcademicStore: { name: 'useAcademicStore' }
      }));
      const { getAcademicStore } = await import('../../src/stores/lazyStores');
      const store = await getAcademicStore();
      expect(store).toEqual({ name: 'useAcademicStore' });
    });

    it('should lazy load system store', async () => {
      vi.doMock('../../src/stores/useSystemStore', () => ({
        useSystemStore: { name: 'useSystemStore' }
      }));
      const { getSystemStore } = await import('../../src/stores/lazyStores');
      const store = await getSystemStore();
      expect(store).toEqual({ name: 'useSystemStore' });
    });

    it('should lazy load UI store', async () => {
      vi.doMock('../../src/stores/useUIStore', () => ({
        useUIStore: { name: 'useUIStore' }
      }));
      const { getUIStore } = await import('../../src/stores/lazyStores');
      const store = await getUIStore();
      expect(store).toEqual({ name: 'useUIStore' });
    });

    it('should lazy load settings store', async () => {
      vi.doMock('../../src/stores/useSettingsStore', () => ({
        useSettingsStore: { name: 'useSettingsStore' }
      }));
      const { getSettingsStore } = await import('../../src/stores/lazyStores');
      const store = await getSettingsStore();
      expect(store).toEqual({ name: 'useSettingsStore' });
    });

    it('should return cached store on subsequent calls', async () => {
      vi.doMock('../../src/stores/useStudentStore', () => ({ useStudentStore: {} }));
      vi.doMock('../../src/stores/useAcademicStore', () => ({ useAcademicStore: {} }));
      vi.doMock('../../src/stores/useSystemStore', () => ({ useSystemStore: {} }));
      vi.doMock('../../src/stores/useUIStore', () => ({ useUIStore: {} }));
      vi.doMock('../../src/stores/useSettingsStore', () => ({ useSettingsStore: {} }));
      
      const { getStudentStore, getAcademicStore, getSystemStore, getUIStore, getSettingsStore } = await import('../../src/stores/lazyStores');
      
      expect(await getStudentStore()).toBe(await getStudentStore());
      expect(await getAcademicStore()).toBe(await getAcademicStore());
      expect(await getSystemStore()).toBe(await getSystemStore());
      expect(await getUIStore()).toBe(await getUIStore());
      expect(await getSettingsStore()).toBe(await getSettingsStore());
    });
  });

  describe('Sync Getters', () => {
    it('should throw if student store is not loaded', async () => {
      const { getStudentStoreSync } = await import('../../src/stores/lazyStores');
      expect(() => getStudentStoreSync()).toThrow('StudentStore not loaded');
    });

    it('should return student store if loaded', async () => {
      vi.doMock('../../src/stores/useStudentStore', () => ({
        useStudentStore: { name: 'useStudentStore' }
      }));
      const { getStudentStore, getStudentStoreSync } = await import('../../src/stores/lazyStores');
      await getStudentStore();
      const store = getStudentStoreSync();
      expect(store).toEqual({ name: 'useStudentStore' });
    });

    it('should throw if academic store is not loaded', async () => {
      const { getAcademicStoreSync } = await import('../../src/stores/lazyStores');
      expect(() => getAcademicStoreSync()).toThrow('AcademicStore not loaded');
    });

    it('should throw if system store is not loaded', async () => {
      const { getSystemStoreSync } = await import('../../src/stores/lazyStores');
      expect(() => getSystemStoreSync()).toThrow('SystemStore not loaded');
    });

    it('should throw if settings store is not loaded', async () => {
      const { getSettingsStoreSync } = await import('../../src/stores/lazyStores');
      expect(() => getSettingsStoreSync()).toThrow(/SettingsStore not loaded yet/);
    });

    it('should return academic store if loaded', async () => {
      vi.doMock('../../src/stores/useAcademicStore', () => ({
        useAcademicStore: { name: 'useAcademicStore' }
      }));
      const { getAcademicStore, getAcademicStoreSync } = await import('../../src/stores/lazyStores');
      await getAcademicStore();
      const store = getAcademicStoreSync();
      expect(store).toEqual({ name: 'useAcademicStore' });
    });

    it('should return system store if loaded', async () => {
      vi.doMock('../../src/stores/useSystemStore', () => ({
        useSystemStore: { name: 'useSystemStore' }
      }));
      const { getSystemStore, getSystemStoreSync } = await import('../../src/stores/lazyStores');
      await getSystemStore();
      const store = getSystemStoreSync();
      expect(store).toEqual({ name: 'useSystemStore' });
    });

    it('should return settings store if loaded', async () => {
      vi.doMock('../../src/stores/useSettingsStore', () => ({
        useSettingsStore: { name: 'useSettingsStore' }
      }));
      const { getSettingsStore, getSettingsStoreSync } = await import('../../src/stores/lazyStores');
      await getSettingsStore();
      const store = getSettingsStoreSync();
      expect(store).toEqual({ name: 'useSettingsStore' });
    });
  });

  describe('preloadAllStores', () => {
    it('should preload all stores', async () => {
      vi.doMock('../../src/stores/useStudentStore', () => ({ useStudentStore: {} }));
      vi.doMock('../../src/stores/useAcademicStore', () => ({ useAcademicStore: {} }));
      vi.doMock('../../src/stores/useSystemStore', () => ({ useSystemStore: {} }));
      
      const { preloadAllStores, getStudentStoreSync } = await import('../../src/stores/lazyStores');
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      await preloadAllStores();
      expect(debugSpy).toHaveBeenCalledWith('[lazyStores] domain stores loaded');
      expect(getStudentStoreSync()).toBeDefined();
    });

    it('should handle errors during preload', async () => {
      vi.doMock('../../src/stores/useStudentStore', () => {
        return {
          get useStudentStore() { throw new Error('Load failed'); }
        };
      });
      
      const { preloadAllStores } = await import('../../src/stores/lazyStores');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(preloadAllStores()).rejects.toThrow('Load failed');
      expect(errorSpy).toHaveBeenCalledWith('[lazyStores] failed loading domain stores', expect.any(Error));
    });

    it('should handle errors during preload of UI store', async () => {
      vi.doMock('../../src/stores/useStudentStore', () => ({ useStudentStore: {} }));
      vi.doMock('../../src/stores/useAcademicStore', () => ({ useAcademicStore: {} }));
      vi.doMock('../../src/stores/useSystemStore', () => ({ useSystemStore: {} }));
      vi.doMock('../../src/stores/useUIStore', () => {
        return {
          get useUIStore() { throw new Error('UI Load failed'); }
        };
      });
      
      const { preloadAllStores } = await import('../../src/stores/lazyStores');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(preloadAllStores()).rejects.toThrow('UI Load failed');
      expect(errorSpy).toHaveBeenCalledWith('[lazyStores] failed loading ui store', expect.any(Error));
    });

    it('should handle errors during preload of Settings store', async () => {
      vi.doMock('../../src/stores/useStudentStore', () => ({ useStudentStore: {} }));
      vi.doMock('../../src/stores/useAcademicStore', () => ({ useAcademicStore: {} }));
      vi.doMock('../../src/stores/useSystemStore', () => ({ useSystemStore: {} }));
      vi.doMock('../../src/stores/useUIStore', () => ({ useUIStore: {} }));
      vi.doMock('../../src/stores/useSettingsStore', () => {
        return {
          get useSettingsStore() { throw new Error('Settings Load failed'); }
        };
      });
      
      const { preloadAllStores } = await import('../../src/stores/lazyStores');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(preloadAllStores()).rejects.toThrow('Settings Load failed');
      expect(errorSpy).toHaveBeenCalledWith('[lazyStores] failed loading settings store', expect.any(Error));
    });
  });
});
