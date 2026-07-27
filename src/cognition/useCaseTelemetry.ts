/**
 * useCaseTelemetry.ts — Use Case Telemetry Layer.
 *
 * Assigns every runtime event to its operational use case (UC-*),
 * enabling auditors and product analysts to answer:
 *   "What use cases are actually used?"
 *   "Where does compliance break down?"
 *   "Which UC contributes the most to audit score improvement?"
 *
 * Architecture:
 *   - Pure module — no React, no side-effects on import
 *   - Persists a capped event log in localStorage (append-only)
 *   - Re-uses enterpriseAuditLog for cross-correlation by useCaseId
 *   - Zero dependency on UI layer
 *
 * Use case identifiers (stable — match USE_CASES_OPERATIVI_2026.md):
 *   UC-P1  Pianificazione annuale assistita da AI
 *   UC-P2  Creazione UDA con mapping competenze
 *   UC-E1  Registro presenze e annotazioni
 *   UC-E2  Lezione con assistant panel
 *   UC-E3  Raccomandazioni curricolari AI
 *   UC-V1  Inserimento valutazioni e griglia classe
 *   UC-V2  Predizione rischio abbandono
 *   UC-V3  Valutazione per competenze e e-Portfolio
 *   UC-R1  Monitoraggio compliance in tempo reale
 *   UC-R2  Simulazione audit PA con verbale
 *   UC-R3  Nomina ruoli AI Act + GDPR
 *   UC-R4  Brain Dashboard: azione primaria + audit trail
 *   UC-R5  Elaborazione documento normativo (HITL)
 */

// ── Public types ──────────────────────────────────────────────────────────────

export type UseCaseId =
  | 'UC-P1' | 'UC-P2'
  | 'UC-E1' | 'UC-E2' | 'UC-E3'
  | 'UC-V1' | 'UC-V2' | 'UC-V3'
  | 'UC-R1' | 'UC-R2' | 'UC-R3' | 'UC-R4' | 'UC-R5';

export type UseCaseOutcome =
  | 'started'         // use case interaction initiated
  | 'completed'       // user completed the primary flow
  | 'abandoned'       // user left mid-flow
  | 'ai_generated'    // AI produced output for this UC
  | 'compliance_ok'   // compliance gate passed for this UC
  | 'compliance_fail' // compliance gate failed for this UC
  | 'approved'        // HITL approval granted
  | 'rejected'        // HITL approval rejected
  | 'evidence_created'// audit evidence produced
  | 'error';          // unexpected failure

export interface UseCaseEvent {
  /** Stable identifier for this telemetry entry */
  id:              string;
  /** ISO 8601 timestamp */
  timestamp:       string;
  /** Use case that generated this event */
  useCaseId:       UseCaseId;
  /** Semantic outcome */
  outcome:         UseCaseOutcome;
  /**
   * Delta applied to the compliance score by this event.
   * Positive = improvement, negative = degradation, 0 = neutral.
   * Range: -100 to +100 (same scale as liveScore).
   */
  complianceDelta: number;
  /** Free-form payload — sanitised before storage (no credentials) */
  details:         Record<string, unknown>;
}

export interface UseCaseSummary {
  useCaseId:          UseCaseId;
  totalEvents:        number;
  completed:          number;
  abandoned:          number;
  aiGenerations:      number;
  complianceFailures: number;
  evidenceCreated:    number;
  avgComplianceDelta: number;
  lastUsed:           string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'uc_telemetry_v1';
const MAX_EVENTS  = 2000;
const TRIM_TO     = 1600;

/** Human-readable label for every use case */
export const USE_CASE_LABELS: Record<UseCaseId, string> = {
  'UC-P1': 'Pianificazione annuale assistita da AI',
  'UC-P2': 'Creazione UDA con mapping competenze',
  'UC-E1': 'Registro presenze e annotazioni',
  'UC-E2': 'Lezione con assistant panel',
  'UC-E3': 'Raccomandazioni curricolari AI',
  'UC-V1': 'Inserimento valutazioni e griglia classe',
  'UC-V2': 'Predizione rischio abbandono',
  'UC-V3': 'Valutazione per competenze e e-Portfolio',
  'UC-R1': 'Monitoraggio compliance in tempo reale',
  'UC-R2': 'Simulazione audit PA con verbale',
  'UC-R3': 'Nomina ruoli AI Act + GDPR',
  'UC-R4': 'Brain Dashboard: azione primaria + audit trail',
  'UC-R5': 'Elaborazione documento normativo (HITL)',
};

/** All UC identifiers in canonical order */
export const ALL_USE_CASE_IDS: UseCaseId[] = Object.keys(USE_CASE_LABELS) as UseCaseId[];

// ── Helpers ───────────────────────────────────────────────────────────────────

function nanoid(): string {
  return `uct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const REDACT_KEYS = /pass(word)?|token|secret|key|credential|auth|bearer|api_key/i;

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = REDACT_KEYS.test(k) ? '[REDACTED]' : v;
  }
  return out;
}

function load(): UseCaseEvent[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UseCaseEvent[]) : [];
  } catch {
    return [];
  }
}

function save(events: UseCaseEvent[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  } catch { /* storage quota — silent */ }
}

// ── Core API ─────────────────────────────────────────────────────────────────

/**
 * Record a telemetry event for a use case interaction.
 *
 * @param useCaseId       - Stable UC identifier (e.g. "UC-V1")
 * @param outcome         - Semantic result of the interaction
 * @param complianceDelta - Score change contributed by this event (default 0)
 * @param details         - Additional context (sanitised before persistence)
 *
 * @example
 * trackUseCase('UC-V1', 'completed', 0, { studentCount: 22 });
 * trackUseCase('UC-R2', 'compliance_ok', +5, { scenarioId: 'live' });
 */
export function trackUseCase(
  useCaseId:       UseCaseId,
  outcome:         UseCaseOutcome,
  complianceDelta: number = 0,
  details:         Record<string, unknown> = {},
): void {
  const event: UseCaseEvent = {
    id:              nanoid(),
    timestamp:       new Date().toISOString(),
    useCaseId,
    outcome,
    complianceDelta,
    details:         sanitize(details),
  };
  const events = load();
  events.push(event);
  const trimmed = events.length > MAX_EVENTS ? events.slice(-TRIM_TO) : events;
  save(trimmed);
}

// ── Query API ─────────────────────────────────────────────────────────────────

/** Returns all telemetry events, newest last. */
export function getAllEvents(): UseCaseEvent[] {
  return load();
}

/** Returns the last N events. */
export function getLastEvents(n: number): UseCaseEvent[] {
  return load().slice(-n);
}

/** Returns all events for a specific use case. */
export function getEventsByUseCase(id: UseCaseId): UseCaseEvent[] {
  return load().filter(e => e.useCaseId === id);
}

/** Returns all events with a specific outcome. */
export function getEventsByOutcome(outcome: UseCaseOutcome): UseCaseEvent[] {
  return load().filter(e => e.outcome === outcome);
}

/**
 * Builds a per-use-case summary for dashboards and audit reports.
 * Covers all 13 use cases regardless of whether they have events.
 */
export function buildUseCaseSummaries(): UseCaseSummary[] {
  const events = load();
  return ALL_USE_CASE_IDS.map((useCaseId) => {
    const uc = events.filter(e => e.useCaseId === useCaseId);
    const deltas = uc.map(e => e.complianceDelta).filter(d => d !== 0);
    const lastEvent = uc.length > 0 ? uc[uc.length - 1] : null;
    return {
      useCaseId,
      totalEvents:        uc.length,
      completed:          uc.filter(e => e.outcome === 'completed').length,
      abandoned:          uc.filter(e => e.outcome === 'abandoned').length,
      aiGenerations:      uc.filter(e => e.outcome === 'ai_generated').length,
      complianceFailures: uc.filter(e => e.outcome === 'compliance_fail').length,
      evidenceCreated:    uc.filter(e => e.outcome === 'evidence_created').length,
      avgComplianceDelta: deltas.length > 0
        ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
        : 0,
      lastUsed:           lastEvent?.timestamp ?? null,
    };
  });
}

/**
 * Returns the top N use cases ranked by total event count.
 * Useful for "most used features" analytics.
 */
export function getTopUsedCases(n: number = 5): UseCaseSummary[] {
  return buildUseCaseSummaries()
    .filter(s => s.totalEvents > 0)
    .sort((a, b) => b.totalEvents - a.totalEvents)
    .slice(0, n);
}

/**
 * Returns use cases with 1+ compliance failures, ranked by failure count desc.
 * Useful for "where does compliance break?" audit insight.
 */
export function getComplianceHotspots(): UseCaseSummary[] {
  return buildUseCaseSummaries()
    .filter(s => s.complianceFailures > 0)
    .sort((a, b) => b.complianceFailures - a.complianceFailures);
}

/**
 * Cumulative compliance delta across the entire event history.
 * Positive = the teacher's interactions improved compliance overall.
 */
export function getCumulativeComplianceDelta(): number {
  return load().reduce((acc, e) => acc + e.complianceDelta, 0);
}

/** Clears all telemetry events — intended for testing only. */
export function _clearAll(): void {
  save([]);
}
