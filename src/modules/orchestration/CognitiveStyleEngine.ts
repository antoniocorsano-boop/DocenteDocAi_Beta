/**
 * modules/orchestration/CognitiveStyleEngine.ts — P39
 *
 * Cognitive Relationship Layer.
 * Answers: "How does this user think and make decisions?"
 *
 * Derived incrementally from behavioural signals already tracked:
 *   - revealClicks       → wants depth (structure↑, exploration↑)
 *   - deepModeRatio      → prefers deliberate pace (structure↑)
 *   - suggestionAccept   → comfortable with guidance (autonomy↓)
 *   - blockedStateRatio  → needs more support (autonomy↓, structure↑)
 *
 * Design principles:
 *   - No ML. Pure heuristic, fully explainable.
 *   - Light bias, not aggressive override — user always feels in control.
 *   - Plug-in on top of EmotionalEngine: strategy → applyStyleBias.
 */

import type { EmotionalStrategy } from './EmotionalEngine';
import type { Mode }               from './ModeEngine';
import { observe }                 from '@/utils/observability';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StyleLevel = 'low' | 'medium' | 'high';
export type SpeedPref  = 'fast' | 'balanced' | 'deliberate';

export interface CognitiveStyle {
  /** Preference for structured, step-by-step responses */
  structure:       StyleLevel;
  /** How much the user wants to self-direct vs. be guided */
  autonomy:        StyleLevel;
  /** Pace preference derived from mode usage */
  speedPreference: SpeedPref;
  /** Curiosity / willingness to browse alternatives */
  exploration:     StyleLevel;
}

/** Raw behavioural counters driving style derivation */
export interface CognitiveStyleSignals {
  revealClicks:          number;  // clicks on "approfondisci" / reveal button
  deepModeUsageCount:    number;  // times deep / manual mode was used
  fastModeUsageCount:    number;  // times fast mode was used
  totalTurns:            number;  // total messages sent
  suggestionAccepted:    number;  // accepted mode suggestions
  suggestionRejected:    number;  // rejected mode suggestions
  blockedTurns:          number;  // turns where emotional state was 'blocked'
}

// ── Factories ─────────────────────────────────────────────────────────────────

export function createCognitiveStyle(): CognitiveStyle {
  return {
    structure:       'medium',
    autonomy:        'medium',
    speedPreference: 'balanced',
    exploration:     'medium',
  };
}

export function createCognitiveStyleSignals(): CognitiveStyleSignals {
  return {
    revealClicks:       0,
    deepModeUsageCount: 0,
    fastModeUsageCount: 0,
    totalTurns:         0,
    suggestionAccepted: 0,
    suggestionRejected: 0,
    blockedTurns:       0,
  };
}

// ── Derivation ────────────────────────────────────────────────────────────────

function toLevel(score: number): StyleLevel {
  return score >= 0.6 ? 'high' : score >= 0.3 ? 'medium' : 'low';
}

// ── Level blending ────────────────────────────────────────────────────────────

const LEVEL_NUM: Record<StyleLevel, number> = { low: 0, medium: 1, high: 2 };
const NUM_LEVEL: StyleLevel[]               = ['low', 'medium', 'high'];

function blendLevel(prev: StyleLevel, next: StyleLevel): StyleLevel {
  const blended = LEVEL_NUM[prev] * 0.7 + LEVEL_NUM[next] * 0.3;
  return NUM_LEVEL[Math.round(blended)] ?? 'medium';
}

/**
 * Smoothly blend two CognitiveStyle snapshots.
 *
 * Applies 70/30 EWA to structure, autonomy, exploration.
 * SpeedPref passes through unchanged — threshold-derived and already stable.
 *
 * Called automatically inside deriveStyle; also exported so external code
 * can re-apply smoothing after any manual correction or profile import.
 */
export function smoothStyle(prev: CognitiveStyle, next: CognitiveStyle): CognitiveStyle {
  return {
    structure:       blendLevel(prev.structure,    next.structure),
    autonomy:        blendLevel(prev.autonomy,     next.autonomy),
    exploration:     blendLevel(prev.exploration,  next.exploration),
    speedPreference: next.speedPreference,
  };
}

/**
 * Derives a new CognitiveStyle from cumulative signals.
 * Called after each turn; blends with the existing style via smoothStyle.
 */
export function deriveStyle(
  signals: CognitiveStyleSignals,
  current: CognitiveStyle,
): CognitiveStyle {
  const t = Math.max(signals.totalTurns, 1);

  // structure: reveal clicks + blocked ratio
  const structureScore =
    Math.min(1, signals.revealClicks / 5) * 0.5 +
    (signals.blockedTurns / t) * 0.5;

  // autonomy: high suggestion rejection + low blocked turns
  const acceptRatio    = signals.suggestionAccepted / Math.max(signals.suggestionAccepted + signals.suggestionRejected, 1);
  const autonomyScore  = (1 - acceptRatio) * 0.6 + (1 - signals.blockedTurns / t) * 0.4;

  // exploration: reveal clicks + proportion of non-fast turns
  const nonFastRatio     = 1 - signals.fastModeUsageCount / t;
  const explorationScore = Math.min(1, signals.revealClicks / 3) * 0.5 + nonFastRatio * 0.5;

  // speedPreference: deep vs fast ratio
  const deepRatio = signals.deepModeUsageCount / t;
  const fastRatio = signals.fastModeUsageCount / t;
  const speedPreference: SpeedPref =
    deepRatio > 0.4  ? 'deliberate' :
    fastRatio > 0.5  ? 'fast'       : 'balanced';

  const nextStructure   = toLevel(structureScore);
  const nextAutonomy    = toLevel(autonomyScore);
  const nextExploration = toLevel(explorationScore);

  return smoothStyle(current, {
    structure:       nextStructure,
    autonomy:        nextAutonomy,
    speedPreference: t < 5 ? current.speedPreference : speedPreference,
    exploration:     nextExploration,
  });
}

// ── Strategy overlay ──────────────────────────────────────────────────────────

/**
 * P39.6 — Merge Engine.
 *
 * Explicit priority hierarchy between the emotional and cognitive-style layers:
 *
 *   Priority 1 — Emotional safety  (guidance === 'lead'):
 *     The user is blocked or overloaded.  Cognitive style is irrelevant here;
 *     clarity and reassurance come first.  depth → 'light', uiDensity → 'low'.
 *
 *   Priority 2 — Style preference  (user is stable / flowing):
 *     structure high → uiDensity high
 *     structure low  → uiDensity low  (but never overrides safety)
 *     exploration high → remove maxBlocks cap entirely
 *     autonomy high  → lift depth floor to medium
 *     guidance rules from applyStyleBias preserved as Priority 2b
 *
 *   Priority 3 — Speed preference  (fine-tuning only):
 *     Deliberate pace → allow depth 'deep' even when strategy said 'medium'
 *     Fast pace       → cap depth to 'medium' if not in safety mode
 *
 * Rule of thumb:
 *   emotion = safety signal   (moment-level)
 *   style   = preference map  (session/cross-session level)
 *
 * This replaces the old `applyStyleBias` as the merge point; `applyStyleBias`
 * is kept for backward compat but now delegates here.
 */
export function mergeStrategy(
  emotional: EmotionalStrategy,
  style:     CognitiveStyle,
): EmotionalStrategy {
  const result = { ...emotional };
  const appliedRules: string[] = [];
  let   dominantPriority: 1 | 2 | 3 = 2;

  // ── Priority 1: Emotional safety — emotion wins unconditionally ──────────────
  if (result.guidance === 'lead') {
    result.depth     = 'light';
    result.uiDensity = 'low';
    // Keep tone (already 'reassuring') and maxBlocks (already 2) from emotion.
    appliedRules.push('P1:safety');
    dominantPriority = 1;

    if (import.meta.env.DEV) {
      result._debug = { ruleApplied: appliedRules.join(' + '), priority: dominantPriority };
      observe('merge.rule.applied', {
        rule:        appliedRules.join(' + '),
        priority:    dominantPriority,
        emotional:   emotional.tone,
        structure:   style.structure,
        exploration: style.exploration,
      }, 'debug');
    }
    return result;
  }

  // ── Priority 2: Style preference — user is stable, style shapes experience ──

  // 2a. Structure drives ui density
  if (style.structure === 'high') { result.uiDensity = 'high'; appliedRules.push('P2:structure-high'); }
  if (style.structure === 'low')  { result.uiDensity = 'low';  appliedRules.push('P2:structure-low');  }

  // 2b. Exploration removes the block cap → user wants to browse
  if (style.exploration === 'high') {
    delete result.maxBlocks;
    appliedRules.push('P2:exploration-high');
  }

  // 2c. Autonomy floors depth — autonomous users tolerate / want more content
  if (style.autonomy === 'high' && result.depth === 'light') {
    result.depth = 'medium';
    appliedRules.push('P2:autonomy-high');
  }

  // 2d. Guidance rules (from original applyStyleBias)
  if (style.structure === 'high' && style.autonomy === 'low' && result.guidance === 'none') {
    result.guidance = 'suggest';
    appliedRules.push('P2:suggest');
  }

  // ── Priority 3: Speed preference — fine-tuning only ────────────────────────
  if (style.speedPreference === 'deliberate' && result.depth === 'medium') {
    result.depth = 'deep';
    appliedRules.push('P3:deliberate');
    dominantPriority = 3;
  }
  if (style.speedPreference === 'fast' && emotional.tone !== 'reassuring') {
    if (result.depth === 'deep') result.depth = 'medium';
    if (!result.maxBlocks)       result.maxBlocks = 6;
    appliedRules.push('P3:fast');
    dominantPriority = 3;
  }

  if (appliedRules.length === 0) appliedRules.push('P2:no-op');

  if (import.meta.env.DEV) {
    result._debug = { ruleApplied: appliedRules.join(' + '), priority: dominantPriority };
    observe('merge.rule.applied', {
      rule:        appliedRules.join(' + '),
      priority:    dominantPriority,
      emotional:   emotional.tone,
      structure:   style.structure,
      exploration: style.exploration,
    }, 'debug');
  }

  return result;
}

/**
 * Backward-compat shim: delegates to mergeStrategy.
 * Kept so any external callers (tests, etc.) continue to work.
 */
export function applyStyleBias(
  strategy: EmotionalStrategy,
  style:    CognitiveStyle,
): EmotionalStrategy {
  return mergeStrategy(strategy, style);
}

// ── System prompt section ─────────────────────────────────────────────────────

export function buildStyleSection(style: CognitiveStyle): string {
  const lines: string[] = [];

  if (style.structure === 'high') {
    lines.push('STRUTTURA: Organizza la risposta in punti o step numerati. '
      + "Mantieni flusso lineare. L'utente preferisce chiarezza strutturale.");
  }

  if (style.autonomy === 'low') {
    lines.push("GUIDA ESPLICITA: Questo utente preferisce essere accompagnato. "
      + "Indica sempre il passo successivo in modo chiaro e diretto.");
  } else if (style.autonomy === 'high') {
    lines.push("AUTONOMIA: Questo utente preferisce decidere da solo. "
      + "Esponi le opzioni, non imporre una direzione.");
  }

  if (style.speedPreference === 'fast') {
    lines.push("RITMO: Rispondi in modo conciso. Massimo 2 paragrafi prima di un'azione proposta.");
  } else if (style.speedPreference === 'deliberate') {
    lines.push("PROFONDITÀ: L'utente apprezza il ragionamento esteso. Includi motivazioni e contesto.");
  }

  if (style.exploration === 'high') {
    lines.push("ESPLORAZIONE: Proponi varianti o angolature alternative quando rilevante.");
  }

  return lines.join('\n');
}

// ── Mode feedback ─────────────────────────────────────────────────────────────

/**
 * Returns a style signal update based on the mode used this turn.
 */
export function recordModeUsage(
  signals: CognitiveStyleSignals,
  mode:    Mode,
  isBlocked: boolean,
): CognitiveStyleSignals {
  return {
    ...signals,
    totalTurns:         signals.totalTurns + 1,
    deepModeUsageCount: (mode === 'deep' || mode === 'manual') ? signals.deepModeUsageCount + 1 : signals.deepModeUsageCount,
    fastModeUsageCount: mode === 'fast' ? signals.fastModeUsageCount + 1 : signals.fastModeUsageCount,
    blockedTurns:       isBlocked ? signals.blockedTurns + 1 : signals.blockedTurns,
  };
}
