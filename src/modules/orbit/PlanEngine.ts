/**
 * modules/orbit/PlanEngine.ts — P43 Smart Intake Plan Generator
 *
 * Pure rule-based function.
 * Analyzes the user's input text and produces an action plan
 * that is injected as an `orbit_plan` UIBlock in the chat response.
 *
 * No external dependencies — safe for import anywhere.
 */
import { detectDomainIntent }               from './DomainIntentEngine';
import type { DomainIntent }               from './DomainIntentEngine';
import { matchLegacyIntent }               from '@/modules/orchestration/legacyIntentMap';

export type { DomainIntent };

export interface PlanStep {
  id:               string;
  label:            string;
  /** Optional inline handler — executed client-side instead of sending a prompt. */
  action?:          () => void;
  /** When true, OrbitPlanBlock may auto-run this step without user confirmation. */
  autoExecutable?:  boolean;
}

export interface Plan {
  title:           string;
  steps:           PlanStep[];
  confidence:      number;
  /** Domain intent detected by DomainIntentEngine */
  intent:          DomainIntent;
  /** Human-readable intent label for the UI badge */
  intentLabel:     string;
  /** Structured execution prompt — sent to orchestrator when Avvia fires */
  executionPrompt: string;
}

const ASSESSMENT_KEYWORDS = ['verifica', 'test', 'quiz', 'domande', 'interrogazione', 'esercizi'];
const DOCUMENT_KEYWORDS   = ['documento', 'testo', 'leggi', 'analizza', 'riassumi', 'sintesi'];
const LESSON_KEYWORDS     = ['lezione', 'piano', 'programmazione', 'uda', 'unità', 'didattica', 'obiettivi'];
const FEEDBACK_KEYWORDS   = ['feedback', 'valuta', 'corregg', 'voto', 'giudizio'];

/**
 * Build a rule-based action plan from plain-text input.
 * Returns `null` for trivial or very short inputs (< 15 chars).
 * Caller: useSmartChat — inject as orbit_plan block when confidence >= 0.65.
 */
export function buildPlan(input: string): Plan | null {
  const trimmed = input.trim();
  if (trimmed.length < 15) return null;

  const lower = trimmed.toLowerCase();
  const domainResult = detectDomainIntent(trimmed);

  // Sprint B — legacy intent map: check DocenteDocAI domain flows first
  const legacyIntent = matchLegacyIntent(trimmed);
  if (legacyIntent) {
    return {
      title:           legacyIntent.title,
      steps:           legacyIntent.steps,
      confidence:      legacyIntent.confidence,
      intent:          legacyIntent.domain,
      intentLabel:     legacyIntent.intentLabel,
      executionPrompt: legacyIntent.executionPrompt(trimmed),
    };
  }

  let title: string;
  let steps: PlanStep[];
  let confidence: number;

  if (ASSESSMENT_KEYWORDS.some(kw => lower.includes(kw))) {
    title      = 'Creazione verifica';
    steps      = [
      { id: 'analyze',  label: 'Analizzo contenuto' },
      { id: 'extract',  label: 'Estraggo concetti chiave' },
      { id: 'generate', label: 'Genero domande' },
    ];
    confidence = 0.85;
  } else if (LESSON_KEYWORDS.some(kw => lower.includes(kw))) {
    title      = 'Pianificazione lezione';
    steps      = [
      { id: 'define',    label: 'Definisco obiettivi' },
      { id: 'structure', label: 'Struttura contenuti' },
      { id: 'finalize',  label: 'Genero piano completo' },
    ];
    confidence = 0.82;
  } else if (FEEDBACK_KEYWORDS.some(kw => lower.includes(kw))) {
    title      = 'Valutazione e feedback';
    steps      = [
      { id: 'read',     label: 'Leggo il testo' },
      { id: 'evaluate', label: 'Valuto secondo criteri' },
      { id: 'draft',    label: 'Scrivo feedback costruttivo' },
    ];
    confidence = 0.80;
  } else if (DOCUMENT_KEYWORDS.some(kw => lower.includes(kw)) || trimmed.length > 200) {
    title      = 'Analisi documento';
    steps      = [
      { id: 'parse',     label: 'Leggo il documento' },
      { id: 'summarize', label: 'Creo sintesi' },
      { id: 'suggest',   label: 'Propongo azioni utili' },
    ];
    confidence = 0.80;
  } else {
    title      = 'Elaborazione richiesta';
    steps      = [
      { id: 'understand', label: 'Comprendo richiesta' },
      { id: 'respond',    label: 'Genero risposta' },
    ];
    confidence = 0.60;
  }

  return {
    title,
    steps,
    confidence,
    intent:          domainResult.intent,
    intentLabel:     domainResult.label,
    executionPrompt: domainResult.executionPrompt,
  };
}
