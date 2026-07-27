// complianceApi.ts
// Facade API non-reattiva per Self-Compliance Engine
// Per componenti React usa il hook useCompliance().

import { useComplianceStore } from "./useComplianceStore";
import type {
  ComplianceEvaluation,
  ComplianceMetrics,
  RiskAlert,
  ComplianceReport,
  AuditExport,
  OpenDataExport,
  ComplianceSnapshot,
} from "./types";

export const complianceApi = {
  /** Stato di conformità dall'ultimo snapshot. */
  getStatus(): ComplianceEvaluation | null {
    return complianceApi.getLatestSnapshot()?.evaluation ?? null;
  },

  /** Metriche aggregate dall'ultimo snapshot. */
  getMetrics(): ComplianceMetrics | null {
    return complianceApi.getLatestSnapshot()?.metrics ?? null;
  },

  /** Alert recenti (default: ultimi 20). */
  getRecentAlerts(limit = 20): RiskAlert[] {
    return useComplianceStore.getState().db.riskAlerts.slice(-limit);
  },

  /** Tutti i report storici. */
  getReports(): ComplianceReport[] {
    return useComplianceStore.getState().db.reports;
  },

  /** Ultimo report generato. */
  getLatestReport(): ComplianceReport | null {
    const { reports } = useComplianceStore.getState().db;
    return reports[reports.length - 1] ?? null;
  },

  /** Ultimo snapshot (metriche + evaluation). */
  getLatestSnapshot(): ComplianceSnapshot | null {
    const { snapshots } = useComplianceStore.getState().db;
    return snapshots[snapshots.length - 1] ?? null;
  },

  /** Avvia un ciclo di valutazione per il periodo indicato. */
  triggerCycle(period: string): ComplianceReport {
    return useComplianceStore.getState().runCycle(period);
  },

  /** Esporta il pacchetto di audit completo (JSON). */
  exportAudit(): AuditExport {
    return useComplianceStore.getState().exportAudit();
  },

  /** Genera export open data anonimizzato per il periodo indicato. */
  getOpenData(period: string): OpenDataExport {
    return useComplianceStore.getState().getOpenData(period);
  },
};
