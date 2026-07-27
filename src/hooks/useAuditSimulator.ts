// src/hooks/useAuditSimulator.ts
// React hook — Simulatore Audit PA Live
// Gestisce lo scenario attivo e fornisce il PALiveAuditReport aggiornato al volo

import { useState, useMemo, useCallback }      from "react";
import { useComplianceStore }                   from "../self-compliance/useComplianceStore";
import { useAuditTrailStore }                   from "../self-compliance/runtime/audit/auditTrailStore";
import { runAuditSimulation, AUDIT_SCENARIOS }  from "../self-compliance/runtime/audit";
import type { PALiveAuditReport, AuditScenario, AuditRun } from "../self-compliance/runtime/audit";

export type UseAuditSimulatorReturn = {
  /** Report PA corrente — ricalcolato ogni volta che db o scenario cambiano */
  report:           PALiveAuditReport;
  /** ID dello scenario attivo */
  activeScenarioId: string;
  /** Lista scenari disponibili */
  scenarios:        AuditScenario[];
  /** Cambia lo scenario attivo */
  setScenario:      (id: string) => void;
  /** Torna allo stato di produzione reale */
  resetToLive:      () => void;
  /** Serializza il report come JSON pretty-printed */
  exportJSON:       () => string;
  /** Scarica il report come file .json */
  downloadJSON:     () => void;
  /** Registra il report corrente nel trail storico per drift detection */
  runAudit:         () => void;
};

export function useAuditSimulator(): UseAuditSimulatorReturn {
  const db = useComplianceStore(s => s.db);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("production_live");

  // Puro: ricalcolato solo quando db o scenarioId cambiano
  const report = useMemo(
    () => runAuditSimulation(db, activeScenarioId),
    [db, activeScenarioId],
  );

  const setScenario = useCallback((id: string) => setActiveScenarioId(id), []);
  const resetToLive = useCallback(() => setActiveScenarioId("production_live"), []);

  const exportJSON = useCallback((): string => {
    return JSON.stringify(report, null, 2);
  }, [report]);

  const downloadJSON = useCallback(() => {
    const json     = exportJSON();
    const blob     = new Blob([json], { type: "application/json" });
    const url      = URL.createObjectURL(blob);
    const anchor   = document.createElement("a");
    anchor.href    = url;
    anchor.download =
      `audit-pa-${report.scenarioId}-${report.auditDate.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [exportJSON, report.scenarioId, report.auditDate]);

  const addRun = useAuditTrailStore(s => s.addRun);

  const runAudit = useCallback((): void => {
    const run: AuditRun = {
      id:                     `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      runAt:                  report.auditDate,
      scenarioId:             activeScenarioId,
      scenarioLabel:          report.scenarioLabel,
      score:                  report.overallScore,
      blockingCount:          report.blockingCount,
      complianceStatus:       report.complianceStatus,
      certificationReadiness: report.certificationReadiness,
    };
    addRun(run);
  }, [addRun, report, activeScenarioId]);

  return {
    report,
    activeScenarioId,
    scenarios:   AUDIT_SCENARIOS,
    setScenario,
    resetToLive,
    exportJSON,
    downloadJSON,
    runAudit,
  };
}
