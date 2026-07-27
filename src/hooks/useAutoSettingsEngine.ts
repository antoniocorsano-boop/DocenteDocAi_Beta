/**
 * hooks/useAutoSettingsEngine.ts
 *
 * React hook che esegue il motore di auto-configurazione Jarvis.
 *
 * – Scansiona ogni 45 secondi (+ al mount + on cognitive store update).
 * – Delta con confidence ≥ 0.88 vengono applicati silenziosamente con toast.
 * – Delta con confidence < 0.88 vengono attesi nella coda "pending".
 * – I dismissed vengono persistiti in localStorage (sopravvivono ai reload).
 * – Gli applied vengono persistiti in sessionStorage (resettati al reload).
 *
 * È l'unico punto che chiama setThemeState / updateSettings / setAiSettings.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  computeAutoDeltas,
  type AutoSettingsDelta,
} from '../modules/autoSettings/autoSettingsEngine';
import {
  isLowRisk,
  effectiveConfidence,
} from '../modules/trust/trustEngine';
import { useCognitiveStore }       from '../modules/cognitiveLayer/cognitiveStore';
import { useSettingsStore }        from '../stores/useSettingsStore';
import { useTrustStore }           from '../stores/useTrustStore';
import { useUIStore }              from '../stores/useUIStore';
import { useUserBehaviorStore }    from '../stores/useUserBehaviorStore';
import type { AppThemeState, AiSettings } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const SCAN_INTERVAL_MS       = 45_000;
/** Tier 1: applica silenziosamente senza toast né card (true stealth). */
const STEALTH_THRESHOLD      = 0.92;
/** Tier 2: applica con toast breve, nessuna card nel Nexus. */
const AUTO_APPLY_THRESHOLD   = 0.85;
const DISMISSED_KEY          = 'jarvis_aset_dismissed_v1';
const APPLIED_SESSION_KEY    = 'jarvis_aset_applied_session';

// ─── Persistence helpers ──────────────────────────────────────────────────────

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>): void {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  } catch { /* quota exceeded — non-critical */ }
}

function loadApplied(): Set<string> {
  try {
    const raw = sessionStorage.getItem(APPLIED_SESSION_KEY);
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveApplied(set: Set<string>): void {
  try {
    sessionStorage.setItem(APPLIED_SESSION_KEY, JSON.stringify([...set]));
  } catch { /* non-critical */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface UseAutoSettingsEngineReturn {
  /** Delta in attesa di conferma utente (confidence < AUTO_APPLY_THRESHOLD). */
  pending:       AutoSettingsDelta[];
  /** IDs applicati in questa sessione (autoapply + manuali). */
  appliedIds:    string[];
  /** Quante volte Jarvis ha agito in stealth questa sessione. */
  stealthCount:  number;
  /** Applica manualmente un delta e lo marca come applicato. */
  applyDelta:    (id: string) => void;
  /** Ignora un delta per sempre (persiste a localStorage). */
  dismissDelta:  (id: string) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAutoSettingsEngine(tenantId: string): UseAutoSettingsEngineReturn {
  const [pending,      setPending]      = useState<AutoSettingsDelta[]>([]);
  const [appliedIds,   setAppliedIds]   = useState<string[]>(() => [...loadApplied()]);
  const [stealthCount, setStealthCount] = useState(0);

  // Use refs to avoid stale closures in the scan callback
  const dismissedRef    = useRef<Set<string>>(loadDismissed());
  const appliedIdsRef   = useRef<Set<string>>(loadApplied());
  const stealthCountRef = useRef(0);
  const pendingRef      = useRef<AutoSettingsDelta[]>([]);

  // ── Apply payload ──────────────────────────────────────────────────────────
  const applyPayload = useCallback((delta: AutoSettingsDelta): void => {
    const { payload } = delta;
    const { setThemeState, updateSettings, setAiSettings } = useSettingsStore.getState().actions;

    if (payload.themeState) {
      setThemeState((prev: AppThemeState) => ({ ...prev, ...payload.themeState }));
    }
    if (payload.settings) {
      updateSettings(payload.settings);
    }
    if (payload.aiSettings) {
      setAiSettings((prev: AiSettings) => ({ ...prev, ...payload.aiSettings }));
    }
  }, []);

  // ── Core scan ──────────────────────────────────────────────────────────────
  const runScan = useCallback((): void => {
    const storeState    = useSettingsStore.getState();
    const behaviorState = useUserBehaviorStore.getState();
    const cogState      = useCognitiveStore.getState();

    const entries  = cogState.listRecent(50, tenantId);
    const profile  = behaviorState.profile;

    const ctx = {
      entries,
      profile,
      currentThemeState: storeState.themeState,
      currentSettings:   storeState.settings,
      currentAiSettings: storeState.aiSettings,
      hourOfDay:         new Date().getHours(),
    };

    const deltas = computeAutoDeltas(ctx);
    const autoApplied: AutoSettingsDelta[] = [];
    const newPending:  AutoSettingsDelta[] = [];

    const trust = useTrustStore.getState().score;

    for (const delta of deltas) {
      if (dismissedRef.current.has(delta.id))  continue;
      if (appliedIdsRef.current.has(delta.id)) continue;

      const effConf = effectiveConfidence(delta.confidence, trust);

      if (effConf >= STEALTH_THRESHOLD && isLowRisk(delta, trust)) {
        // ── Tier 1: stealth totale — nessun toast, nessuna card ────────────
        applyPayload(delta);
        appliedIdsRef.current.add(delta.id);
        stealthCountRef.current += 1;
        useTrustStore.getState().actions.applyEvent({
          type: 'delta_applied', deltaId: delta.id, category: delta.category,
        });
      } else if (effConf >= AUTO_APPLY_THRESHOLD) {
        // ── Tier 2: auto-apply + toast breve ────────────────────────────────
        applyPayload(delta);
        appliedIdsRef.current.add(delta.id);
        autoApplied.push(delta);
        useTrustStore.getState().actions.applyEvent({
          type: 'delta_applied', deltaId: delta.id, category: delta.category,
        });
      } else {
        // ── Tier 3: card nel Nexus (richiede conferma utente) ───────────────
        newPending.push(delta);
      }
    }

    // Tier-2 toast hint (compatto — Tier 1 non emette nulla)
    if (autoApplied.length > 0) {
      const { showToast } = useUIStore.getState().actions;
      const labels = autoApplied.map(d => d.label).join(', ');
      showToast(`Jarvis ✦ ${labels}`, 'info');
      saveApplied(appliedIdsRef.current);
      setAppliedIds([...appliedIdsRef.current]);
    }

    // Aggiorna stealthCount (React skippa il re-render se il valore è uguale)
    setStealthCount(stealthCountRef.current);

    // Only update pending state if changed (avoid re-renders)
    const prevIds = pendingRef.current.map(d => d.id).join(',');
    const nextIds = newPending.map(d => d.id).join(',');
    if (prevIds !== nextIds) {
      pendingRef.current = newPending;
      setPending(newPending);
    }
  }, [tenantId, applyPayload]);

  // ── Mount + interval + reactive ───────────────────────────────────────────
  useEffect(() => {
    runScan();
    const interval = setInterval(runScan, SCAN_INTERVAL_MS);
    const unsub = useCognitiveStore.subscribe(runScan);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [runScan]);

  // ── Manual apply ──────────────────────────────────────────────────────────
  const applyDelta = useCallback((id: string): void => {
    const delta = pendingRef.current.find(d => d.id === id);
    if (!delta) return;

    applyPayload(delta);
    appliedIdsRef.current.add(id);
    saveApplied(appliedIdsRef.current);
    setAppliedIds([...appliedIdsRef.current]);

    const next = pendingRef.current.filter(d => d.id !== id);
    pendingRef.current = next;
    setPending(next);
  }, [applyPayload]);

  // ── Dismiss ───────────────────────────────────────────────────────────────
  const dismissDelta = useCallback((id: string): void => {
    dismissedRef.current.add(id);
    saveDismissed(dismissedRef.current);

    const next = pendingRef.current.filter(d => d.id !== id);
    pendingRef.current = next;
    setPending(next);
  }, []);

  return { pending, appliedIds, stealthCount, applyDelta, dismissDelta };
}
