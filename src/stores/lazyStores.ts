/**
 * CRITICAL: Lazy-load zustand stores to ensure React is initialized first
 * This prevents "Cannot read properties of undefined (reading 'useState')" errors
 */

import type { StudentState, StudentActions } from './useStudentStore';
import type { AcademicState, AcademicActions } from './useAcademicStore';
import type { SystemState, SystemActions } from './useSystemStore';
import type { UIState } from './useUIStore';
import type { SettingsState } from '../types';
import { logger } from '../utils/logger';

type StudentStore = import('zustand').UseBoundStore<import('zustand').StoreApi<StudentState & { actions: StudentActions }>>;
type AcademicStore = import('zustand').UseBoundStore<import('zustand').StoreApi<AcademicState & { actions: AcademicActions }>>;
type SystemStore = import('zustand').UseBoundStore<import('zustand').StoreApi<SystemState & { actions: SystemActions }>>;
type UIStore = import('zustand').UseBoundStore<import('zustand').StoreApi<UIState>>;
type SettingsStore = import('zustand').UseBoundStore<import('zustand').StoreApi<SettingsState>>;

let cachedStudentStore: StudentStore | null = null;
let cachedAcademicStore: AcademicStore | null = null;
let cachedSystemStore: SystemStore | null = null;
let cachedUIStore: UIStore | null = null;
let cachedSettingsStore: SettingsStore | null = null;

// Lazy load student store
export async function getStudentStore(): Promise<StudentStore> {
  if (!cachedStudentStore) {
    const { useStudentStore } = await import('./useStudentStore');
    cachedStudentStore = useStudentStore;
  }
  return cachedStudentStore;
}

// Lazy load academic store
export async function getAcademicStore(): Promise<AcademicStore> {
  if (!cachedAcademicStore) {
    const { useAcademicStore } = await import('./useAcademicStore');
    cachedAcademicStore = useAcademicStore;
  }
  return cachedAcademicStore;
}

// Lazy load system store
export async function getSystemStore(): Promise<SystemStore> {
  if (!cachedSystemStore) {
    const { useSystemStore } = await import('./useSystemStore');
    cachedSystemStore = useSystemStore;
  }
  return cachedSystemStore;
}

// Lazy load UI store
export async function getUIStore(): Promise<UIStore> {
  if (!cachedUIStore) {
    const { useUIStore } = await import('./useUIStore');
    cachedUIStore = useUIStore;
  }
  return cachedUIStore;
}

// Lazy load settings store
export async function getSettingsStore(): Promise<SettingsStore> {
  if (!cachedSettingsStore) {
    const { useSettingsStore } = await import('./useSettingsStore');
    cachedSettingsStore = useSettingsStore;
  }
  return cachedSettingsStore;
}

// Synchronous getters
export function getStudentStoreSync(): StudentStore {
  if (!cachedStudentStore) throw new Error('StudentStore not loaded');
  return cachedStudentStore;
}

export function getAcademicStoreSync(): AcademicStore {
  if (!cachedAcademicStore) throw new Error('AcademicStore not loaded');
  return cachedAcademicStore;
}

export function getSystemStoreSync(): SystemStore {
  if (!cachedSystemStore) throw new Error('SystemStore not loaded');
  return cachedSystemStore;
}

export function getSettingsStoreSync(): SettingsStore {
  if (!cachedSettingsStore) {
    throw new Error('SettingsStore not loaded yet. Use getSettingsStore() or ensure it\'s imported in App.');
  }
  return cachedSettingsStore;
}

// Pre-load all stores (call this once in main.tsx after React is ready)
export async function preloadAllStores(): Promise<void> {
  // Phase 1: Domain stores (student, academic, system) — load in parallel
  try {
    await Promise.all([
      getStudentStore(),
      getAcademicStore(),
      getSystemStore(),
    ]);
  } catch (err) {
    logger.error('[lazyStores] failed loading domain stores', err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
  logger.debug('[lazyStores] domain stores loaded');

  // Phase 2: UI store
  try {
    await getUIStore();
  } catch (err) {
    logger.error('[lazyStores] failed loading ui store', err instanceof Error ? err : new Error(String(err)));
    throw err;
  }

  // Phase 3: Settings store
  try {
    await getSettingsStore();
  } catch (err) {
    logger.error('[lazyStores] failed loading settings store', err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}

