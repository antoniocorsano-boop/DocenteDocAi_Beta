// complianceDb.ts
// Schema DB e persistenza localStorage per Self-Compliance Engine

import type {
  ComplianceDb,
  SystemActivity,
  RiskAlert,
  ComplianceReport,
  ComplianceSnapshot,
} from "./types";

export const DB_STORAGE_KEY = "compliance_db_v1";

const MAX_ACTIVITIES = 1000;
const MAX_REPORTS    = 90;
const MAX_ALERTS     = 500;
const MAX_SNAPSHOTS  = 30;

// ── Factory ────────────────────────────────────────────────────────────────────

export function emptyDb(): ComplianceDb {
  return {
    activities: [],
    reports:    [],
    riskAlerts: [],
    snapshots:  [],
    version:    1,
  };
}

// ── Immutable mutations ────────────────────────────────────────────────────────

export function addActivity(db: ComplianceDb, activity: SystemActivity): ComplianceDb {
  const activities = [...db.activities, activity].slice(-MAX_ACTIVITIES);
  return { ...db, activities };
}

export function addReport(db: ComplianceDb, report: ComplianceReport): ComplianceDb {
  const reports = [...db.reports, report].slice(-MAX_REPORTS);
  return { ...db, reports };
}

export function addAlerts(db: ComplianceDb, alerts: RiskAlert[]): ComplianceDb {
  if (alerts.length === 0) return db;
  const riskAlerts = [...db.riskAlerts, ...alerts].slice(-MAX_ALERTS);
  return { ...db, riskAlerts };
}

export function addSnapshot(db: ComplianceDb, snapshot: ComplianceSnapshot): ComplianceDb {
  const snapshots = [...db.snapshots, snapshot].slice(-MAX_SNAPSHOTS);
  return { ...db, snapshots };
}

// ── Queries ────────────────────────────────────────────────────────────────────

export function getLatestReport(db: ComplianceDb): ComplianceReport | null {
  return db.reports[db.reports.length - 1] ?? null;
}

export function getLatestSnapshot(db: ComplianceDb): ComplianceSnapshot | null {
  return db.snapshots[db.snapshots.length - 1] ?? null;
}

export function getRecentAlerts(db: ComplianceDb, limit = 20): RiskAlert[] {
  return db.riskAlerts.slice(-limit);
}

export function getActivitiesByPeriod(
  db: ComplianceDb,
  from: Date,
  to: Date,
): SystemActivity[] {
  return db.activities.filter(a => {
    const ts = new Date(a.timestamp);
    return ts >= from && ts <= to;
  });
}
