/**
 * auditDb.ts — IndexedDB persistence layer for AIAuditTrail records
 *
 * Uses Dexie.js (lightweight IDB wrapper) to persist audit records
 * across page reloads. Mirrors the in-memory ring-buffer in auditTrail.ts
 * as a durable L2 store.
 *
 * Schema:
 *   audits table — auto-increment primary key, indexed by className + date
 *
 * Limitations:
 *   - Max MAX_PER_CLASS records per class (oldest pruned on write)
 *   - IDB availability is not guaranteed (private browsing, storage quota)
 *     — all public functions catch silently so callers never need to try/catch
 */
import Dexie, { type Table } from 'dexie';
import type { AIAuditTrail } from './auditTypes';

// ── Schema ────────────────────────────────────────────────────────────────────

export interface PersistedAudit extends AIAuditTrail {
  /** Auto-increment IDB primary key */
  dbId?: number;
  /** Derived index: contextHash prefix (first 8 chars) for quick class lookup */
  classKey: string;
}

class AuditDatabase extends Dexie {
  audits!: Table<PersistedAudit, number>;

  constructor() {
    super('docentedoc-audit');
    this.version(1).stores({
      // ++dbId = auto-increment PK; classKey, startedAt are indexed
      audits: '++dbId, classKey, startedAt',
    });
  }
}

// Lazily instantiated so tests can import the module without hitting IDB
let _db: AuditDatabase | null = null;
function getDb(): AuditDatabase {
  if (!_db) _db = new AuditDatabase();
  return _db;
}

const MAX_PER_CLASS = 500;

// ── helpers ───────────────────────────────────────────────────────────────────

/** Derive a short class key from a context hash for use as an IDB index. */
function toClassKey(contextHash: string): string {
  // Use first 16 chars — good enough for grouping without using full hash
  return contextHash.slice(0, 16);
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Persists a sealed AIAuditTrail to IndexedDB.
 *
 * Fire-and-forget safe — caller should `.catch(() => undefined)` unless
 * it needs confirmation.
 *
 * Prunes the oldest records for the same classKey when > MAX_PER_CLASS entries.
 */
export async function persistAudit(trail: AIAuditTrail): Promise<void> {
  try {
    const db = getDb();
    const classKey = toClassKey(trail.contextHash);
    const record: PersistedAudit = { ...trail, classKey };
    await db.audits.add(record);

    // Prune: keep only MAX_PER_CLASS most recent for this classKey
    const all = await db.audits
      .where('classKey')
      .equals(classKey)
      .sortBy('startedAt');

    if (all.length > MAX_PER_CLASS) {
      const toDelete = all
        .slice(0, all.length - MAX_PER_CLASS)
        .map((r) => r.dbId)
        .filter((id): id is number => id !== undefined);
      await db.audits.bulkDelete(toDelete);
    }
  } catch {
    // IDB not available (private browsing, quota) — degrade gracefully
  }
}

/**
 * Retrieves all persisted audit records for a given context hash.
 * Returns an empty array if IDB is unavailable.
 */
export async function getPersistedAudits(contextHash: string): Promise<PersistedAudit[]> {
  try {
    const db = getDb();
    const classKey = toClassKey(contextHash);
    const records = await db.audits.where('classKey').equals(classKey).sortBy('startedAt');
    return records;
  } catch {
    return [];
  }
}

/**
 * Exports all persisted audit records as a JSON Blob, suitable for download.
 *
 * @param contextHash  Optional filter — if omitted, exports all records
 */
export async function exportAuditJSON(contextHash?: string): Promise<Blob> {
  try {
    const db = getDb();
    const records = contextHash
      ? await db.audits.where('classKey').equals(toClassKey(contextHash)).toArray()
      : await db.audits.toArray();
    const json = JSON.stringify(records, null, 2);
    return new Blob([json], { type: 'application/json' });
  } catch {
    return new Blob(['[]'], { type: 'application/json' });
  }
}

/**
 * Returns the most recent `limit` audit records across all classes.
 * Used by the Dev Tools Audit Viewer when no specific context hash is known.
 */
export async function getAllPersistedAudits(limit = 50): Promise<PersistedAudit[]> {
  try {
    const db = getDb();
    const all = await db.audits.orderBy('startedAt').reverse().limit(limit).toArray();
    return all;
  } catch {
    return [];
  }
}

/**
 * Deletes all audit records for a given context hash.
 * Used from the Dev Tools "Clear Audit" button.
 */
export async function clearPersistedAudits(contextHash?: string): Promise<void> {
  try {
    const db = getDb();
    if (contextHash) {
      await db.audits.where('classKey').equals(toClassKey(contextHash)).delete();
    } else {
      await db.audits.clear();
    }
  } catch {
    // silent
  }
}
