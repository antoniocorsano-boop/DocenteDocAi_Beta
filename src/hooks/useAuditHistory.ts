// src/hooks/useAuditHistory.ts
// Hook per accedere alla storia degli audit PA e al Compliance Drift Detector.

import { useCallback }        from "react";
import { useAuditTrailStore } from "../self-compliance/runtime/audit/auditTrailStore";
import { detectDrift }        from "../self-compliance/runtime/audit/driftDetector";
import type { AuditRun, DriftReport } from "../self-compliance/runtime/audit";

export type UseAuditHistoryReturn = {
  /** Lista di tutti i run registrati (più recenti in testa) */
  runs:         AuditRun[];
  /** Drift calcolato confrontando gli ultimi due run production_live */
  drift:        DriftReport;
  /** Rimuove tutta la storia degli audit dal localStorage */
  clearHistory: () => void;
};

export function useAuditHistory(): UseAuditHistoryReturn {
  const runs         = useAuditTrailStore(s => s.runs);
  const clearHistory = useAuditTrailStore(s => s.clearHistory);

  const drift = detectDrift(runs);

  return {
    runs,
    drift,
    clearHistory: useCallback(clearHistory, [clearHistory]),
  };
}
