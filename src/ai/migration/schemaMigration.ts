/**
 * schemaMigration.ts — Runtime migration guard for persisted AI data
 *
 * Handles safe migration of `AISnapshot` records across schema versions.
 * Called by `useAISnapshotStore` during Zustand hydration before the
 * data is used, ensuring no page-reload crash from stale localStorage.
 *
 * Version history:
 *   v1 — Original schema: { id, className, date, score, grade, riskCount, excellenceCount }
 *   v2 — Added: { schemaVersion, classAverage, predictions }
 *
 * Adding a new version:
 *   1. Increment AI_SNAPSHOT_SCHEMA_VERSION
 *   2. Add a migration function migrateVnToVn1 below
 *   3. Register it in MIGRATIONS map
 */

import type { AISnapshot } from '@/stores/useAISnapshotStore';
import type { HealthGrade } from '../classHealth/types';

// ── Version constant ──────────────────────────────────────────────────────────

export const AI_SNAPSHOT_SCHEMA_VERSION = 2 as const;
export type AISnapshotSchemaVersion = 1 | 2;

// ── V1 shape (legacy) ─────────────────────────────────────────────────────────

interface AISnapshotV1 {
  id: string;
  className: string;
  date: string;
  score: number;
  grade: HealthGrade;
  riskCount: number;
  excellenceCount: number;
  // No schemaVersion field
}

// ── Migration functions ───────────────────────────────────────────────────────

function migrateV1toV2(raw: AISnapshotV1): AISnapshot {
  return {
    schemaVersion: 2,
    id: raw.id,
    className: raw.className,
    date: raw.date,
    score: raw.score,
    grade: raw.grade,
    riskCount: raw.riskCount,
    excellenceCount: raw.excellenceCount,
    // New fields introduced in v2 — default to safe neutral values
    classAverage: 0,
    predictions: [],
  };
}

// ── Migration registry ────────────────────────────────────────────────────────

const MIGRATIONS: Record<number, (data: unknown) => AISnapshot> = {
  1: (raw) => migrateV1toV2(raw as AISnapshotV1),
};

// ── Type guard ────────────────────────────────────────────────────────────────

function isV1(raw: unknown): raw is AISnapshotV1 {
  if (typeof raw !== 'object' || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r['id'] === 'string' &&
    typeof r['className'] === 'string' &&
    typeof r['date'] === 'string' &&
    typeof r['score'] === 'number' &&
    typeof r['grade'] === 'string' &&
    typeof r['riskCount'] === 'number' &&
    typeof r['excellenceCount'] === 'number' &&
    r['schemaVersion'] === undefined
  );
}

function isCurrentVersion(raw: unknown): raw is AISnapshot {
  if (typeof raw !== 'object' || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return r['schemaVersion'] === AI_SNAPSHOT_SCHEMA_VERSION;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Migrates a raw persisted value to the current AISnapshot schema.
 *
 * Handles:
 *   - Already at current version → returned as-is (zero cost)
 *   - Detected as v1 → migrated via migrateV1toV2
 *   - Unknown version → throws MigrationError (caller should discard the record)
 *
 * @throws {MigrationError} when the raw value cannot be identified as any known version
 */
export function migrateAISnapshot(raw: unknown): AISnapshot {
  if (isCurrentVersion(raw)) return raw;
  if (isV1(raw)) return MIGRATIONS[1](raw);

  // Attempt version-numbered migration for future versions
  if (typeof raw === 'object' && raw !== null) {
    const version = (raw as Record<string, unknown>)['schemaVersion'];
    if (typeof version === 'number' && version in MIGRATIONS) {
      return MIGRATIONS[version](raw);
    }
  }

  throw new MigrationError(`Cannot migrate AISnapshot: unrecognized schema`, raw);
}

/**
 * Migrates an entire array of raw persisted snapshots.
 * Silently discards items that fail migration (corrupt data).
 */
export function migrateSnapshotArray(rawArray: unknown[]): AISnapshot[] {
  const result: AISnapshot[] = [];
  for (const item of rawArray) {
    try {
      result.push(migrateAISnapshot(item));
    } catch {
      // Discard unrecognizable records — do not crash the store
    }
  }
  return result;
}

// ── MigrationError ────────────────────────────────────────────────────────────

export class MigrationError extends Error {
  readonly rawValue: unknown;
  constructor(message: string, rawValue: unknown) {
    super(message);
    this.name = 'MigrationError';
    this.rawValue = rawValue;
  }
}
