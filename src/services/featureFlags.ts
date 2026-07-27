/**
 * featureFlags.ts — Feature flag system per tenant/rollout.
 *
 * C19: consente di attivare/disattivare funzionalità AI per tenant,
 * rollout graduale e A/B testing. Persiste in localStorage.
 *
 * Legge anche la sovereigntyStore: se AI è disabilitata globalmente
 * i flag AI vengono forzati a false indipendentemente dall'override.
 */

import { useSovereigntyStore } from '../stores/useSovereigntyStore';

// ─── Flag definitions ─────────────────────────────────────────────────────────

export type FeatureFlag =
  | 'AI_SUGGESTIONS'       // Mostra suggerimenti AI nel copilot panel
  | 'HITL_APPROVAL'        // Abilita il gate di approvazione umana
  | 'TELEMETRY'            // Invia telemetria di utilizzo
  | 'OPEN_DATA'            // Abilita export open data
  | 'AUTONOMOUS_MODE'      // Permette di impostare modalità autonoma
  | 'DPIA_VIEWER'          // Mostra pannello DPIA nell'interfaccia
  | 'GOVERNANCE_DASHBOARD' // Dashboard governance avanzata attiva
  | 'COMPLIANCE_REPORT'    // Report compliance esportabile
  | 'ADAPTIVE_ASSISTANT'   // Assistente adattivo attivo
  | 'BACKUP_RECOVERY';     // Pannello backup & recovery visibile

/** True = feature abilitata di default (OOTB) */
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  AI_SUGGESTIONS:       true,
  HITL_APPROVAL:        true,
  TELEMETRY:            false, // opt-in
  OPEN_DATA:            false, // opt-in
  AUTONOMOUS_MODE:      false, // opt-in — richiede approvazione esplicita
  DPIA_VIEWER:          true,
  GOVERNANCE_DASHBOARD: true,
  COMPLIANCE_REPORT:    true,
  ADAPTIVE_ASSISTANT:   true,
  BACKUP_RECOVERY:      true,
};

const STORAGE_KEY = 'feature_flags_v1';

/** AI-dependent flags — forzati a false quando AI è disabilitata. */
const AI_DEPENDENT_FLAGS = new Set<FeatureFlag>([
  'AI_SUGGESTIONS',
  'AUTONOMOUS_MODE',
  'ADAPTIVE_ASSISTANT',
]);

// ─── Internal helpers ─────────────────────────────────────────────────────────

function loadOverrides(): Partial<Record<FeatureFlag, boolean>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<FeatureFlag, boolean>>) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Partial<Record<FeatureFlag, boolean>>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage not available (SSR/test)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Verifica se un feature flag è attivo.
 *
 * Priorità di risoluzione (in ordine decrescente):
 *   1. Sovereignty AI kill-switch → forza a false i flag AI-dipendenti
 *   2. Override localStorage       → sovrascrive il default
 *   3. Default                     → valore di DEFAULT_FLAGS
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // 1. Sovereignty hard-block
  if (AI_DEPENDENT_FLAGS.has(flag)) {
    const { aiEnabled } = useSovereigntyStore.getState().getConfig();
    if (!aiEnabled) return false;
  }

  // 2. localStorage override
  const overrides = loadOverrides();
  if (flag in overrides) return overrides[flag] as boolean;

  // 3. Default
  return DEFAULT_FLAGS[flag] ?? false;
}

/**
 * Imposta un override per un flag.
 * Persiste in localStorage (sopravvive al reload, ma non è sincronizzato
 * tra tab — per questo usa storage events se necessario).
 */
export function setFeatureFlag(flag: FeatureFlag, enabled: boolean): void {
  const overrides = loadOverrides();
  overrides[flag] = enabled;
  saveOverrides(overrides);
}

/**
 * Rimuove un override, ripristinando il default.
 */
export function resetFeatureFlag(flag: FeatureFlag): void {
  const overrides = loadOverrides();
  delete overrides[flag];
  saveOverrides(overrides);
}

/**
 * Restituisce tutti i flag con i loro valori effettivi correnti.
 */
export function getAllFlags(): Record<FeatureFlag, boolean> {
  return Object.fromEntries(
    (Object.keys(DEFAULT_FLAGS) as FeatureFlag[]).map((f) => [f, isFeatureEnabled(f)]),
  ) as Record<FeatureFlag, boolean>;
}

/**
 * Resets all feature flag overrides to defaults.
 * Utile in test o reset manuale da impostazioni.
 */
export function resetAllFlags(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
