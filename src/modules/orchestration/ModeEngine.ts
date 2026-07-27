/**
 * modules/orchestration/ModeEngine.ts — P36.5 Mode Engine
 *
 * Controls orchestration behaviour via four pre-defined execution profiles.
 * The mode is selected per-message by the user in InputBar and passed down
 * to CognitiveOrchestrator.run() via OrchestratorOptions.
 *
 * Modes:
 *   fast     — single agent, no memory, no retry  (base + pro)
 *   balanced — default: up to 3 steps, memory on  (base + pro)
 *   deep     — full depth: 6 steps, retry, memory  (PRO only)
 *   manual   — no limits, user selects agents      (PRO only)
 *
 * Monetisation:
 *   PRO_ONLY_MODES drives gate logic in useSmartChat / UI to prevent base
 *   users from accessing deep/manual without surfacing an upgrade prompt.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type Mode = 'fast' | 'balanced' | 'deep' | 'manual' | 'creative';

export interface ModeConfig {
  /** Maximum orchestrator steps allowed for this mode */
  maxSteps:  number;
  /** Whether to retrieve and inject memory context */
  useMemory: boolean;
  /** Whether to enable the reflection retry loop */
  retry:     boolean;
  /** Maximum concurrent agents per round */
  maxAgents: number;
  /** Human-readable display name */
  label:     string;
  /** MUI icon name (used in InputBar chip) */
  icon:      '⚡' | '⚖️' | '🧠' | '🛠' | '✨';
  /** If true: requires pro plan to activate */
  proOnly:   boolean;
}

// ── Mode configuration table ──────────────────────────────────────────────────

export const MODE_CONFIG: Record<Mode, ModeConfig> = {
  fast: {
    maxSteps:  1,
    useMemory: false,
    retry:     false,
    maxAgents: 1,
    label:     'Fast',
    icon:      '⚡',
    proOnly:   false,
  },
  balanced: {
    maxSteps:  3,
    useMemory: true,
    retry:     false,
    maxAgents: 2,
    label:     'Balanced',
    icon:      '⚖️',
    proOnly:   false,
  },
  deep: {
    maxSteps:  6,
    useMemory: true,
    retry:     true,
    maxAgents: 4,
    label:     'Deep',
    icon:      '🧠',
    proOnly:   true,
  },
  manual: {
    maxSteps:  10,
    useMemory: true,
    retry:     true,
    maxAgents: 10,
    label:     'Manual',
    icon:      '🛠',
    proOnly:   true,
  },
  creative: {
    maxSteps:  3,
    useMemory: true,
    retry:     false,
    maxAgents: 2,
    label:     'Creative',
    icon:      '✨',
    proOnly:   false,
  },
} as const;

/** Modes that are gated behind a pro subscription. */
export const PRO_ONLY_MODES: Mode[] = Object.entries(MODE_CONFIG)
  .filter(([, cfg]) => cfg.proOnly)
  .map(([mode]) => mode as Mode);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the config for the given mode.
 * Falls back to 'balanced' for unknown values (safe default).
 */
export function getModeConfig(mode: Mode): ModeConfig {
  return MODE_CONFIG[mode] ?? MODE_CONFIG.balanced;
}

/**
 * Checks whether a given mode is accessible to the user based on their plan.
 * Always returns true when `userPlan` is 'pro'.
 */
export function isModeAllowed(mode: Mode, userPlan: 'free' | 'pro' = 'free'): boolean {
  if (userPlan === 'pro') return true;
  return !getModeConfig(mode).proOnly;
}

/**
 * Enforce mode constraints on an array of planned steps:
 * - Truncates to maxSteps
 * - Slices agents per round to maxAgents (best-effort; parallelism enforcement
 *   is handled in CognitiveOrchestrator)
 */
export function applyModeConstraints<T>(steps: T[], mode: Mode): T[] {
  const { maxSteps } = getModeConfig(mode);
  return steps.slice(0, maxSteps);
}
