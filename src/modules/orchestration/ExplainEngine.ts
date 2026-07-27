/**
 * modules/orchestration/ExplainEngine.ts — P40.1 / P40.2
 *
 * Decides automatically WHEN and WHAT to explain to the user, based on:
 *   - EmotionalState   (blocked / overloaded → more guidance)
 *   - EmotionalStrategy (guidance === 'lead' → always explain)
 *   - CognitiveStyle   (autonomy high → suppress unless severe; structure low → add steps)
 *   - OrchestratorResult (confidence, mode, steps)
 *   - userText        (short queries need a note)
 *   - explainOpenedCount (P40.2: one-shot learning)
 *
 * P40.2 additions:
 *   - MAX_ITEMS cap per emotional state — less is more
 *   - position: 'first' | 'last' — blocked state surfaces explain immediately after text
 *   - Style-aware language: 'factual' (structured users) vs 'narrative' (exploratory users)
 *   - One-shot learning: if user never opens explain => suppress for non-critical states
 *
 * Contract:
 *   - Never returns offensive or verbose strings — items are concise, empathetic sentences in Italian.
 *   - `shouldShow === false` means: do not append an explain block at all.
 *   - `items` is always non-empty when `shouldShow === true`.
 */

import type { EmotionalState, EmotionalStrategy } from './EmotionalEngine';
import type { CognitiveStyle }                     from './CognitiveStyleEngine';
import type { OrchestratorResult }                 from './CognitiveOrchestrator';
import type { Mode }                               from './ModeEngine';

// ── Public API ────────────────────────────────────────────────────────────────

export interface ExplainInput {
  userText:            string;
  result:              OrchestratorResult;
  strategy:            EmotionalStrategy;
  state:               EmotionalState;
  mode:                Mode;
  cognitiveStyle:      CognitiveStyle;
  /**
   * P40.2: cumulative number of times the user has opened explain blocks.
   * Used for one-shot learning: if never opened, suppress explain for non-critical states.
   */
  explainOpenedCount?: number;
}

export interface ExplainOutput {
  /** Explanation items to render inside the <ExplainBlock /> */
  items:      string[];
  /** Whether to inject the block at all */
  shouldShow: boolean;
  /**
   * P40.2: where to insert the block in rawBlocks.
   * 'first' = after text block (index 1) — for blocked state, helps immediately.
   * 'last'  = append at end — for other states, less invasive.
   */
  position:   'first' | 'last';
}

// ── Constants ────────────────────────────────────────────────────────────────

/** P40.2: maximum explain items per emotional state — less is more.
 * @deprecated superseded by P44.5 global hard cap `items.slice(0, 2)`. Kept for reference. */
const _MAX_ITEMS: Record<EmotionalState, number> = {
  blocked:       3,
  overloaded:    2,
  exploring:     2,
  focused:       1,
  goal_oriented: 2,
};

/** P40.2: item language style depending on cognitive profile */
type ToneStyle = 'factual' | 'narrative';

function resolveTone(cognitiveStyle: CognitiveStyle): ToneStyle {
  // Exploratory + not highly structured → softer, narrative phrasing
  if (cognitiveStyle.exploration === 'high' && cognitiveStyle.structure !== 'high') {
    return 'narrative';
  }
  return 'factual';
}

// ── shouldExplain ─────────────────────────────────────────────────────────────

/**
 * Decide whether an explain block is warranted for this turn.
 *
 * Priority matrix (highest wins):
 *   1. guidance === 'lead'                  → always explain (safety rule, non-negotiable)
 *   2. state === 'blocked'                  → explain unless high-autonomy AND never opened before
 *   3. state === 'overloaded'               → explain (helps orient the user)
 *   4. confidence < 0.4                     → explain (uncertainty transparency)
 *   5. state === 'exploring' && opened < 3  → suppress (P40.2 one-shot learning)
 *   6. Default                              → no explain block
 */
function shouldExplain(
  state:              EmotionalState,
  strategy:           EmotionalStrategy,
  cognitiveStyle:     CognitiveStyle,
  confidence:         number,
  explainOpenedCount: number,
): boolean {
  // Rule 1 — safety override: always explain when system is leading
  if (strategy.guidance === 'lead') return true;

  // Rule 2 — blocked state: explain unless high-autonomy and user never opened explain
  if (state === 'blocked') {
    if (cognitiveStyle.autonomy !== 'high') return true;
    // High-autonomy users still get explain if they previously engaged with it
    return explainOpenedCount > 0;
  }

  // Rule 3 — overloaded: brief explanation helps orient the user
  if (state === 'overloaded') return true;

  // Rule 4 — low confidence: be transparent about uncertainty
  if (confidence < 0.4) return true;

  // Rule 5 (P40.2) — one-shot learning: exploring users who never opened explain don't want it
  if (state === 'exploring' && explainOpenedCount < 3) return false;

  return false;
}

// ── buildExplainItems ─────────────────────────────────────────────────────────

/**
 * Build the ordered list of explanation strings.
 * P40.2: items are capped by _MAX_ITEMS (P44.5: global hard cap `items.slice(0, 2)`) and phrased according to the user's ToneStyle.
 * Order: most relevant first (state/guidance → mode/pace → structural → confidence).
 */
function buildExplainItems(
  userText:       string,
  result:         OrchestratorResult,
  strategy:       EmotionalStrategy,
  state:          EmotionalState,
  mode:           Mode,
  cognitiveStyle: CognitiveStyle,
): string[] {
  const items: string[]     = [];
  const n = resolveTone(cognitiveStyle);
  const f = n === 'narrative';

  // ── Guidance / emotional ─────────────────────────────────────────────────
  if (strategy.guidance === 'lead') {
    items.push(
      f ? 'Ho strutturato questa risposta passo dopo passo — quando sei pronto, possiamo approfondire insieme.'
        : 'Ho strutturato la risposta passo dopo passo perché ho rilevato che stai cercando orientamento.',
    );
  }

  if (state === 'blocked') {
    items.push(
      f ? 'Sembra che tu sia bloccato — ho aggiunto dettagli e guida per aiutarti a ripartire.'
        : 'Ho notato difficoltà: ho aggiunto dettagli e guida per aiutarti a sbloccarti.',
    );
  }

  if (state === 'overloaded') {
    items.push(
      f ? 'Ho tenuto la risposta semplice per non sovraccaricarti — approfondiremo quando vuoi.'
        : 'Ho semplificato il contenuto per non sovraccaricarti — puoi chiedere approfondimenti quando vuoi.',
    );
  }

  if (strategy.depth === 'light') {
    items.push(
      f ? 'Ti ho dato una versione sintetica per iniziare — dimmi se vuoi approfondire.'
        : 'Ho mantenuto un livello sintetico per non appesantire la risposta.',
    );
  }

  // ── Memory transparency (P41) ────────────────────────────────────────────
  if (result.memoryUsed) {
    items.push(
      f ? 'Ho mantenuto il tuo stile delle interazioni precedenti per una risposta più personale.'
        : 'Contesto sessione attivo: ho adattato la risposta a come lavori.',
    );
  }

  // ── Input / query ────────────────────────────────────────────────────────
  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 6) {
    items.push(
      f ? 'La tua domanda era breve: ho interpretato il contesto — se vuoi qualcosa di diverso, riformula pure.'
        : 'Ho inferito il contesto perché la domanda era breve — se serve più precisione, riformula.',
    );
  }

  // ── Mode / pace ──────────────────────────────────────────────────────────
  if (mode === 'fast') {
    items.push(
      f ? 'Sono in modalità veloce — se vuoi più dettaglio, passa alla modalità bilanciata.'
        : 'Modalità veloce: ho ridotto i passaggi per rispondere più rapidamente.',
    );
  }

  // ── Cognitive structure ──────────────────────────────────────────────────
  if (cognitiveStyle.structure === 'low') {
    items.push(
      f ? 'Ho aggiunto più struttura — il tuo profilo mostra che ti aiuta avere passaggi espliciti.'
        : 'Ho aggiunto più struttura perché il tuo profilo mostra che ti aiuta avere passaggi espliciti.',
    );
  }

  // ── Confidence ──────────────────────────────────────────────────────────
  if (result.confidence < 0.4) {
    const pct = Math.round(result.confidence * 100);
    items.push(
      f ? `Questa risposta ha una confidenza bassa (${pct}%) — potrebbe valere la pena verificarla prima di usarla.`
        : `Confidenza bassa (${pct}%): questa risposta è basata su informazioni parziali — verifica prima di usarla.`,
    );
  }

  // P44.5: global cap at 2 items — less is more for cognitive load
  return items.slice(0, 2);
}

// ── Entry point ───────────────────────────────────────────────────────────────

/**
 * Build an explain block decision for the current turn.
 *
 * @returns ExplainOutput — caller uses `shouldShow` to decide injection,
 *          `position` to choose where in rawBlocks, and `items` for the block content.
 */
export function buildExplainBlock(input: ExplainInput): ExplainOutput {
  const { userText, result, strategy, state, mode, cognitiveStyle, explainOpenedCount = 0 } = input;

  const show = shouldExplain(state, strategy, cognitiveStyle, result.confidence, explainOpenedCount);
  if (!show) return { shouldShow: false, items: [], position: 'last' };

  const items = buildExplainItems(userText, result, strategy, state, mode, cognitiveStyle);

  // Safety guard: if logic produced nothing (shouldn't happen after capping), don't show
  if (items.length === 0) return { shouldShow: false, items: [], position: 'last' };

  // P40.2: blocked state → surface explain immediately after text block (most helpful)
  const position: 'first' | 'last' = state === 'blocked' ? 'first' : 'last';

  return { shouldShow: true, items, position };
}
