/**
 * decisionTimeline.ts — Sprint 12: Decisional Timeline Builder.
 *
 * Merges two sources into a unified DecisionEvent stream:
 *   1. decisionMemory.signals[]             → system/copilot events
 *   2. enterpriseAuditLog entries            → execution + compliance events
 *
 * Capabilities:
 *   - buildTimeline()        : returns merged, sorted, deduplicated events (max 15)
 *   - filterTimeline()       : slice by category ('normative' | 'studenti' | 'documenti')
 *   - clusterTimeline()      : group events within a 5-minute window
 *   - detectAnomalies()      : surface consecutive blocks, approval delay > 1h
 *
 * Architecture rules:
 *   - Pure functions only — no React, no hooks, no side-effects
 *   - Safe to call outside React (used by DecisionTimeline component + tests)
 *   - Does NOT import from services/enterprise to avoid circular deps;
 *     audit entries are passed in as a parameter
 */

import type { SystemSignal }           from './signals';
import type { EnterpriseAuditEntry }   from '../services/enterprise/enterpriseAuditLog';

// ── Public types ──────────────────────────────────────────────────────────────

export type DecisionResult         = 'executed' | 'blocked' | 'pending_approval';
export type DecisionSource         = 'user' | 'copilot' | 'system';
export type DecisionCategory       = 'normative' | 'studenti' | 'documenti' | 'sistema';
export type TimelineFilter         = 'all' | DecisionCategory;

export interface DecisionEvent {
  /** Stable unique id (from signal.id or auditEntry.id) */
  id:                  string;
  /** ISO 8601 */
  timestamp:           string;
  /** Human-readable Italian action title */
  action:              string;
  source:              DecisionSource;
  result:              DecisionResult;
  approvalRequired?:   boolean;
  complianceImpact?:   'none' | 'low' | 'high';
  /** Semantic category for filtering */
  category:            DecisionCategory;
  /** When true, this event should be highlighted in the timeline */
  isAnomaly?:          boolean;
  /** Optional description / extra detail */
  detail?:             string;
  /** Raw source reference */
  _sourceType:         'signal' | 'audit';
}

export interface ClusteredGroup {
  /** Window anchor = earliest event timestamp */
  windowStart: string;
  events:      DecisionEvent[];
  /** Summary label for collapsed clusters */
  summary:     string;
}

// ── Internal maps ─────────────────────────────────────────────────────────────

const SIGNAL_CATEGORY: Record<string, DecisionCategory> = {
  COMPLIANCE_UPDATE:  'normative',
  NEW_DOCUMENT:       'documenti',
  INTEGRATION_ERROR:  'sistema',
  PERFORMANCE_ALERT:  'studenti',
  MISSING_DATA:       'sistema',
  ACTION_EXECUTED:    'sistema',
  APPROVAL_REQUIRED:  'normative',
};

const SIGNAL_ACTION_LABEL: Record<string, string> = {
  COMPLIANCE_UPDATE:  'Aggiornamento conformità normativa',
  NEW_DOCUMENT:       'Nuovo documento normativo ricevuto',
  INTEGRATION_ERROR:  'Errore integrazione esterna',
  PERFORMANCE_ALERT:  'Alerta performance studenti',
  MISSING_DATA:       'Rilevazione dati mancanti',
  ACTION_EXECUTED:    'Azione eseguita',
  APPROVAL_REQUIRED:  'Richiesta approvazione HITL',
};

const AUDIT_RESULT: Record<string, DecisionResult> = {
  copilot_action_executed:     'executed',
  copilot_action_blocked:      'blocked',
  copilot_approval_submitted:  'pending_approval',
  automation_executed:         'executed',
  automation_soft_triggered:   'executed',
  automation_critical_triggered: 'pending_approval',
  approval_resolved:           'executed',
  kg_write_committed:          'executed',
  kg_write_rejected:           'blocked',
};

const AUDIT_CATEGORY: Record<string, DecisionCategory> = {
  copilot_action_executed:     'sistema',
  copilot_action_blocked:      'sistema',
  copilot_approval_submitted:  'normative',
  automation_executed:         'sistema',
  automation_soft_triggered:   'sistema',
  automation_critical_triggered: 'normative',
  approval_resolved:           'normative',
  kg_write_committed:          'documenti',
  kg_write_rejected:           'documenti',
  compliance_check:            'normative',
  report_generated:            'documenti',
};

const AUDIT_ACTION_LABEL: Record<string, string> = {
  copilot_action_executed:     'Azione Copilot eseguita',
  copilot_action_blocked:      'Azione Copilot bloccata dalla policy',
  copilot_approval_submitted:  'Richiesta approvazione inviata',
  automation_executed:         'Automazione eseguita',
  automation_soft_triggered:   'Automazione soft avviata',
  automation_critical_triggered: 'Automazione critica: in attesa approvazione',
  approval_resolved:           'Approvazione risolta',
  kg_write_committed:          'Documento scritto nel Knowledge Graph',
  kg_write_rejected:           'Scrittura KG rifiutata',
  compliance_check:            'Verifica conformità eseguita',
  report_generated:            'Report generato',
};

// ── Converters ────────────────────────────────────────────────────────────────

function signalToEvent(signal: SystemSignal): DecisionEvent {
  const result: DecisionResult =
    signal.type === 'APPROVAL_REQUIRED' ? 'pending_approval' :
    signal.type === 'INTEGRATION_ERROR' ? 'blocked'          : 'executed';

  const compliance: DecisionEvent['complianceImpact'] =
    signal.type === 'COMPLIANCE_UPDATE' || signal.type === 'APPROVAL_REQUIRED' ? 'high' :
    signal.type === 'NEW_DOCUMENT'      ? 'low'  : 'none';

  return {
    id:               signal.id,
    timestamp:        new Date(signal.timestamp).toISOString(),
    action:           signal.message || SIGNAL_ACTION_LABEL[signal.type] || signal.type,
    source:           'system',
    result,
    approvalRequired: signal.type === 'APPROVAL_REQUIRED',
    complianceImpact: compliance,
    category:         SIGNAL_CATEGORY[signal.type] ?? 'sistema',
    detail:           signal.message,
    _sourceType:      'signal',
  };
}

function auditToEvent(entry: EnterpriseAuditEntry): DecisionEvent | null {
  const result = AUDIT_RESULT[entry.action];
  if (!result) return null; // skip entry types we don't surface in the timeline

  const source: DecisionSource =
    entry.agentRole ? 'copilot' :
    (entry.details.userId && entry.details.userId !== 'anonymous') ? 'user' : 'system';

  return {
    id:               entry.id,
    timestamp:        entry.timestamp,
    action:           AUDIT_ACTION_LABEL[entry.action] || entry.action,
    source,
    result,
    approvalRequired: entry.action === 'copilot_approval_submitted' || entry.action === 'automation_critical_triggered',
    complianceImpact: (entry.complianceTags?.length ?? 0) > 0 ? 'low' : 'none',
    category:         AUDIT_CATEGORY[entry.action] ?? 'sistema',
    detail:           JSON.stringify(entry.details),
    _sourceType:      'audit',
  };
}

// ── Cluster helpers ───────────────────────────────────────────────────────────

const CLUSTER_WINDOW_MS = 5 * 60 * 1_000; // 5 minutes

function clusterLabel(events: DecisionEvent[]): string {
  const executed  = events.filter(e => e.result === 'executed').length;
  const blocked   = events.filter(e => e.result === 'blocked').length;
  const pending   = events.filter(e => e.result === 'pending_approval').length;
  const parts: string[] = [];
  if (executed) parts.push(`${executed} eseguite`);
  if (blocked)  parts.push(`${blocked} bloccate`);
  if (pending)  parts.push(`${pending} in attesa`);
  return parts.join(', ') || `${events.length} azioni`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a unified, sorted, deduplicated DecisionEvent list (max 15 items).
 *
 * @param signals     - From decisionMemory.getSignals()
 * @param auditEntries- From enterpriseAuditLog.getLast(50)
 */
export function buildTimeline(
  signals:      readonly SystemSignal[],
  auditEntries: EnterpriseAuditEntry[],
): DecisionEvent[] {
  const signalEvents: DecisionEvent[] = signals.map(signalToEvent);

  const auditEvents: DecisionEvent[] = auditEntries
    .map(auditToEvent)
    .filter((e): e is DecisionEvent => e !== null);

  // Merge + deduplicate by id
  const seen = new Set<string>();
  const all: DecisionEvent[] = [];
  for (const ev of [...signalEvents, ...auditEvents]) {
    if (!seen.has(ev.id)) {
      seen.add(ev.id);
      all.push(ev);
    }
  }

  // Sort newest first, then cap at 15
  return all
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);
}

/**
 * Filter events by category. 'all' returns everything.
 */
export function filterTimeline(
  events: DecisionEvent[],
  filter: TimelineFilter,
): DecisionEvent[] {
  if (filter === 'all') return events;
  return events.filter(e => e.category === filter);
}

/**
 * Cluster events that occur within a 5-minute window.
 * Returns groups, each containing 1+ events.
 */
export function clusterTimeline(events: DecisionEvent[]): ClusteredGroup[] {
  if (events.length === 0) return [];

  // Events are newest-first; reverse to group chronologically
  const chrono = [...events].reverse();
  const groups: ClusteredGroup[] = [];
  let current: DecisionEvent[] = [chrono[0]];

  for (let i = 1; i < chrono.length; i++) {
    const prev = new Date(current[current.length - 1].timestamp).getTime();
    const curr = new Date(chrono[i].timestamp).getTime();
    if (curr - prev <= CLUSTER_WINDOW_MS) {
      current.push(chrono[i]);
    } else {
      groups.push({ windowStart: current[0].timestamp, events: current, summary: clusterLabel(current) });
      current = [chrono[i]];
    }
  }
  groups.push({ windowStart: current[0].timestamp, events: current, summary: clusterLabel(current) });

  // Return newest cluster first
  return groups.reverse();
}

/**
 * Detect anomalies in the timeline and annotate them in-place.
 * Returns a new array with isAnomaly set where appropriate.
 *
 * Anomaly rules:
 *   - 2+ consecutive blocked events → flag each
 *   - pending_approval older than 1 hour → flag
 */
export function detectAnomalies(events: DecisionEvent[]): DecisionEvent[] {
  const ONE_HOUR_MS = 60 * 60 * 1_000;
  const now = Date.now();

  return events.map((ev, i, arr) => {
    // Rule 1: consecutive blocks
    const nextBlocked = arr[i + 1]?.result === 'blocked';
    const isConsecutiveBlock = ev.result === 'blocked' && nextBlocked;

    // Rule 2: stale pending approval
    const isStaleApproval =
      ev.result === 'pending_approval' &&
      now - new Date(ev.timestamp).getTime() > ONE_HOUR_MS;

    if (isConsecutiveBlock || isStaleApproval) {
      return { ...ev, isAnomaly: true };
    }
    return ev;
  });
}
