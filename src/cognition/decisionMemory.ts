/**
 * decisionMemory.ts — Single source of truth for the CopilotDoc brain state.
 *
 * Stores:
 *   signals[]        — SystemSignals emitted by agents (capped at MAX_SIGNALS)
 *   complianceStatus — GDPR / AgID compliance flags (drives TIER_0 rules)
 *   activeFlows      — IDs of Enterprise workflow sessions in progress
 *
 * Architecture rules:
 *   - This module does NOT import from services/enterprise (avoids circular deps).
 *   - Orchestrator imports this module. One-way dependency only.
 *   - Signal consumers (getNextAction, chat router) pull state via getState().
 *   - Persists to localStorage `cognition_decision_memory_v1`.
 */

import type { SystemSignal, SystemSignalType } from './signals';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cognition_decision_memory_v1';
const MAX_SIGNALS  = 100;
const TRIM_TO      = 80;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ComplianceSlot = 'ok' | 'warning' | 'critical';

export interface DecisionMemoryState {
  signals:          SystemSignal[];
  complianceStatus: { gdpr: ComplianceSlot; agid: ComplianceSlot };
  activeFlows:      string[];
}

type SignalListener = (signal: SystemSignal) => void;

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultState(): DecisionMemoryState {
  return {
    signals:          [],
    complianceStatus: { gdpr: 'ok', agid: 'ok' },
    activeFlows:      [],
  };
}

function safeLoad(): DecisionMemoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<DecisionMemoryState>;
    return {
      signals:          Array.isArray(parsed.signals) ? parsed.signals : [],
      complianceStatus: parsed.complianceStatus ?? { gdpr: 'ok', agid: 'ok' },
      activeFlows:      Array.isArray(parsed.activeFlows) ? parsed.activeFlows : [],
    };
  } catch {
    return defaultState();
  }
}

function safeSave(state: DecisionMemoryState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage quota or unavailable in SSR/Node */ }
}

// ── Class ─────────────────────────────────────────────────────────────────────

class DecisionMemoryImpl {
  private _state:     DecisionMemoryState = safeLoad();
  private _listeners: SignalListener[]    = [];

  // ── Read API ────────────────────────────────────────────────────────────────

  /** Returns a snapshot of the full state. */
  getState(): Readonly<DecisionMemoryState> {
    return this._state;
  }

  /** All stored signals, newest last. */
  getSignals(): readonly SystemSignal[] {
    return this._state.signals;
  }

  /** Only signals with severity === 'critical'. */
  getCriticalSignals(): SystemSignal[] {
    return this._state.signals.filter(s => s.severity === 'critical');
  }

  /** Signals filtered by type. */
  getSignalsByType(type: SystemSignalType): SystemSignal[] {
    return this._state.signals.filter(s => s.type === type);
  }

  /** IDs of Enterprise workflow sessions currently in progress. */
  getActiveFlows(): readonly string[] {
    return this._state.activeFlows;
  }

  // ── Write API ───────────────────────────────────────────────────────────────

  /**
   * Emit a signal from an agent or system component.
   * Trims the oldest signals when capacity is exceeded.
   * Notifies all registered listeners.
   */
  emitSignal(
    signal: Omit<SystemSignal, 'id' | 'timestamp'> & { id?: string; timestamp?: number },
  ): void {
    const full: SystemSignal = {
      id:        signal.id ?? `sig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: signal.timestamp ?? Date.now(),
      ...signal,
    };

    if (this._state.signals.length >= MAX_SIGNALS) {
      this._state.signals = this._state.signals.slice(-TRIM_TO);
    }

    this._state = { ...this._state, signals: [...this._state.signals, full] };
    this._persist();

    for (const l of this._listeners) {
      try { l(full); } catch { /* ignore listener errors */ }
    }
  }

  /**
   * Update GDPR / AgID compliance flags.
   * A 'critical' value surfaces as a TIER_0 decision rule.
   */
  updateComplianceStatus(
    status: Partial<{ gdpr: ComplianceSlot; agid: ComplianceSlot }>,
  ): void {
    this._state = {
      ...this._state,
      complianceStatus: { ...this._state.complianceStatus, ...status },
    };
    this._persist();
  }

  /** Mark a workflow session as active (in-progress). */
  addActiveFlow(flowId: string): void {
    if (this._state.activeFlows.includes(flowId)) return;
    this._state = { ...this._state, activeFlows: [...this._state.activeFlows, flowId] };
    this._persist();
  }

  /** Mark a workflow session as completed / removed. */
  removeActiveFlow(flowId: string): void {
    this._state = {
      ...this._state,
      activeFlows: this._state.activeFlows.filter(f => f !== flowId),
    };
    this._persist();
  }

  /** Clear all signals, or only those of a specific type. */
  clearSignals(type?: SystemSignalType): void {
    this._state = {
      ...this._state,
      signals: type ? this._state.signals.filter(s => s.type !== type) : [],
    };
    this._persist();
  }

  // ── Observer ─────────────────────────────────────────────────────────────────

  /**
   * Subscribe to new signals.
   * @returns Unsubscribe function.
   */
  onSignal(listener: SignalListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private _persist(): void {
    safeSave(this._state);
  }
}

export const decisionMemory = new DecisionMemoryImpl();
