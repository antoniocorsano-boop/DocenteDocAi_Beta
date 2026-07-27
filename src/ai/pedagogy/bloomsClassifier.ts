/**
 * bloomsClassifier.ts — Sprint 6: Pedagogical Alignment
 *
 * Classifies lesson content and UDA phases against Bloom's Revised Taxonomy
 * (Anderson & Krathwohl, 2001) cognitive levels.
 *
 * The six levels (ordered lowest → highest cognitive demand):
 *   1. remember    — recall facts, recognize, list
 *   2. understand  — explain, summarize, classify, compare
 *   3. apply       — use, solve, demonstrate, execute
 *   4. analyze     — differentiate, organize, attribute, examine
 *   5. evaluate    — judge, critique, justify, assess
 *   6. create      — design, construct, produce, formulate
 *
 * Classification is purely lexical (keyword matching on Italian text) — no
 * external API calls.  The confidence score reflects keyword hit rate.
 *
 * Italian keyword sets are compiled from the official MIM competency framework
 * and Italian pedagogical literature.
 */

// ── types ─────────────────────────────────────────────────────────────────────

export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export const BLOOM_LEVELS: BloomLevel[] = [
  'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create',
];

export const BLOOM_LEVEL_LABELS_IT: Record<BloomLevel, string> = {
  remember:   'Ricordare',
  understand: 'Comprendere',
  apply:      'Applicare',
  analyze:    'Analizzare',
  evaluate:   'Valutare',
  create:     'Creare',
};

/** MIM-aligned cognitive verb sets in Italian */
const BLOOM_KEYWORDS: Record<BloomLevel, string[]> = {
  remember: [
    'ricorda', 'ricordare', 'elenca', 'elencare', 'identific', 'riconosc',
    'ripeti', 'ripetere', 'cita', 'citare', 'definisc', 'definire',
    'nomina', 'nominare', 'individua', 'individuare', 'classific',
    'memorizza', 'memorizzare', 'riproduc', 'riprodurre', 'leggi', 'leggere',
  ],
  understand: [
    'compren', 'spiega', 'spiegare', 'descri', 'descrivere', 'riassumi',
    'riassumere', 'parafrasa', 'confronta', 'confrontare', 'interpreta',
    'interpretare', 'illustra', 'classificare', 'distingue', 'distinguere',
    'discuti', 'discutere', 'traduce', 'tradurre', 'generaliz',
  ],
  apply: [
    'applica', 'applicare', 'usa', 'usare', 'utilizza', 'utilizzare',
    'risolvi', 'risolvere', 'dimostra', 'dimostrare', 'calcola', 'calcolare',
    'esegui', 'eseguire', 'costruisc', 'costruire', 'implementa',
    'implementare', 'svolgi', 'svolgere', 'pratica', 'praticare',
    'laboratorio', 'esperimento', 'simula', 'simulare',
  ],
  analyze: [
    'analizza', 'analizzare', 'esamina', 'esaminare', 'scomponi', 'scomporre',
    'differenzia', 'differenziare', 'organizza', 'organizzare', 'attribuisci',
    'confronta criticamente', 'struttura', 'relaziona', 'relazionare',
    'mappa', 'mappatura', 'indaga', 'indagare', 'inferisce', 'inferire',
  ],
  evaluate: [
    'valuta', 'valutare', 'giudica', 'giudicare', 'critica', 'criticare',
    'giustifica', 'giustificare', 'argomenta', 'argomentare', 'misura',
    'misurare', 'verifica', 'verificare', 'seleziona', 'selezionare',
    'scegli', 'scegliere', 'difendi', 'difendere', 'stabilisce',
  ],
  create: [
    'crea', 'creare', 'progetta', 'progettare', 'produce', 'produrre',
    'componi', 'comporre', 'sviluppa', 'sviluppare', 'costruisc',
    'formula', 'formulare', 'ideazione', 'idea', 'inventa', 'inventare',
    'elabora', 'elaborare', 'design', 'proposta', 'piano', 'pianifica',
    'sintetizza', 'sintetizzare',
  ],
};

export interface BloomClassification {
  /** Primary (highest-scoring) Bloom's level */
  primaryLevel: BloomLevel;
  /** Numeric cognitive level 1–6 (remember=1, create=6) */
  levelIndex: number;
  /** Score 0–1 for each level (fraction of matching keywords) */
  scores: Record<BloomLevel, number>;
  /** Overall classification confidence 0–1 */
  confidence: number;
  /** Matched Italian keywords that drove the classification */
  matchedKeywords: string[];
}

// ── helpers ───────────────────────────────────────────────────────────────────

function normalise(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function countMatches(tokens: string[], keywords: string[]): { count: number; matched: string[] } {
  const matched: string[] = [];
  for (const kw of keywords) {
    const normKw = normalise(kw);
    if (tokens.some(t => t.includes(normKw))) {
      matched.push(kw);
    }
  }
  return { count: matched.length, matched };
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Classify a text string (lesson content, UDA phase description, obiettivi…)
 * against Bloom's Revised Taxonomy levels.
 *
 * Returns nullish classification (primaryLevel='remember', confidence=0) for
 * empty or very short text rather than throwing.
 */
export function classifyBloom(text: string): BloomClassification {
  if (!text || text.trim().length < 3) {
    const zeroScores = Object.fromEntries(BLOOM_LEVELS.map(l => [l, 0])) as Record<BloomLevel, number>;
    return {
      primaryLevel: 'remember',
      levelIndex: 1,
      scores: zeroScores,
      confidence: 0,
      matchedKeywords: [],
    };
  }

  const tokens = normalise(text).split(/[\s,;:.!?()[\]{}"']+/).filter(Boolean);
  let totalMatched = 0;
  const allMatched: string[] = [];

  const rawCounts: Record<BloomLevel, number> = {} as Record<BloomLevel, number>;
  const levelMatched: Record<BloomLevel, string[]> = {} as Record<BloomLevel, string[]>;

  for (const level of BLOOM_LEVELS) {
    const { count, matched } = countMatches(tokens, BLOOM_KEYWORDS[level]);
    rawCounts[level] = count;
    levelMatched[level] = matched;
    totalMatched += count;
    allMatched.push(...matched);
  }

  // Normalize scores relative to total matched keywords
  const scores: Record<BloomLevel, number> = {} as Record<BloomLevel, number>;
  for (const level of BLOOM_LEVELS) {
    scores[level] = totalMatched > 0 ? rawCounts[level] / totalMatched : 0;
  }

  // Pick highest scoring level; tie-break towards higher cognitive level
  let primaryLevel: BloomLevel = 'remember';
  let maxScore = -1;
  for (let i = BLOOM_LEVELS.length - 1; i >= 0; i--) {
    const level = BLOOM_LEVELS[i];
    if (scores[level] > maxScore) {
      maxScore = scores[level];
      primaryLevel = level;
    }
  }

  // If no keywords matched at all, default confidence 0 + level = remember
  if (totalMatched === 0) {
    primaryLevel = 'remember';
  }

  const levelIndex = BLOOM_LEVELS.indexOf(primaryLevel) + 1;

  // Confidence: how dominant the top level is + keyword density
  const keywordDensity = Math.min(1, (totalMatched / Math.max(tokens.length, 1)) * 10);
  const dominance = totalMatched > 0 ? (rawCounts[primaryLevel] / totalMatched) : 0;
  const confidence = parseFloat(((keywordDensity * 0.4 + dominance * 0.6) * (totalMatched > 0 ? 1 : 0)).toFixed(3));

  return {
    primaryLevel,
    levelIndex,
    scores,
    confidence,
    matchedKeywords: [...new Set(allMatched)],
  };
}

/**
 * Classify an array of texts (e.g. all UDA phases) and return the
 * distribution of Bloom levels found, plus a coverage set.
 */
export interface BloomDistribution {
  /** Per-level count across all texts */
  counts: Record<BloomLevel, number>;
  /** Per-level fraction */
  fractions: Record<BloomLevel, number>;
  /** Highest level reached in any text */
  maxLevel: BloomLevel;
  /** Lowest level represented */
  minLevel: BloomLevel;
  /** Number of distinct levels covered */
  uniqueLevelsCount: number;
  /** Individual classifications (one per input text) */
  classifications: BloomClassification[];
  /** Mean cognitive index [1, 6] across all inputs */
  meanCognitiveIndex: number;
}

export function classifyBloomDistribution(texts: string[]): BloomDistribution {
  const filtered = texts.filter(t => t && t.trim().length > 3);
  if (filtered.length === 0) {
    const zero = Object.fromEntries(BLOOM_LEVELS.map(l => [l, 0])) as Record<BloomLevel, number>;
    return {
      counts: zero,
      fractions: zero,
      maxLevel: 'remember',
      minLevel: 'remember',
      uniqueLevelsCount: 0,
      classifications: [],
      meanCognitiveIndex: 0,
    };
  }

  const classifications = filtered.map(t => classifyBloom(t));
  const counts: Record<BloomLevel, number> = Object.fromEntries(BLOOM_LEVELS.map(l => [l, 0])) as Record<BloomLevel, number>;

  for (const c of classifications) {
    counts[c.primaryLevel]++;
  }

  const total = classifications.length;
  const fractions: Record<BloomLevel, number> = Object.fromEntries(
    BLOOM_LEVELS.map(l => [l, parseFloat((counts[l] / total).toFixed(3))])
  ) as Record<BloomLevel, number>;

  const presentLevels = BLOOM_LEVELS.filter(l => counts[l] > 0);
  const maxLevel = presentLevels.length > 0 ? presentLevels[presentLevels.length - 1] : 'remember';
  const minLevel = presentLevels.length > 0 ? presentLevels[0] : 'remember';

  const meanCognitiveIndex = parseFloat(
    (classifications.reduce((s, c) => s + c.levelIndex, 0) / classifications.length).toFixed(2)
  );

  return {
    counts,
    fractions,
    maxLevel,
    minLevel,
    uniqueLevelsCount: presentLevels.length,
    classifications,
    meanCognitiveIndex,
  };
}
