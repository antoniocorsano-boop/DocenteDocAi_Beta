// riskMonitor.ts
// Monitora rischi e policy violation in tempo reale

import type { SystemActivity, RiskAlert } from "./types";

const EXPLAINABILITY_THRESHOLD = 0.7;
const OVERRIDE_THRESHOLD = 0.3;

let _alertCounter = 0;
function nextId(): string {
  return `alert_${Date.now()}_${_alertCounter++}`;
}

export function monitorRisks(activities: SystemActivity[]): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const now = new Date().toISOString();

  // CRITICAL: violazioni GDPR
  const gdprViolations = activities.filter(a => a.gdprViolation);
  if (gdprViolations.length > 0) {
    alerts.push({
      id: nextId(),
      type: "gdpr_violation",
      severity: "critical",
      message: `${gdprViolations.length} violazione/i GDPR rilevata/e — intervento immediato richiesto (GDPR Art. 33)`,
      timestamp: now,
    });
  }

  // CRITICAL: azioni a rischio critico non bloccate
  const unblockedCritical = activities.filter(a => a.riskLevel === "critical" && !a.blocked);
  if (unblockedCritical.length > 0) {
    alerts.push({
      id: nextId(),
      type: "unblocked_critical",
      severity: "critical",
      message: `${unblockedCritical.length} azione/i a rischio critico non bloccata/e (AI Act Art. 9)`,
      timestamp: now,
    });
  }

  // HIGH: azioni ad alto rischio senza approvazione umana
  const unapprovedHigh = activities.filter(
    a => a.riskLevel === "high" && !a.approved && !a.blocked,
  );
  if (unapprovedHigh.length > 0) {
    alerts.push({
      id: nextId(),
      type: "unapproved_high_risk",
      severity: "high",
      message: `${unapprovedHigh.length} azione/i ad alto rischio senza approvazione umana (AI Act Art. 14)`,
      timestamp: now,
    });
  }

  // MEDIUM: copertura spiegabilità insufficiente
  const explainRatio =
    activities.length > 0 ? activities.filter(a => a.explainable).length / activities.length : 1;
  if (explainRatio < EXPLAINABILITY_THRESHOLD) {
    alerts.push({
      id: nextId(),
      type: "low_explainability",
      severity: "medium",
      message: `Copertura spiegabilità AI: ${Math.round(explainRatio * 100)}% — soglia minima: ${EXPLAINABILITY_THRESHOLD * 100}% (AI Act Art. 13)`,
      timestamp: now,
    });
  }

  // LOW: alto tasso di override utente
  const overrideRate =
    activities.length > 0 ? activities.filter(a => a.userOverride).length / activities.length : 0;
  if (overrideRate > OVERRIDE_THRESHOLD) {
    alerts.push({
      id: nextId(),
      type: "high_override_rate",
      severity: "low",
      message: `Override utente: ${Math.round(overrideRate * 100)}% — valutare qualità suggerimenti AI`,
      timestamp: now,
    });
  }

  return alerts;
}
