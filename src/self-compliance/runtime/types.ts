// runtime/types.ts
// Tipi core del Compliance Brain Runtime Engine

import type { UseCaseId } from '../../cognition/useCaseTelemetry';

// ── Context ───────────────────────────────────────────────────────────────────

/**
 * Snapshot dello stato del sistema necessario per la valutazione di ogni regola.
 * Viene derivato in modo deterministico dalla ComplianceDb ad ogni render.
 */
export type ComplianceContext = {
  // Metriche operative — derivate da collectMetrics(db.activities)
  totalActions:             number;
  gdprViolations:           number;
  explainabilityCoverage:   number;  // 0–1
  approvedHighRiskRatio:    number;  // approvedHigh / totalHigh (1.0 se nessuna azione)
  criticalUnblocked:        number;  // azioni critiche non bloccate
  overrideRate:             number;  // userOverrides / totalActions
  avgDecisionTimeMs:        number;
  // Fatti di sistema — determinati staticamente dalla configurazione attiva
  hasDataRetentionPolicy:   boolean; // dataRetention.ts attivo
  logsAreImmutable:         boolean; // complianceDb usa mutazioni immutabili
  hasBiasMonitoring:        boolean; // fairness audit — attualmente non implementato
  hasPrivacyConsent:        boolean; // PrivacyConsentModal attivo
  // Storico audit
  lastAuditDate:            Date | null;
  lastAuditDaysAgo:         number | null;
  lastReportStatus:         "compliant" | "warning" | "non_compliant" | null;
  /**
   * Operational use case that triggered this compliance evaluation.
   * When set, the audit engine propagates it to every AuditFinding
   * enabling "compliance failures per use case" analytics.
   */
  useCase?:                 UseCaseId;
};

// ── Rules ─────────────────────────────────────────────────────────────────────

export type RuleFramework = "GDPR" | "AI_ACT" | "AGID";

export type RuleSeverity = "low" | "medium" | "high" | "critical";

export type RuleResult = {
  pass: boolean;
  /** Messaggio di fallimento — set solo quando pass === false. */
  message?: string;
};

export type RemediationAction =
  | "enable_human_approval"
  | "run_compliance_cycle"
  | "export_audit"
  | "contact_dpo";

export type ComplianceRule = {
  id: string;
  framework: RuleFramework;
  article: string;
  description: string;
  severity: RuleSeverity;
  evaluate: (ctx: ComplianceContext) => RuleResult;
};

// ── Violations ────────────────────────────────────────────────────────────────

export type ComplianceViolation = {
  ruleId:            string;
  framework:         RuleFramework;
  article:           string;
  severity:          RuleSeverity;
  message:           string;
  suggestedFix:      string;
  remediationAction?: RemediationAction;
};

// ── Scoring ───────────────────────────────────────────────────────────────────

export type FrameworkScore = {
  framework: RuleFramework;
  weight:    number;  // 0–1 (GDPR 0.4, AI_ACT 0.4, AGID 0.2)
  passed:    number;
  total:     number;
  score:     number;  // 0–100
};

// ── Runtime result ────────────────────────────────────────────────────────────

export type ComplianceRuntimeResult = {
  evaluatedAt:    string;
  liveScore:      number;  // 0–100 weighted
  compliant:      boolean; // liveScore >= 80 AND no CRITICAL violations
  frameworkScores: Record<RuleFramework, FrameworkScore>;
  violations:     ComplianceViolation[];
  passedRules:    number;
  totalRules:     number;
};
