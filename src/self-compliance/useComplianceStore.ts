// useComplianceStore.ts
// Zustand store con persist per Self-Compliance Engine

import { create }                  from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { collectMetrics }          from "./metricsCollector";
import { monitorRisks }            from "./riskMonitor";
import { evaluateCompliance }      from "./complianceBrain";
import { generateComplianceReport } from "./reportGenerator";
import { exportAuditPackage }      from "./auditExporter";
import { publishOpenData }         from "./openDataPublisher";
import {
  emptyDb,
  addActivity,
  addReport,
  addAlerts,
  addSnapshot,
} from "./complianceDb";
import type {
  ComplianceDb,
  SystemActivity,
  ComplianceReport,
  AuditExport,
  OpenDataExport,
  ComplianceSnapshot,
} from "./types";

// ── Store shape ────────────────────────────────────────────────────────────────

interface ComplianceState {
  db: ComplianceDb;
  /** Registra una nuova attività nel rolling log. */
  logActivity:  (activity: SystemActivity) => void;
  /** Esegue un ciclo completo di valutazione e salva il report. */
  runCycle:     (period: string) => ComplianceReport;
  /** Esporta il pacchetto di audit dell'ultimo report disponibile. */
  exportAudit:  () => AuditExport;
  /** Genera un export open data per il periodo indicato. */
  getOpenData:  (period: string) => OpenDataExport;
  /** Azzera il DB (solo per test / reset manuale). */
  resetDb:      () => void;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useComplianceStore = create<ComplianceState>()(
  persist(
    (set, get) => ({
      db: emptyDb(),

      logActivity(activity: SystemActivity): void {
        set(state => ({ db: addActivity(state.db, activity) }));
      },

      runCycle(period: string): ComplianceReport {
        const { db } = get();

        const metrics    = collectMetrics(db.activities);
        const risks      = monitorRisks(db.activities);
        const evaluation = evaluateCompliance(metrics, risks);
        const report     = generateComplianceReport(period, metrics, evaluation);

        const snapshot: ComplianceSnapshot = {
          id:        `snap_${Date.now()}`,
          timestamp: new Date().toISOString(),
          metrics,
          evaluation,
        };

        set(state => ({
          db: addSnapshot(
            addAlerts(addReport(state.db, report), risks),
            snapshot,
          ),
        }));

        return report;
      },

      exportAudit(): AuditExport {
        const { db } = get();
        const latestReport = db.reports[db.reports.length - 1];
        if (!latestReport) {
          return { json: JSON.stringify({ error: "Nessun report disponibile" }) };
        }
        const latestSnapshot = db.snapshots[db.snapshots.length - 1];
        return exportAuditPackage(latestReport, latestSnapshot?.evaluation.confidenceScore);
      },

      getOpenData(period: string): OpenDataExport {
        const metrics = collectMetrics(get().db.activities);
        return publishOpenData(period, metrics);
      },

      resetDb(): void {
        set({ db: emptyDb() });
      },
    }),
    {
      name:    "compliance_db_v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
