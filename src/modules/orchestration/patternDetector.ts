/**
 * orchestration/patternDetector.ts
 *
 * Rilevamento leggero di pattern sulle azioni dell'utente.
 *
 * Mantiene un log in memoria (max 20 voci) delle azioni eseguite attraverso
 * il ThumbMenu / executeAction. Se la stessa azione viene ripetuta ≥ 3 volte
 * negli ultimi 15 minuti, viene restituito un DetectedPattern come candidato
 * per la creazione di una skill emergente.
 *
 * Design:
 *  – Singleton module-level (no store Zustand — dati effimeri)
 *  – Puro sync — no side-effect
 *  – Non persiste: si azzera a ogni reload (intentional)
 */

import type { CognitiveDomain } from '../cognitiveLayer/types';
import type { OrbitBehaviorSignals } from '../../theme/orbitStates';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionLog {
  /** ctaType dell'azione eseguita (es. 'OPEN_REGISTER') */
  ctaType:   string;
  /** Dominio della entry contestuale */
  domain?:   CognitiveDomain;
  /** Tag della entry contestuale */
  tags?:     string[];
  /** Epoch ms dell'esecuzione */
  timestamp: number;
}

export interface DetectedPattern {
  /** ctaType ripetuto */
  ctaType:    string;
  /** Dominio più frequente nelle ripetizioni */
  domain?:    CognitiveDomain;
  /** Unione dei tag delle ripetizioni */
  tags:       string[];
  /** Numero di volte rilevate nella finestra */
  count:      number;
  /** Timestamp dell'ultima occorrenza */
  lastSeenAt: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_LOG_SIZE       = 20;
const PATTERN_WINDOW_MS  = 15 * 60 * 1_000;  // 15 minuti
const MIN_REPEAT_COUNT   = 3;
const DYNAMIC_PREFIX     = 'DYNAMIC_SKILL::';  // evita self-loop

// ─── State ────────────────────────────────────────────────────────────────────

let _log: ActionLog[] = [];

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Registra un'azione eseguita.
 * Chiamare da useThumbMenu.handleSelect dopo ogni esecuzione riuscita.
 */
export function recordAction(entry: ActionLog): void {
  _log = [..._log, entry].slice(-MAX_LOG_SIZE);
}

/** Returns a snapshot of the current in-memory action log (read-only). */
export function getActionLog(): readonly ActionLog[] {
  return _log;
}

/** Clears the in-memory action log (for testing). */
export function clearActionLog(): void {
  _log = [];
}

/**
 * Analizza il log e restituisce il primo pattern rilevabile, o null.
 *
 * Pattern = stesso ctaType ripetuto ≥ MIN_REPEAT_COUNT volte nella finestra.
 * I ctaType DYNAMIC_SKILL:: vengono ignorati per prevenire self-loop.
 */
export function detectPattern(): DetectedPattern | null {
  const cutoff = Date.now() - PATTERN_WINDOW_MS;
  const recent = _log.filter(e => e.timestamp >= cutoff && !e.ctaType.startsWith(DYNAMIC_PREFIX));

  if (recent.length < MIN_REPEAT_COUNT) return null;

  // Raggruppa per ctaType
  const buckets = new Map<string, ActionLog[]>();
  for (const entry of recent) {
    const list = buckets.get(entry.ctaType) ?? [];
    list.push(entry);
    buckets.set(entry.ctaType, list);
  }

  for (const [ctaType, entries] of buckets) {
    if (entries.length < MIN_REPEAT_COUNT) continue;

    const last = entries[entries.length - 1];
    const tags = [...new Set(entries.flatMap(e => e.tags ?? []))];

    // Dominio più frequente fra le occorrenze (default: domain dell'ultima)
    const domainFreq = new Map<string, number>();
    for (const e of entries) {
      if (e.domain) domainFreq.set(e.domain, (domainFreq.get(e.domain) ?? 0) + 1);
    }
    const topDomain = [...domainFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as CognitiveDomain | undefined;

    return {
      ctaType,
      domain:     topDomain ?? last.domain,
      tags,
      count:      entries.length,
      lastSeenAt: last.timestamp,
    };
  }

  return null;
}

// ─── Behavior Signal Derivation (P16) ─────────────────────────────────────────

/**
 * Classifies the user's current intent from the recent action log.
 *
 * Heuristic:
 *   - Many 'LOAD_*' / 'OPEN_*' / 'VIEW_*' → explore
 *   - Many 'MARK_*' / 'SAVE_*' / 'SUBMIT_*' / 'EXECUTE' → execute
 *   - Many 'GENERATE_*' / 'REVIEW_*' / 'ANALYZE_*' → learn
 *   - Sparse log → idle
 */
function detectIntent(): OrbitBehaviorSignals['userIntent'] {
  const cutoff = Date.now() - PATTERN_WINDOW_MS;
  const recent = _log.filter(e => e.timestamp >= cutoff);
  if (recent.length < 2) return 'idle';

  let explore = 0, execute = 0, learn = 0;
  for (const e of recent) {
    const t = e.ctaType.toUpperCase();
    if (/^(LOAD|OPEN|VIEW|BROWSE)/.test(t)) explore++;
    else if (/^(MARK|SAVE|SUBMIT|EXECUTE|START|SEND|EXPORT)/.test(t)) execute++;
    else if (/^(GENERATE|REVIEW|ANALYZE|PLAN|EVALUATE)/.test(t)) learn++;
  }

  const max = Math.max(explore, execute, learn);
  if (max === 0) return 'idle';
  if (max === explore) return 'explore';
  if (max === execute) return 'execute';
  return 'learn';
}

/**
 * Estimates task complexity from log diversity (unique domains + unique ctaTypes).
 *
 *   low:    1 domain, ≤ 3 unique actions
 *   medium: 2 domains or 4–6 unique actions
 *   high:   3+ domains or 7+ unique actions
 */
function estimateComplexity(): OrbitBehaviorSignals['taskComplexity'] {
  const cutoff = Date.now() - PATTERN_WINDOW_MS;
  const recent = _log.filter(e => e.timestamp >= cutoff);
  if (recent.length === 0) return 'low';

  const domains  = new Set(recent.map(e => e.domain).filter(Boolean)).size;
  const ctaTypes = new Set(recent.map(e => e.ctaType)).size;

  if (domains >= 3 || ctaTypes >= 7) return 'high';
  if (domains >= 2 || ctaTypes >= 4) return 'medium';
  return 'low';
}

/**
 * Computes a confidence score (0–1) based on pattern strength.
 *
 *   No recent actions          → 0.2 (cold start)
 *   Weak log (< MIN_REPEAT)    → 0.4
 *   Pattern detected           → 0.5 + 0.05 per repeat above min (max 0.95)
 */
function computeConfidence(): number {
  const pattern = detectPattern();
  if (!pattern) {
    return _log.length === 0 ? 0.2 : 0.4;
  }
  const extra = Math.max(0, pattern.count - MIN_REPEAT_COUNT);
  return Math.min(0.95, 0.5 + extra * 0.05);
}

/**
 * Returns the subset of OrbitBehaviorSignals that can be derived from the
 * in-memory action log. Used by UserWorkspace to build the full signals object
 * before calling `resolveAdaptivePresence`.
 *
 * Does NOT include `viewportWidth`, `ambientFiredCount`, or `activeAgentsCount`
 * — those must be provided by the caller.
 */
export function getBehaviorSignals(): Pick<
  OrbitBehaviorSignals,
  'userIntent' | 'taskComplexity' | 'agentConfidence'
> {
  return {
    userIntent:      detectIntent(),
    taskComplexity:  estimateComplexity(),
    agentConfidence: computeConfidence(),
  };
}

// ─── Interaction tracking (Fase 2.3) ─────────────────────────────────────────
// A lightweight ring buffer of entry-click timestamps used to compute
// "user activity density" for the cognitive load model.
// Separate from recordAction (which tracks completed actions) — this fires
// on every entry tap, including taps that open the menu but select nothing.

const INTERACTION_RING_SIZE = 60;
let _interactions: number[] = [];

/**
 * Records a user entry-click timestamp.
 * Call from handleEntryClick before any other logic so even bounced clicks
 * (landing intercepts, loading guards) are counted.
 */
export function recordInteraction(ts: number = Date.now()): void {
  _interactions = [..._interactions, ts].slice(-INTERACTION_RING_SIZE);
}

/**
 * Returns the number of interactions recorded within the last `windowMs` ms.
 * Default window: 60 seconds — covers one typical teacher micro-session.
 */
export function getRecentInteractionCount(windowMs = 60_000): number {
  const cutoff = Date.now() - windowMs;
  return _interactions.filter(t => t >= cutoff).length;
}
