/**
 * schemaMigration.test.ts — unit tests for AISnapshot migration guard
 */
import { describe, it, expect } from 'vitest';
import {
  migrateAISnapshot,
  migrateSnapshotArray,
  MigrationError,
  AI_SNAPSHOT_SCHEMA_VERSION,
} from '../schemaMigration';

// ── v1 fixture ────────────────────────────────────────────────────────────────

const v1Snapshot = {
  id: '3A::2026-03-01',
  className: '3A',
  date: '2026-03-01',
  score: 72,
  grade: 'buono',
  riskCount: 3,
  excellenceCount: 2,
  // No schemaVersion
};

// ── v2 fixture (current) ──────────────────────────────────────────────────────

const v2Snapshot = {
  schemaVersion: 2 as const,
  id: '3B::2026-03-01',
  className: '3B',
  date: '2026-03-01',
  score: 80,
  grade: 'ottimo' as const,
  riskCount: 1,
  excellenceCount: 5,
  classAverage: 8.1,
  predictions: [],
};

// ── migrateAISnapshot ─────────────────────────────────────────────────────────

describe('migrateAISnapshot', () => {
  it('migrates a v1 snapshot to v2', () => {
    const result = migrateAISnapshot(v1Snapshot);
    expect(result.schemaVersion).toBe(AI_SNAPSHOT_SCHEMA_VERSION);
    expect(result.id).toBe(v1Snapshot.id);
    expect(result.className).toBe(v1Snapshot.className);
    expect(result.score).toBe(v1Snapshot.score);
    expect(result.grade).toBe(v1Snapshot.grade);
  });

  it('migrated v1 has classAverage defaulting to 0', () => {
    const result = migrateAISnapshot(v1Snapshot);
    expect(result.classAverage).toBe(0);
  });

  it('migrated v1 has predictions defaulting to []', () => {
    const result = migrateAISnapshot(v1Snapshot);
    expect(result.predictions).toEqual([]);
  });

  it('passes through a current v2 snapshot unchanged', () => {
    const result = migrateAISnapshot(v2Snapshot);
    expect(result).toEqual(v2Snapshot);
  });

  it('throws MigrationError for an unrecognized shape', () => {
    expect(() => migrateAISnapshot({ garbage: true })).toThrow(MigrationError);
  });

  it('throws MigrationError for null input', () => {
    expect(() => migrateAISnapshot(null)).toThrow(MigrationError);
  });

  it('throws MigrationError for a string input', () => {
    expect(() => migrateAISnapshot('invalid')).toThrow(MigrationError);
  });
});

// ── migrateSnapshotArray ──────────────────────────────────────────────────────

describe('migrateSnapshotArray', () => {
  it('migrates an array of mixed v1 and v2 snapshots', () => {
    const result = migrateSnapshotArray([v1Snapshot, v2Snapshot]);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.schemaVersion === AI_SNAPSHOT_SCHEMA_VERSION)).toBe(true);
  });

  it('silently discards corrupt items', () => {
    const result = migrateSnapshotArray([v1Snapshot, { garbage: true }, v2Snapshot]);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(migrateSnapshotArray([])).toEqual([]);
  });

  it('all returned items have schemaVersion = 2', () => {
    const result = migrateSnapshotArray([v1Snapshot, v1Snapshot, v2Snapshot]);
    expect(result.map((s) => s.schemaVersion)).toEqual([2, 2, 2]);
  });
});
