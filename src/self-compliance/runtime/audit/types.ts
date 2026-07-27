// runtime/audit/types.ts
// Tipi specifici del Simulatore Audit PA Live

import type { RuleFramework, RemediationAction, ComplianceContext } from "../types";

// ── Severity PA (uppercase — stile verbale di revisore esterno) ────────────────

export type PASeverityLevel = "Low" | "Medium" | "High" | "Critical";

// ── Finding PA ────────────────────────────────────────────────────────────────

/**
 * Una singola criticità come la descriverebbe un revisore PA esterno.
 * Corrisponde a una ComplianceViolation arricchita con prospettiva PA.
 */
export type AuditFinding = {
  ruleId:            string;
  framework:         RuleFramework;
  article:           string;
  /** Descrizione tecnica della violazione */
  description:       string;
  /** Livello di gravità PA */
  severity:          PASeverityLevel;
  /**
   * true = bloccante per la certificazione PA (Critical o High).
   * Un sistema con ≥1 finding bloccante non è certificabile.
   */
  blocking:          boolean;
  /** Suggerimento tecnico concreto per risolvere il finding */
  suggestedFix:      string;
  remediationAction?: RemediationAction;
  /**
   * Nota che un revisore PA esterno scriverebbe nel verbale ufficiale.
   * Descrive l'impatto normativo e le conseguenze legali/operative.
   */
  paNote:            string;
  /** Evidenze tecniche verificabili — valori di sistema al momento dell'audit. */
  evidence:          string[];
  /**
   * Operational use case that generated or is most associated with this finding.
   * Maps to UseCaseId in useCaseTelemetry.ts (e.g. "UC-R1", "UC-V2").
   * Enables "audit per use case" analytics.
   */
  useCaseId?:        string;
};

// ── Scenario ──────────────────────────────────────────────────────────────────

/**
 * Uno scenario di simulazione: combina gli override del contesto
 * con metadati descrittivi per il selettore UI.
 */
export type AuditScenario = {
  id:          string;
  label:       string;
  description: string;
  /** Overrides parziali del ComplianceContext — spreading su buildContext(db) */
  overrides:   Partial<ComplianceContext>;
};

// ── Compliance status PA ──────────────────────────────────────────────────────

/** Stato di conformità formalizzato nel verbale PA */
export type ComplianceStatusPA =
  | "CONFORME"
  | "PARZIALMENTE_CONFORME"
  | "NON_CONFORME";

/** Grado di readiness per la certificazione PA */
export type CertificationReadiness =
  | "PRONTO"
  | "CONDIZIONATO"
  | "NON_PRONTO";

// ── PALiveAuditReport ─────────────────────────────────────────────────────────

/**
 * Struttura del report di audit PA — come apparirebbe un verbale di revisione esterna.
 * Compatibile con l'esempio JSON nel prompt.
 */
export type PALiveAuditReport = {
  auditDate:              string;              // ISO 8601
  auditType:              "simulato" | "live"; // live = produzione reale
  scenarioId:             string;
  scenarioLabel:          string;
  overallScore:           number;              // 0–100 weighted
  complianceStatus:       ComplianceStatusPA;
  certificationReadiness: CertificationReadiness;
  /** Score per framework (solo il valore numerico 0–100, non il dettaglio) */
  frameworkScores:        Record<RuleFramework, number>;
  totalRules:             number;
  passedRules:            number;
  /** Findings ordinati: bloccanti prima, poi migliorativi */
  findings:               AuditFinding[];
  blockingCount:          number;
  improvingCount:         number;
  /** Raccomandazioni contestuali generate dall'engine */
  recommendations:        string[];
  generatedBy:            string;
};

// ── Audit Trail ───────────────────────────────────────────────────────────────

/** Sommario di un singolo run di audit — salvato nello store persistent. */
export type AuditRun = {
  id:                      string;
  runAt:                   string;  // ISO 8601
  scenarioId:              string;
  scenarioLabel:           string;
  score:                   number;
  blockingCount:           number;
  complianceStatus:        ComplianceStatusPA;
  certificationReadiness:  CertificationReadiness;
};

// ── Drift Detection ───────────────────────────────────────────────────────────

export type DriftStatus = "improving" | "stable" | "degrading";

export type DriftReport = {
  status:        DriftStatus;
  /** Positivo = miglioramento, negativo = peggioramento */
  delta:         number;
  recentScore:   number;
  previousScore: number | null;
  message:       string;
};
