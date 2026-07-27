// ComplianceAgent.ts
// Agente orchestratore Self-Compliance Engine.
// Delega al complianceApi per operazioni non-reattive.

import { complianceApi }  from "./complianceApi";
import { useComplianceStore } from "./useComplianceStore";
import type {
  SystemActivity,
  ComplianceReport,
  AuditExport,
  OpenDataExport,
} from "./types";

export class ComplianceAgent {
  /** Registra un'attività nel rolling log persistito. */
  logActivity(activity: SystemActivity): void {
    useComplianceStore.getState().logActivity(activity);
  }

  /** Esegue un ciclo completo: metriche → rischi → valutazione → report. */
  runComplianceCycle(period: string): ComplianceReport {
    return complianceApi.triggerCycle(period);
  }

  /** Esporta il pacchetto auditabile dell'ultimo report. */
  exportAudit(): AuditExport {
    return complianceApi.exportAudit();
  }

  /** Genera export open data anonimizzato per il periodo indicato. */
  getOpenData(period: string): OpenDataExport {
    return complianceApi.getOpenData(period);
  }
}

/** Istanza singleton pronta all'uso. */
export const complianceAgent = new ComplianceAgent();

