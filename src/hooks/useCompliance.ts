// src/hooks/useCompliance.ts
// React hook reattivo per Self-Compliance Engine

import { useCallback }         from "react";
import { useComplianceStore }  from "../self-compliance/useComplianceStore";
import type {
  ComplianceEvaluation,
  ComplianceMetrics,
  RiskAlert,
  ComplianceReport,
  SystemActivity,
  AuditExport,
  OpenDataExport,
} from "../self-compliance/types";

export type UseComplianceReturn = {
  /** Stato di conformità dall'ultimo snapshot (null se nessun ciclo ancora eseguito). */
  status:       ComplianceEvaluation | null;
  /** Metriche aggregate dall'ultimo snapshot. */
  metrics:      ComplianceMetrics | null;
  /** Ultimi 20 alert di rischio. */
  recentAlerts: RiskAlert[];
  /** Tutti i report storici. */
  reports:      ComplianceReport[];
  /** Ultimo report generato. */
  latestReport: ComplianceReport | null;
  /** Registra un'attività nel rolling log. */
  logActivity:  (activity: SystemActivity) => void;
  /** Esegue un ciclo di valutazione e ritorna il report. */
  runCycle:     (period: string) => ComplianceReport;
  /** Esporta il pacchetto di audit (JSON). */
  exportAudit:  () => AuditExport;
  /** Genera un export open data anonimizzato. */
  getOpenData:  (period: string) => OpenDataExport;
};

export function useCompliance(): UseComplianceReturn {
  const db              = useComplianceStore(s => s.db);
  const storeLog        = useComplianceStore(s => s.logActivity);
  const storeRun        = useComplianceStore(s => s.runCycle);
  const storeExport     = useComplianceStore(s => s.exportAudit);
  const storeOpenData   = useComplianceStore(s => s.getOpenData);

  const latestSnapshot  = db.snapshots[db.snapshots.length - 1] ?? null;
  const latestReport    = db.reports[db.reports.length - 1] ?? null;

  const logActivity = useCallback(
    (activity: SystemActivity) => storeLog(activity),
    [storeLog],
  );
  const runCycle = useCallback(
    (period: string) => storeRun(period),
    [storeRun],
  );
  const exportAudit = useCallback(
    () => storeExport(),
    [storeExport],
  );
  const getOpenData = useCallback(
    (period: string) => storeOpenData(period),
    [storeOpenData],
  );

  return {
    status:       latestSnapshot?.evaluation ?? null,
    metrics:      latestSnapshot?.metrics    ?? null,
    recentAlerts: db.riskAlerts.slice(-20),
    reports:      db.reports,
    latestReport,
    logActivity,
    runCycle,
    exportAudit,
    getOpenData,
  };
}
