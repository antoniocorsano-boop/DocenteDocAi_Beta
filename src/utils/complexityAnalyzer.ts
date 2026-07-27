/**
 * utils/complexityAnalyzer.ts — P38.5
 *
 * Classifies prompt complexity from text alone.
 * Pure function — no side effects, fully testable.
 *
 * Score → Mode mapping:
 *   ≥ 4 → 'deep'
 *   ≥ 2 → 'balanced'
 *   else → 'fast'
 */
import type { Mode } from '@/modules/orchestration/ModeEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ComplexityDomain = 'didattica' | 'analisi' | 'chat';

export interface ComplexityResult {
  score:         number;
  signals:       string[];
  domain:        ComplexityDomain;
  suggestedMode: Mode;
}

// ── Patterns ──────────────────────────────────────────────────────────────────

const ANALYTICAL_RE = /analizza|confronta|spiega|valuta|riassumi|approfondisci|argomenta|dimostra|interpreta/i;
const PROCEDURAL_RE = /step|passaggi|procedura|numera|elenca|come fare|pianifica|sequenza|ordine/i;
const DIDATTICA_RE  = /uda|lezione|classe|alunno|docente|competenza|obiettivo|curricolo|valutazione|rubrica/i;

// ── Analyzer ──────────────────────────────────────────────────────────────────

export function analyzeComplexity(text: string): ComplexityResult {
  const words   = text.trim().split(/\s+/).filter(Boolean);
  const signals: string[] = [];
  let score = 0;

  if (ANALYTICAL_RE.test(text)) { score += 2; signals.push('analytical'); }
  if (PROCEDURAL_RE.test(text)) { score += 2; signals.push('procedural'); }
  if (DIDATTICA_RE.test(text))  { score += 1; signals.push('didattica');  }
  if (words.length > 50)        { score += 2; signals.push('long');       }
  else if (words.length > 20)   { score += 1; signals.push('medium');     }
  if (/\n/.test(text))          { score += 1; signals.push('multiline');  }
  if ((text.match(/\?/g) ?? []).length >= 2) { score += 1; signals.push('multi-question'); }

  const domain: ComplexityDomain =
    signals.includes('didattica')                                   ? 'didattica' :
    signals.includes('analytical') || signals.includes('procedural') ? 'analisi'   : 'chat';

  const suggestedMode: Mode =
    score >= 4 ? 'deep' :
    score >= 2 ? 'balanced' : 'fast';

  return { score, signals, domain, suggestedMode };
}
