/**
 * modules/orchestration/EmotionalEngine.ts — P38.5 + P38.6
 *
 * Cognitive Adaptation Layer.
 * Modulates AI depth, tone, and UI density based on cognitive-emotional signal.
 *
 * L1  detectSignals(text)                      → EmotionalSignal
 * L2  resolveState(signal)                     → EmotionalState
 * L3  resolveStrategy(state, memory, profile)  → EmotionalStrategy
 * L4a buildEmotionalSection(strategy)          → string for system prompt
 * L4b adaptBlocks(blocks, strategy)            → AdaptedBlock[] (hidden flag, no slice)
 *
 * P38.6 additions:
 *   EmotionalProfile  — cross-session baseline persisted in useChatPrefsStore
 *   deriveProfile()   — evolves profile from session evidence after each turn
 *   resolveStrategy() — blends preferred strategy when adaptability > 0.7
 *   adaptBlocks()     — hidden flag instead of slice → progressive reveal
 */
import type { UIBlock, AdaptedBlock } from '@/types/uiBlocks';

// ── L1: Signals ───────────────────────────────────────────────────────────────

const CONFUSION_RE   = /non capisco|confuso|aiuto|non so|non riesco|non è chiaro|perché|cosa significa/i;
const UNCERTAINTY_RE = /forse|magari|non sono sicuro|non saprei|probabilmente|potrebbe|mi chiedo/i;
const URGENCY_RE     = /subito|urgente|adesso|ora|immediatamente|veloce|rapido/i;
const STALL_RE       = /^(?:boh|mah|hmm+|uhm+|mmm+|ok|oki)\s*[.!?]?$/i;

export interface EmotionalSignal {
  confused:         boolean;
  uncertain:        boolean;
  urgent:           boolean;
  stalling:         boolean;
  cognitiveLoad:    'low' | 'medium' | 'high';
  clarity:          'clear' | 'unclear';
  momentum:         'stalled' | 'flowing';
  intentConfidence: 'low' | 'medium' | 'high';
  wordCount:        number;
}

export function detectSignals(text: string): EmotionalSignal {
  const words     = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const questions = (text.match(/\?/g) ?? []).length;

  const confused  = CONFUSION_RE.test(text);
  const uncertain = UNCERTAINTY_RE.test(text);
  const urgent    = URGENCY_RE.test(text);
  const stalling  = STALL_RE.test(text.trim());

  const cognitiveLoad: EmotionalSignal['cognitiveLoad'] =
    wordCount > 80 || questions >= 3 ? 'high'   :
    wordCount > 30 || questions >= 1 ? 'medium' : 'low';

  return {
    confused,
    uncertain,
    urgent,
    stalling,
    cognitiveLoad,
    clarity:          confused || uncertain ? 'unclear' : 'clear',
    momentum:         stalling ? 'stalled' : 'flowing',
    intentConfidence: confused ? 'low' : uncertain ? 'medium' : 'high',
    wordCount,
  };
}

// ── L2: States ────────────────────────────────────────────────────────────────

export type EmotionalState =
  | 'focused'
  | 'exploring'
  | 'overloaded'
  | 'blocked'
  | 'goal_oriented';

export function resolveState(signal: EmotionalSignal): EmotionalState {
  if (signal.confused)                                             return 'blocked';
  if (signal.cognitiveLoad === 'high' && signal.clarity === 'unclear') return 'overloaded';
  if (signal.stalling || signal.uncertain)                        return 'exploring';
  if (signal.urgent || signal.wordCount <= 8)                     return 'goal_oriented';
  return 'focused';
}

// ── L3: Strategies ────────────────────────────────────────────────────────────

export interface EmotionalStrategy {
  tone:       'neutral' | 'proactive' | 'reassuring';
  depth:      'light' | 'medium' | 'deep';
  uiDensity:  'low' | 'medium' | 'high';
  guidance:   'none' | 'suggest' | 'lead';
  maxBlocks?: number;
  /** Dev-only annotation populated by mergeStrategy. Tree-shaken in production. */
  _debug?: { ruleApplied: string; priority: 1 | 2 | 3 };
}

const STRATEGY_MAP: Record<EmotionalState, EmotionalStrategy> = {
  focused:       { tone: 'proactive',  depth: 'deep',   uiDensity: 'high',   guidance: 'none'               },
  exploring:     { tone: 'neutral',    depth: 'medium', uiDensity: 'medium', guidance: 'suggest', maxBlocks: 4 },
  overloaded:    { tone: 'reassuring', depth: 'light',  uiDensity: 'low',    guidance: 'lead',    maxBlocks: 2 },
  blocked:       { tone: 'reassuring', depth: 'light',  uiDensity: 'low',    guidance: 'lead',    maxBlocks: 2 },
  goal_oriented: { tone: 'proactive',  depth: 'light',  uiDensity: 'low',    guidance: 'none',    maxBlocks: 2 },
};

// ── P38.6: Emotional Profile ──────────────────────────────────────────────────

/** Cross-session baseline. Persisted in useChatPrefsStore. */
export interface EmotionalProfile {
  /** Most stable observed state for this user */
  baselineState:     EmotionalState;
  /** Preferred strategy deltas merged when adaptability > 0.7 */
  preferredStrategy: Partial<EmotionalStrategy>;
  /** 0..1 — at > 0.7 the engine blends preferredStrategy into base */
  adaptability:      number;
  /** Number of profile derivations so far */
  updateCount:       number;
  lastUpdated:       number;
}

export function createEmotionalProfile(): EmotionalProfile {
  return {
    baselineState:     'focused',
    preferredStrategy: {},
    adaptability:      0,
    updateCount:       0,
    lastUpdated:       Date.now(),
  };
}

/**
 * Called after each session turn.
 * Derives a new persistent profile from accumulated session memory.
 */
export function deriveProfile(
  memory:  EmotionalMemory,
  _state:  EmotionalState,
  current: EmotionalProfile,
): EmotionalProfile {
  const baselineState: EmotionalState =
    memory.flowScore        > 5 ? 'focused'    :
    memory.frustrationCount > 3 ? 'overloaded' :
    current.baselineState;

  const preferredStrategy: Partial<EmotionalStrategy> = {
    ...current.preferredStrategy,
    depth: memory.preferredDepth,
  };

  return {
    baselineState,
    preferredStrategy,
    adaptability:  memory.frustrationCount > 2 ? 0.8 : 0.4,
    updateCount:   current.updateCount + 1,
    lastUpdated:   Date.now(),
  };
}

/**
 * P38.6-stable: prevent abrupt state jumps.
 * Each state may only transition to its allowed next states.
 */
const SMOOTH_TRANSITIONS: Record<EmotionalState, EmotionalState[]> = {
  blocked:       ['blocked', 'overloaded'],
  overloaded:    ['overloaded', 'exploring', 'blocked'],
  exploring:     ['exploring', 'focused', 'overloaded'],
  focused:       ['focused', 'goal_oriented', 'exploring'],
  goal_oriented: ['goal_oriented', 'focused'],
};

export function smoothState(
  prev: EmotionalState,
  next: EmotionalState,
): EmotionalState {
  return SMOOTH_TRANSITIONS[prev]?.includes(next) ? next : prev;
}

export function resolveStrategy(
  state:   EmotionalState,
  memory:  EmotionalMemory,
  profile: EmotionalProfile = createEmotionalProfile(),
): EmotionalStrategy {
  const base = { ...STRATEGY_MAP[state] };

  // Accumulated frustration → force minimal, fully guided
  if (memory.frustrationCount >= 3) {
    return { tone: 'reassuring', depth: 'light', uiDensity: 'low', guidance: 'lead', maxBlocks: 2 };
  }

  // Deep flow + focused → lift density limits
  if (memory.flowScore >= 5 && state === 'focused') {
    const { maxBlocks: _, ...noLimit } = base;
    return noLimit;
  }

  // P38.6: always apply known depth preference (lower threshold from 0.7 → 0.4)
  if (profile.preferredStrategy.depth && profile.adaptability >= 0.4) {
    base.depth = profile.preferredStrategy.depth;
    // uiDensity follows depth: deep→high, light→low, medium stays
    if (profile.preferredStrategy.depth === 'deep')  base.uiDensity = 'high';
    if (profile.preferredStrategy.depth === 'light') base.uiDensity = 'low';
  }

  // High adaptability: merge full preferred strategy override
  if (profile.adaptability > 0.7 && Object.keys(profile.preferredStrategy).length > 0) {
    return { ...base, ...profile.preferredStrategy };
  }

  return base;
}

// ── Session Memory ────────────────────────────────────────────────────────────

export interface EmotionalMemory {
  frustrationCount: number;
  flowScore:        number;
  preferredDepth:   EmotionalStrategy['depth'];
  /**
   * P39.6: last state the user actually experienced.
   * Prevents snapping back from 'blocked' / 'overloaded' too quickly —
   * smoothState alone guards transitions but does not track perception.
   */
  lastPerceivedState: EmotionalState;
}

export function createEmotionalMemory(): EmotionalMemory {
  return { frustrationCount: 0, flowScore: 0, preferredDepth: 'medium', lastPerceivedState: 'focused' };
}

export function updateEmotionalMemory(
  memory: EmotionalMemory,
  signal: EmotionalSignal,
  state:  EmotionalState,
): EmotionalMemory {
  const isNegative = state === 'blocked'      || state === 'overloaded';
  const isPositive = state === 'focused'      || state === 'goal_oriented';
  const depthHint: EmotionalStrategy['depth'] =
    signal.cognitiveLoad === 'high' ? 'deep'  :
    signal.cognitiveLoad === 'low'  ? 'light' : 'medium';

  return {
    frustrationCount: isNegative
      ? memory.frustrationCount + 1
      : Math.max(0, memory.frustrationCount - 1),
    flowScore: isPositive
      ? memory.flowScore + 1
      : Math.max(0, memory.flowScore - 1),
    preferredDepth: depthHint,
    lastPerceivedState: state,
  };
}

// ── L4a: System prompt emotional section ─────────────────────────────────────

export function buildEmotionalSection(strategy: EmotionalStrategy): string {
  const lines: string[] = [];

  if (strategy.tone === 'reassuring') {
    lines.push('TONO: Usa un tono rassicurante. Inizia dai punti chiari. Non amplificare la complessità.');
  } else if (strategy.tone === 'proactive') {
    lines.push('TONO: Sii diretto e proattivo. Anticipa il passo successivo. Proponi azioni concrete.');
  }

  if (strategy.depth === 'light') {
    lines.push('PROFONDITÀ: Risposta breve e focalizzata. Massimo 3 paragrafi. Salta le digressioni.');
  } else if (strategy.depth === 'deep') {
    lines.push('PROFONDITÀ: Sviluppo approfondito. Includi ragionamento, esempi e connessioni tra concetti.');
  }

  if (strategy.guidance === 'lead') {
    lines.push("GUIDA: Guida esplicitamente verso l'azione più utile. Concludi con un singolo passo chiaro.");
  } else if (strategy.guidance === 'suggest') {
    lines.push('GUIDA: Proponi possibili direzioni senza imporne una.');
  }

  return lines.join('\n');
}

// ── L4b: Block density adaptation ────────────────────────────────────────────

const PRIORITY: Record<string, number> = {
  text:          10,
  work_session:  10,
  orbit_plan:     9,
  status:         8,
  actions:        7,
  plan:           6,
  decision_card:  6,
  form:           5,
  table:          4,
  timeline:       3,
  chart:          2,
  insight:        1,
  sandbox:        1,
};

/**
 * Minimal style hint for block density adaptation.
 * Structurally compatible with CognitiveStyle — pass a CognitiveStyle directly.
 * Defined here (not imported) to avoid circular dependency with CognitiveStyleEngine.
 */
export interface BlockStyleHint {
  structure:   'low' | 'medium' | 'high';
  exploration: 'low' | 'medium' | 'high';
}

/**
 * P38.6 + P39.5: mark low-priority blocks as hidden instead of slicing.
 * UI shows a "Mostra altri N elementi" button — no content is ever discarded.
 *
 * P39.5 additions:
 *   - style.exploration === 'high' → show all blocks (user actively browsing)
 *   - style.structure   === 'high' → one extra block visible (user wants completeness)
 *   - style.structure   === 'low'  → one fewer block (compress aggressively)
 */
export function adaptBlocks(
  blocks:   UIBlock[],
  strategy: EmotionalStrategy,
  style?:   BlockStyleHint,
): AdaptedBlock[] {
  if (strategy.uiDensity === 'high' || !strategy.maxBlocks) {
    return blocks as AdaptedBlock[];
  }

  // Exploration: show all blocks — user actively wants to browse alternatives
  if (style?.exploration === 'high') {
    return blocks as AdaptedBlock[];
  }

  // Structure: adjust visible block count to match user's preference
  const maxVisible =
    style?.structure === 'high' ? Math.min(blocks.length, strategy.maxBlocks + 1) :
    style?.structure === 'low'  ? Math.max(1, strategy.maxBlocks - 1)             :
    strategy.maxBlocks;

  const ranked = blocks
    .map((_, i) => ({ i, priority: PRIORITY[blocks[i].type] ?? 0 }))
    .sort((a, b) => b.priority - a.priority);

  const visibleIndices = new Set(ranked.slice(0, maxVisible).map(x => x.i));

  return blocks.map((b, i) => ({ ...b, hidden: !visibleIndices.has(i) }));
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export function analyzeEmotional(
  text:      string,
  memory:    EmotionalMemory,
  profile:   EmotionalProfile = createEmotionalProfile(),
  prevState?: EmotionalState,
): { signal: EmotionalSignal; state: EmotionalState; strategy: EmotionalStrategy } {
  const signal   = detectSignals(text);
  const rawState = resolveState(signal);
  const state    = prevState ? smoothState(prevState, rawState) : rawState;
  const strategy = resolveStrategy(state, memory, profile);
  return { signal, state, strategy };
}
