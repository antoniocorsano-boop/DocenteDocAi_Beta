/**
 * modules/orchestration/IntentEngine.ts — P33 Cognitive Orchestration Layer
 *
 * Classifies user input into a structured IntentResult that drives the
 * CognitiveOrchestrator's planning and execution decisions.
 *
 * Design principles:
 *   - Purely deterministic: same input always yields the same result
 *   - Zero external API calls: keyword-based classification (no LLM round-trip)
 *   - Bilingual keywords (IT + EN): the app targets Italian users but technical
 *     terms are often typed in English
 *   - Conservative confidence: never exceeds 0.92 so the synth can always
 *     apply a reflection pass when needed
 *
 * P34 upgrade path: replace with a lightweight text classifier (ONNX / TensorFlow
 * Lite) for multi-label intent detection without network calls.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type IntentType = 'simple' | 'multi_step' | 'analysis' | 'compliance' | 'monitoring';

export interface IntentResult {
  /** Semantic category of the user request */
  type:             IntentType;
  /** Confidence score [0, 1] — used by orchestrator to decide on reflection */
  confidence:       number;
  /** true → TaskPlanner should decompose input into steps */
  requiresPlanning: boolean;
  /** Ordered list of agent IDs to invoke */
  agents:           string[];
  /** true → memory search should be performed before execution */
  useMemory:        boolean;
}

// ── Keyword sets ──────────────────────────────────────────────────────────────

const COMPLIANCE_KW = [
  'conformità', 'gdpr', 'privacy', 'normativa', 'regola', 'compliance',
  'audit', 'violazione', 'trattamento', 'dati personali', 'data protection',
  'sicurezza dati', 'policy', 'obblighi', 'regolamento', 'data breach',
  'consenso', 'articolo', 'directive', 'violation', 'regulation',
];

const MONITORING_KW = [
  'monitora', 'monitoraggio', 'osserva', 'controlla', 'stato', 'health',
  'report', 'alert', 'metriche', 'performance', 'uptime', 'sistema',
  'diagnostica', 'dashboard', 'statistiche', 'contatore', 'utilizzo',
  'monitor', 'status', 'metrics', 'check', 'error rate',
];

const ANALYSIS_KW = [
  'analizza', 'analisi', 'comprendi', 'spiega', 'insight', 'pattern',
  'cognitiva', 'valuta', 'interpreta', 'studia', 'capire', 'diagnosi',
  'identifica', 'tendenza', 'confronta', 'perché', 'causa', 'motivo',
  'approfondisci', 'riassumi', 'summarize', 'analyze', 'explain', 'reason',
];

const MULTI_STEP_KW = [
  'e poi', 'poi', 'inoltre', 'successivamente', 'dopo di che', 'infine',
  'prima di tutto', 'in seguito', 'passaggio', 'sequenza', 'workflow',
  'prima', 'dopo', 'e anche', 'e dopo', 'step by step', 'first', 'then',
  'finally', 'additionally', 'next', 'also', 'e infine', 'dopodiché',
];

// ── Agent routing table ───────────────────────────────────────────────────────

const AGENT_MAP: Record<IntentType, string[]> = {
  simple:     ['agent.cognitive'],
  compliance: ['agent.compliance'],
  monitoring: ['agent.monitoring'],
  analysis:   ['agent.cognitive'],
  multi_step: ['agent.cognitive', 'agent.compliance'],
};

// ── Scoring ───────────────────────────────────────────────────────────────────

const MEMORY_MIN_LENGTH = 30; // chars — short greetings skip memory lookup

/** Count how many keyword strings are found in `text` (substring match). */
function countMatches(text: string, keywords: string[]): number {
  return keywords.reduce((n, kw) => n + (text.includes(kw) ? 1 : 0), 0);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Classify `input` and return a structured IntentResult.
 *
 * Never throws. Empty input returns a 'simple' intent with high confidence.
 */
export function classifyIntent(input: string): IntentResult {
  if (!input.trim()) {
    return {
      type:             'simple',
      confidence:       0.90,
      requiresPlanning: false,
      agents:           AGENT_MAP.simple,
      useMemory:        false,
    };
  }

  const lower = input.toLowerCase();

  // Score each candidate type
  const scores: Record<Exclude<IntentType, 'simple'>, number> = {
    compliance: countMatches(lower, COMPLIANCE_KW),
    monitoring: countMatches(lower, MONITORING_KW),
    analysis:   countMatches(lower, ANALYSIS_KW),
    multi_step: countMatches(lower, MULTI_STEP_KW),
  };

  // Find the winner (deterministic: entries are in insertion order, first highest wins)
  let winnerType: IntentType   = 'simple';
  let winnerScore = 0;

  for (const [t, s] of Object.entries(scores) as Array<[Exclude<IntentType, 'simple'>, number]>) {
    if (s > winnerScore) {
      winnerScore = s;
      winnerType  = t;
    }
  }

  // Confidence: starts at 0.55 for 1 keyword match, caps at 0.92
  // For the default 'simple' case, confidence is 0.85 (high — we're sure it's simple)
  const confidence = winnerScore > 0
    ? Math.min(0.92, 0.55 + winnerScore * 0.12)
    : 0.85;

  const type        = winnerType;
  const useMemory   = type === 'analysis'
                   || type === 'multi_step'
                   || input.length > MEMORY_MIN_LENGTH;

  return {
    type,
    confidence,
    requiresPlanning: type === 'multi_step',
    agents:           AGENT_MAP[type],
    useMemory,
  };
}
