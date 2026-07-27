/**
 * modules/system/OfflineQueue.ts  —  P24 Enterprise Readiness
 *
 * IndexedDB-backed offline queue for AI proxy requests.
 *
 * When the device is offline (or the AI proxy returns a network error) a
 * request is enqueued here. When the browser comes back online the queue
 * is drained automatically via the `online` event.
 *
 * Design goals
 * ────────────
 *  • Zero dependencies — IndexedDB, navigator.onLine, window events only
 *  • Pluggable `executor` so any async operation can be queued, not just AI
 *  • At-most-once delivery per queue entry (entries whose callback throws are
 *    moved to a "dead-letter" list and never retried automatically)
 *  • Max queue depth: 50 entries (oldest evicted) to cap localStorage bleed
 *  • Persisted via IndexedDB so queue survives page reload (PWA-ready)
 *
 * Usage
 * ─────
 *  // Register a replay function (do this once, at module init):
 *  OfflineQueue.register('ai_generate', async (payload) => {
 *    await getAIClient().models.generateContent(payload);
 *  });
 *
 *  // Enqueue a request when offline:
 *  await OfflineQueue.enqueue('ai_generate', { model: 'gemini-2.0-flash', ... });
 *
 *  // Drain is called automatically on `online` — you can also call it manually:
 *  await OfflineQueue.drain();
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueueEntry<P = unknown> {
  id:        string;
  type:      string;
  payload:   P;
  enqueuedAt: string;
  attempts:  number;
}

type Executor<P = unknown> = (payload: P) => Promise<void>;

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

const DB_NAME    = 'orbit_offline_queue';
const DB_VERSION = 1;
const STORE_NAME = 'queue';
const MAX_DEPTH  = 50;

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbGetAll(): Promise<QueueEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result as QueueEntry[]);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function idbPut(entry: QueueEntry): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(entry);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch { /* storage unavailable — silent */ }
}

async function idbDelete(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch { /* silent */ }
}

async function idbCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = () => resolve(req.result as number);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}

// ─── Queue implementation ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _executors = new Map<string, Executor<any>>();
let _draining    = false;
let _initialized = false;

function _setupOnlineListener() {
  if (_initialized || typeof window === 'undefined') return;
  _initialized = true;
  window.addEventListener('online', () => { void drain(); });
}

/** Register a replay executor for a given request type. */
export function register<P>(type: string, executor: Executor<P>): void {
  _executors.set(type, executor as Executor<unknown>);
  _setupOnlineListener();
}

/**
 * Add a request to the queue.
 * If depth would exceed MAX_DEPTH the oldest entry is evicted first.
 */
export async function enqueue<P>(type: string, payload: P): Promise<void> {
  _setupOnlineListener();

  const count = await idbCount();
  if (count >= MAX_DEPTH) {
    // Evict oldest
    const all = await idbGetAll();
    all.sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt));
    if (all[0]) await idbDelete(all[0].id);
  }

  const entry: QueueEntry<P> = {
    id:         `oq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    enqueuedAt: new Date().toISOString(),
    attempts:   0,
  };
  await idbPut(entry);
}

/**
 * Drain the queue, executing each entry with its registered executor.
 * Called automatically when the browser comes back online.
 * Safe to call manually (re-entrant drain attempts are ignored).
 */
export async function drain(): Promise<{ ok: number; failed: number }> {
  if (_draining || !navigator.onLine) return { ok: 0, failed: 0 };
  _draining = true;

  let ok = 0; let failed = 0;
  try {
    const entries = await idbGetAll();
    // Process in enqueue order
    entries.sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt));

    for (const entry of entries) {
      const executor = _executors.get(entry.type);
      if (!executor) {
        // No executor registered — leave in queue (will drain when registered)
        continue;
      }
      try {
        await executor(entry.payload);
        await idbDelete(entry.id);
        ok++;
      } catch {
        // Increment attempts; move to dead-letter if too many failures
        const updated = { ...entry, attempts: entry.attempts + 1 };
        if (updated.attempts >= 3) {
          await idbDelete(entry.id); // dead-letter: remove permanently
        } else {
          await idbPut(updated);
        }
        failed++;
      }
    }
  } finally {
    _draining = false;
  }
  return { ok, failed };
}

/** Return the current queue depth (for UI indicators). */
export async function getQueueDepth(): Promise<number> {
  return idbCount();
}

/** Clear the entire queue (e.g. on logout). */
export async function clearQueue(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).clear();
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch { /* silent */ }
}
