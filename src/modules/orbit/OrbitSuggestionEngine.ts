/**
 * OrbitSuggestionEngine — context-aware suggestion generator for OrbitDock.
 *
 * Pure function, zero side-effects. Takes the current cognitive/emotional
 * state, recent chat messages, and past action history; returns at most
 * MAX_SUGGESTIONS ranked suggestions each carrying a `confidence` score.
 *
 * Design rules:
 * - Language is always human, never technical.
 * - At most MAX_SUGGESTIONS (3) items returned.
 * - If no state-specific rule fires, a sensible default is always present.
 * - Each suggestion carries a `prompt` ready to be injected into SmartChat.
 * - Each suggestion carries a `reason` shown as contextual hint in the UI.
 * - Each suggestion carries a `confidence` (0–1) for the confidence bar UI.
 * - Suggestions whose `id` appears in `previousActions` are suppressed.
 * - When `recentMessages` are present, prompts are enriched with real content.
 */

import type { EmotionalState }  from '@/modules/orchestration/EmotionalEngine';
import type { CognitiveStyle }  from '@/modules/orchestration/CognitiveStyleEngine';
import type { WorldConfig }     from './worldTypes';
import type { SocialGroup }     from '@/types/social.types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OrbitContext {
  emotionalState?:  EmotionalState;
  cognitiveStyle?:  Pick<CognitiveStyle, 'structure' | 'exploration' | 'speedPreference'>;
  /** Last N user/assistant message texts from the active conversation. */
  recentMessages?:  string[];
  /** IDs of suggestions the user already triggered this session — deduped. */
  previousActions?: string[];
  hasMessages:      boolean;
  /** ID of the world the user is currently in (e.g. 'didattica'). */
  activeWorldId?:   string;
  /** Other available worlds — used to generate cross-world soft questions. */
  availableWorlds?: Pick<WorldConfig, 'id' | 'label' | 'icon'>[];
  /**
   * Groups the current user belongs to (Fase 7 — Social Layer).
   * Used to generate soft-question nudges about group sharing.
   * Only active (consenting) groups should be passed here.
   */
  activeGroups?: Pick<SocialGroup, 'id' | 'name' | 'worldId'>[];
}

export interface OrbitSuggestion {
  /** Stable key for React rendering */
  id:               string;
  /** Short, human label shown on the button */
  label:            string;
  /** Full prompt injected into SmartChat */
  prompt:           string;
  /** One-line humanised explanation shown below the button */
  reason:           string;
  /** Relevance score 0–1 — drives the confidence bar colour/width */
  confidence:       number;
  /** Optional domain intent predicted for this suggestion (P44.4) */
  predictedIntent?: string;
}

const MAX_SUGGESTIONS = 3;

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Truncate a message to at most `len` characters for safe prompt embedding. */
function truncate(text: string, len = 120): string {
  return text.length <= len ? text : `${text.slice(0, len)}…`;
}

// ── Engine ─────────────────────────────────────────────────────────────────────

/**
 * Returns up to MAX_SUGGESTIONS context-aware suggestions.
 *
 * Priority (first-match wins for state-specific slots):
 *  1. Emotional state signals  (boosted when recentMessages available)
 *  2. Cognitive style signals
 *  3. Session context (has messages / previously used)
 *  4. Default fallback (always present as last item)
 *
 * Suggestions already in `previousActions` are filtered out after generation.
 */
export function getOrbitSuggestions(ctx: OrbitContext): OrbitSuggestion[] {
  const candidates: OrbitSuggestion[] = [];

  const add = (s: OrbitSuggestion) => candidates.push(s);

  const lastMsg = ctx.recentMessages?.at(-1) ?? '';

  // ── Emotional state rules ──────────────────────────────────────────────────

  if (ctx.emotionalState === 'blocked') {
    add({
      id:         'simplify',
      label:      lastMsg ? 'Vuoi semplificare questo passaggio?' : 'Vuoi ricominciare da un punto chiaro?',
      prompt:     lastMsg
        ? `Rendi più chiaro e semplice il seguente contenuto, con un esempio concreto:\n\n"${truncate(lastMsg)}"`
        : 'Spiega di nuovo in modo più semplice e con un esempio concreto',
      reason:     'Sembra difficoltà con l\'ultimo contenuto — proviamo insieme',
      confidence: lastMsg ? 0.92 : 0.75,
    });
  }

  if (ctx.emotionalState === 'overloaded') {
    const msgContext = ctx.recentMessages?.slice(-3).join(' ') ?? '';
    add({
      id:         'summary',
      label:      'Vuoi un riassunto veloce?',
      prompt:     msgContext
        ? `Fai un riassunto breve (max 5 righe) dei seguenti contenuti:\n\n"${truncate(msgContext, 200)}"`
        : 'Fai un riassunto breve e chiaro, massimo 5 righe',
      reason:     'Troppo da elaborare — ecco l\'essenziale',
      confidence: msgContext ? 0.88 : 0.78,
    });
  }

  if (ctx.emotionalState === 'exploring') {
    add({
      id:         'expand',
      label:      'Vuoi approfondire?',
      prompt:     lastMsg
        ? `Approfondisci questo argomento con esempi pratici e connessioni utili:\n\n"${truncate(lastMsg)}"`
        : 'Approfondisci questo argomento con esempi pratici e connessioni utili',
      reason:     'Modalità esplorazione attiva — andiamo in profondità',
      confidence: 0.82,
    });
  }

  if (ctx.emotionalState === 'goal_oriented' || ctx.emotionalState === 'focused') {
    add({
      id:         'quiz',
      label:      'Vuoi creare una verifica?',
      prompt:     lastMsg
        ? `Crea una verifica con 5 domande sull'argomento:\n\n"${truncate(lastMsg)}"`
        : 'Crea una verifica con 5 domande sull\'argomento appena trattato',
      reason:     'Momento ideale per consolidare — trasformiamo in esercizio',
      confidence: 0.85,
    });
  }

  // ── Cognitive style rules ──────────────────────────────────────────────────

  if (ctx.cognitiveStyle?.exploration === 'high') {
    add({
      id:         'expand-deep',
      label:      'Vuoi approfondire con esempi?',
      prompt:     lastMsg
        ? `Approfondisci con esempi pratici e connessioni interdisciplinari:\n\n"${truncate(lastMsg)}"`
        : 'Approfondisci con esempi pratici e connessioni interdisciplinari',
      reason:     'Il tuo stile esplorativo — andiamo più lontano',
      confidence: 0.80,
    });
  }

  if (ctx.cognitiveStyle?.structure === 'high') {
    add({
      id:         'rubric',
      label:      'Vuoi generare una rubrica?',
      prompt:     'Crea una rubrica di valutazione con 4 livelli di competenza chiari',
      reason:     'Preferisci struttura — una rubrica ti aiuta subito',
      confidence: 0.78,
    });
  }

  if (ctx.cognitiveStyle?.speedPreference === 'fast') {
    add({
      id:         'tldr',
      label:      'Vuoi una versione più breve?',
      prompt:     lastMsg
        ? `Dammi la versione più breve possibile di:\n\n"${truncate(lastMsg)}"`
        : 'Dammi la versione più breve possibile del contenuto precedente',
      reason:     'Vuoi andare veloce — eccone la versione essenziale',
      confidence: 0.76,
    });
  }

  // ── Session context rules ──────────────────────────────────────────────────

  if (ctx.hasMessages) {
    add({
      id:         'rephrase',
      label:      'Vuoi riformulare per gli alunni?',
      prompt:     lastMsg
        ? `Riformula il seguente contenuto con linguaggio semplice, come lo spiegheresti agli alunni:\n\n"${truncate(lastMsg)}"`
        : 'Riformula spiegando come lo diresti agli alunni, con linguaggio semplice',
      reason:     'Hai già del contenuto — rendiamolo pronto per la classe',
      confidence: 0.72,
    });
  }

  // ── Social layer nudges (Fase 7 — Social Layer) ─────────────────────────────
  // Suggest sharing current content with an active group when one exists.
  // Label always soft-question form — never imperative.

  if (ctx.activeGroups && ctx.activeGroups.length > 0) {
    const targetGroup = ctx.activeGroups[0];  // nudge for the first group (max 1)
    add({
      id:               `share-group-${targetGroup.id}`,
      label:            `Vuoi condividere con il gruppo "${targetGroup.name}"?`,
      prompt:           lastMsg
        ? `Condividi il seguente contenuto con il gruppo ${targetGroup.name}:\n\n"${truncate(lastMsg)}"`
        : `Condividi il contenuto corrente con il gruppo ${targetGroup.name}`,
      reason:           `Hai un gruppo attivo — puoi collaborare subito`,
      confidence:       0.65,
      predictedIntent:  'document_sharing',
    });
  }

  // ── Cross-world soft questions (Fase 6 — Mondi Orbitanti) ──────────────────
  // Suggest transitioning to another world when context signals diverge from
  // the current world. Labels always in soft-question form — never imperative.

  if (ctx.availableWorlds && ctx.availableWorlds.length > 0) {
    const otherWorlds = ctx.activeWorldId
      ? ctx.availableWorlds.filter(w => w.id !== ctx.activeWorldId)
      : ctx.availableWorlds;

    // Pick the first other world as a contextual nudge (max 1 cross-world suggestion)
    const targetWorld = otherWorlds[0];
    if (targetWorld) {
      add({
        id:               `world-switch-${targetWorld.id}`,
        label:            `Vuoi esplorare il mondo ${targetWorld.label}?`,
        prompt:           `Portami nel mondo ${targetWorld.label}`,
        reason:           `Hai contenuti rilevanti anche per il mondo ${targetWorld.label}`,
        confidence:       0.62,
        predictedIntent:  targetWorld.id,
      });
    }
  }

  // ── Default fallback (always present) ─────────────────────────────────────

  add({
    id:         'quiz-default',
    label:      'Vuoi creare una verifica?',
    prompt:     'Crea una verifica con 5 domande sull\'argomento da trattare',
    reason:     'Azione utile per iniziare',
    confidence: 0.60,
  });

  // ── Deduplication + trim ───────────────────────────────────────────────────

  const used = new Set(ctx.previousActions ?? []);
  const filtered = candidates.filter(s => !used.has(s.id));

  // Keep highest-confidence items first (candidates are already ordered by
  // signal priority, so stable sort preserves intent while surfacing best fit).
  return filtered
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_SUGGESTIONS);
}

