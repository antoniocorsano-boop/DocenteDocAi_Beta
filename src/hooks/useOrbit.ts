/**
 * useOrbit — thin orchestration hook for OrbitDock skill actions.
 *
 * Maps skill IDs to concrete prompt strings and queues them via
 * `useOrbitSignalStore`. `OrbitChatFAB` consumes the signal, opens the
 * drawer, and fires `triggerPrompt` into the live SmartChat instance.
 *
 * CONSTRAINT: this hook contains ZERO AI logic. It is a pure "intent router".
 */
import { useOrbitSignalStore } from '@/stores/useOrbitSignalStore';
import type { OrbitSuggestion } from '@/modules/orbit/OrbitSuggestionEngine';

// ── Skill → prompt map ─────────────────────────────────────────────────────────

const SKILL_PROMPTS: Record<string, string> = {
  verifica: 'Crea una verifica con 5 domande su questo argomento',
  spiega:   'Spiega in modo più semplice e chiaro il contenuto appena trattato',
  riassumi: 'Fai un riassunto chiaro e breve del contenuto della lezione',
  rubrica:  'Crea una rubrica di valutazione con 4 livelli di competenza',
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export interface UseOrbitReturn {
  /** Run a pre-defined skill by id (static SKILL_PROMPTS map). */
  runSkill:       (type: string) => void;
  /** Directly queue any prompt string — used by OrbitSuggestionEngine. */
  runPrompt:      (prompt: string) => void;
  /**
   * Queue a full OrbitSuggestion: fires its prompt AND records its id for
   * deduplication in the current session.
   */
  runSuggestion:  (suggestion: Pick<OrbitSuggestion, 'id' | 'prompt'>) => void;
}

export function useOrbit(): UseOrbitReturn {
  const setPendingPrompt = useOrbitSignalStore(s => s.setPendingPrompt);
  const recordAction     = useOrbitSignalStore(s => s.recordAction);

  const runSkill = (type: string): void => {
    const prompt = SKILL_PROMPTS[type];
    if (prompt) {
      setPendingPrompt(prompt);
    }
  };

  const runPrompt = (prompt: string): void => {
    if (prompt) {
      setPendingPrompt(prompt);
    }
  };

  const runSuggestion = ({ id, prompt }: Pick<OrbitSuggestion, 'id' | 'prompt'>): void => {
    if (prompt) {
      setPendingPrompt(prompt);
      recordAction(id);
    }
  };

  return { runSkill, runPrompt, runSuggestion };
}

