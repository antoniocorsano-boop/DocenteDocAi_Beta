/**
 * modules/orchestration/SystemPromptBuilder.ts — P37
 *
 * Builds the enriched system prompt sent to the orchestrator before each turn.
 * Pure transformation function — no async, no side-effects, no agent calls.
 *
 * Sections assembled (in order):
 *   1. Base persona — "Sei DocenteDoc AI…"
 *   2. User profile — name, role, school, subject, grade level
 *   3. Mode instructions — verbosity / depth hint per Mode
 *   4. Memory context — RAG snippets (budget-limited)
 *
 * Token budget:
 *   - Default 2 000 tokens (≈8 000 chars)
 *   - Memory section gets ≤30% of budget
 *   - Each memory item truncated to MEMORY_ITEM_MAX_CHARS
 *
 * Resilience:
 *   - Never throws — missing inputs degrade gracefully (sections omitted)
 *   - No hard dependencies on external modules beyond ModeEngine
 */

import type { Mode }              from './ModeEngine';
import { getModeConfig }          from './ModeEngine';
import type { EmotionalStrategy } from './EmotionalEngine';
import { buildEmotionalSection }  from './EmotionalEngine';
import type { CognitiveStyle }    from './CognitiveStyleEngine';
import { buildStyleSection }      from './CognitiveStyleEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  name?:       string;
  role?:       string;
  school?:     string;
  subject?:    string;
  gradeLevel?: string;
}

export interface BuildContextInput {
  /** Optional user profile — omitted sections degrade silently */
  userProfile?:  UserProfile;
  /** RAG memory snippets from semantic search */
  memory?:       string[];
  /** Active execution mode — shapes verbosity and depth */
  mode:          Mode;
  /** Agent-specific params forwarded to orchestrator options */
  agentParams?:  Record<string, unknown>;
  /** Maximum tokens for the full system prompt (default: 2000) */
  maxTokens?:    number;
  /** P38.5: cognitive-emotional strategy modulating tone, depth and guidance */
  emotional?:    EmotionalStrategy;
  /** P39: cognitive style learned from user behaviour */
  cognitiveStyle?: CognitiveStyle;
}

export interface BuiltContext {
  systemPrompt:   string;
  enrichedInput:  Record<string, unknown>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MAX_TOKENS    = 2_000;
const MEMORY_BUDGET_RATIO   = 0.30;  // 30% of token budget for memory
const MEMORY_ITEM_MAX_CHARS = 200;
const CHARS_PER_TOKEN       = 4;

// ── Section builders (pure functions) ─────────────────────────────────────────

function buildPersonaSection(profile: UserProfile | undefined): string {
  const base = 'Sei DocenteDoc AI, un assistente specializzato per i docenti delle scuole italiane.';
  if (!profile) return base;

  const lines: string[] = [base, 'Stai assistendo il seguente docente:'];
  if (profile.name)       lines.push(`  • Nome: ${profile.name}`);
  if (profile.role)       lines.push(`  • Ruolo: ${profile.role}`);
  if (profile.school)     lines.push(`  • Istituto: ${profile.school}`);
  if (profile.subject)    lines.push(`  • Disciplina: ${profile.subject}`);
  if (profile.gradeLevel) lines.push(`  • Classe: ${profile.gradeLevel}`);
  return lines.join('\n');
}

function buildModeSection(mode: Mode): string {
  const cfg = getModeConfig(mode);
  switch (mode) {
    case 'fast':
      return 'ISTRUZIONE: Rispondi in modo conciso e diretto. Un solo punto principale. Niente dettagli supplementari.';
    case 'balanced':
      return 'ISTRUZIONE: Bilancia dettaglio e concisione. Struttura la risposta con chiarezza. Usa elenchi puntati se utile.';
    case 'deep':
      return `ISTRUZIONE: Analisi approfondita richiesta. Puoi usare fino a ${cfg.maxSteps} passaggi di ragionamento. Fornisci dettagli completi, esempi pratici e fonti quando disponibili.`;
    case 'manual':
      return `ISTRUZIONE: Modalità manuale attiva (max ${cfg.maxSteps} step). Mostra ogni passaggio del ragionamento in modo esplicito. L'utente vuole il controllo totale.`;
    case 'creative':
      return `ISTRUZIONE: Modalità creativa attiva (max ${cfg.maxSteps} step). Adotta uno stile libero, narrativo e originale. Privilegia la fluidità e l'espressività rispetto alla struttura rigida.`;
    default: {
      const _exhaustive: never = mode;
      throw new Error(`buildModeSection: unhandled mode "${String(_exhaustive)}"`);
    }
  }
}

function buildMemorySection(memory: string[], tokenBudget: number): string {
  if (!memory.length) return '';

  let charBudget               = Math.floor(tokenBudget * MEMORY_BUDGET_RATIO * CHARS_PER_TOKEN);
  const header                 = 'CONTESTO DALLA MEMORIA:\n';
  charBudget                  -= header.length;

  const selected: string[] = [];
  for (const item of memory) {
    const line = `- ${item.slice(0, MEMORY_ITEM_MAX_CHARS)}\n`;
    if (charBudget - line.length < 0) break;
    selected.push(line);
    charBudget -= line.length;
  }

  return selected.length ? header + selected.join('') : '';
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function buildSystemPrompt(input: BuildContextInput): BuiltContext {
  const maxTokens = input.maxTokens ?? DEFAULT_MAX_TOKENS;

  const sections: string[] = [
    buildPersonaSection(input.userProfile),
    buildModeSection(input.mode),
    buildMemorySection(input.memory ?? [], maxTokens),
    input.emotional      ? buildEmotionalSection(input.emotional)         : '',
    input.cognitiveStyle ? buildStyleSection(input.cognitiveStyle)        : '',
  ].filter(Boolean);

  const systemPrompt = sections.join('\n\n');

  const enrichedInput: Record<string, unknown> = {
    mode:        input.mode,
    agentParams: input.agentParams ?? {},
    hasMemory:   (input.memory?.length ?? 0) > 0,
    memoryCount: input.memory?.length ?? 0,
    userRole:    input.userProfile?.role ?? 'docente',
    subject:     input.userProfile?.subject,
  };

  return { systemPrompt, enrichedInput };
}
