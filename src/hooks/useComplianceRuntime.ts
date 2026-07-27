// src/hooks/useComplianceRuntime.ts
// React hook — valutazione live del Compliance Brain Runtime

import { useMemo, useCallback } from "react";
import { useComplianceStore }   from "../self-compliance/useComplianceStore";
import { buildContext }          from "../self-compliance/runtime/context/contextBuilder";
import { evaluateAllRules }      from "../self-compliance/runtime/evaluator/rulesEvaluator";
import type {
  ComplianceRuntimeResult,
  ComplianceViolation,
  RemediationAction,
} from "../self-compliance/runtime/types";

export type UseComplianceRuntimeReturn = {
  /** Risultato della valutazione live (sempre disponibile). */
  result:               ComplianceRuntimeResult;
  /** Shortcut: violazioni correnti. */
  violations:           ComplianceViolation[];
  /** Shortcut: score live 0–100. */
  liveScore:            number;
  /** Esegue un'azione di remediation automatica. */
  remediate:            (action: RemediationAction) => void;
};

export function useComplianceRuntime(): UseComplianceRuntimeReturn {
  const db       = useComplianceStore(s => s.db);
  const runCycle = useComplianceStore(s => s.runCycle);

  // La valutazione è pura: si ricalcola solo quando db cambia.
  const result = useMemo(() => {
    const ctx = buildContext(db);
    return evaluateAllRules(ctx);
  }, [db]);

  const remediate = useCallback(
    (action: RemediationAction) => {
      switch (action) {
        case "run_compliance_cycle":
          runCycle(new Date().toISOString().slice(0, 10));
          break;
        case "enable_human_approval":
          // L'ApprovalQueue è gestito da un altro store — qui si può solo loggare
          // che il tip è stato mostrato all'utente; l'azione real è manuale.
          console.info(
            "[ComplianceRuntime] Raccomandazione: abilitare ApprovalQueueStore " +
            "per le azioni high-risk nel CopilotBrain.",
          );
          break;
        case "export_audit":
          // L'export avviene via complianceStore.exportAudit() — delegato alla UI
          break;
        case "contact_dpo":
          // Non automatizzabile — notifica visiva nella UI
          break;
      }
    },
    [runCycle],
  );

  return {
    result,
    violations: result.violations,
    liveScore:  result.liveScore,
    remediate,
  };
}
