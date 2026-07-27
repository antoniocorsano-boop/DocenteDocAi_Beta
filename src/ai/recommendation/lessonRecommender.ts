/**
 * lessonRecommender.ts — Sprint 8: AI Decision Support
 *
 * Generates prioritised pedagogical recommendations by synthesising signals
 * from three upstream sprint systems:
 *
 *   • Sprint 6  — PedagogyReport  (Bloom's alignment, active learning, inclusion)
 *   • Sprint 7  — TrustReport     (data quality, fairness, coverage)
 *   • Sprint 3  — BenchmarkMetrics (F1, risk-detection, class health)
 *
 * Each recommendation is assigned an `impactScore` [0–1].
 * Impact = weighted average of how far each contributing signal is below
 * its target threshold — a higher gap → higher urgency.
 *
 * Sort order: descending impactScore (most urgent first).
 */

import type { PedagogyReport } from '../pedagogy/pedagogyReport';
import type { AlignmentDimension } from '../pedagogy/alignmentScorer';
import type { TrustReport } from '../trust/trustReport';
import type { BenchmarkMetrics } from '../simulation/benchmarkMetrics';

// ── public types ──────────────────────────────────────────────────────────────

export type RecommendationAction =
  | 'adjustContent'   // revise lesson content to cover weak areas
  | 'addExercise'     // add targeted exercise / activity
  | 'reschedule'      // re-sequence lessons / UDAs
  | 'highlightRisk';  // alert teacher to at-risk students

export interface Recommendation {
  id:               string;
  title:            string;
  description:      string;
  /** Urgency score [0–1]: 1 = maximum urgency */
  impactScore:      number;
  suggestedAction:  RecommendationAction;
  /** Source sprint that triggered this recommendation */
  source:           'pedagogy' | 'trust' | 'simulation';
  /** Italian tags for display chips */
  tags:             string[];
}

// ── constants ─────────────────────────────────────────────────────────────────

/** Target thresholds — scores below these trigger recommendations */
const PEDAGOGY_TARGET     = 0.65;
const TRUST_TARGET        = 0.60;
const F1_TARGET           = 0.70;
const RISK_DETECTION_TARGET = 0.70;

/** Dimension labels for Italian recommendations */
const DIM_LABELS_IT: Record<AlignmentDimension, string> = {
  bloomCoverage:         'copertura della tassonomia di Bloom',
  cognitiveProgression:  'progressione cognitiva',
  activeLearningRatio:   'attività di ordine superiore (HOTS)',
  inclusionSignals:      'segnali di inclusione',
  diversityOfMethods:    'diversità metodologica',
};

const DIM_TITLES_IT: Record<AlignmentDimension, string> = {
  bloomCoverage:         'Amplia la tassonomia di Bloom',
  cognitiveProgression:  'Struttura la progressione cognitiva',
  activeLearningRatio:   'Aumenta le attività HOTS',
  inclusionSignals:      'Rafforza gli adattamenti inclusivi',
  diversityOfMethods:    'Diversifica i metodi didattici',
};

const DIM_DESCRIPTIONS_IT: Record<AlignmentDimension, string> = {
  bloomCoverage:
    'Le lezioni non coprono tutti i livelli della tassonomia di Bloom. Aggiungi attività di analisi, valutazione e creazione per sviluppare competenze cognitive più elevate.',
  cognitiveProgression:
    'Le attività non mostrano una progressione cognitiva chiara. Riorganizza lezioni e fasi in ordine crescente di complessità.',
  activeLearningRatio:
    'La quota di attività HOTS è inferiore al 40%. Integra laboratori, problem-solving e produzione per superare questa soglia.',
  inclusionSignals:
    'Mancano adattamenti espliciti per studenti BES/DSA. Inserisci strategie inclusive e materiali personalizzati.',
  diversityOfMethods:
    'Il repertorio metodologico è limitato. Alterna teoria, laboratorio, verifica formativa e attività collaborative.',
};

// ── helpers ───────────────────────────────────────────────────────────────────

let _seq = 0;
function nextId(prefix: string): string {
  return `rec-${prefix}-${++_seq}`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function gap(score: number, target: number): number {
  return Math.max(0, target - score);
}

/** @internal — reset the ID sequence between test runs to ensure deterministic IDs */
export function _resetIdSeqForTesting(): void { _seq = 0; }

// ── pedagogy recommendations ──────────────────────────────────────────────────

function fromPedagogy(reports: PedagogyReport[]): Recommendation[] {
  if (reports.length === 0) return [];

  const recs: Recommendation[] = [];

  for (const report of reports) {
    if (report.overallScore >= PEDAGOGY_TARGET) continue;

    // Find the weakest dimensions — generate up to 2 per report
    const dims: AlignmentDimension[] = [
      'bloomCoverage',
      'cognitiveProgression',
      'activeLearningRatio',
      'inclusionSignals',
      'diversityOfMethods',
    ];

    // Collect dimension scores from lessonScore and mean of udaScores
    const dimScores: Record<AlignmentDimension, number> = {} as Record<AlignmentDimension, number>;
    for (const d of dims) {
      const lessonVal = report.lessonScore?.dimensions[d] ?? 1;
      const udaMean =
        report.udaScores.length > 0
          ? report.udaScores.reduce((s, u) => s + u.dimensions[d], 0) / report.udaScores.length
          : 1;
      dimScores[d] = (lessonVal + udaMean) / 2;
    }

    const weakDims = dims
      .filter(d => dimScores[d] < PEDAGOGY_TARGET)
      .sort((a, b) => dimScores[a] - dimScores[b])
      .slice(0, 2);

    for (const d of weakDims) {
      const g = gap(dimScores[d], PEDAGOGY_TARGET);
      const overallGap = gap(report.overallScore, PEDAGOGY_TARGET);
      const impactScore = round3(clamp01((g + overallGap) / 2));

      const action: RecommendationAction =
        d === 'activeLearningRatio' || d === 'bloomCoverage'
          ? 'addExercise'
          : d === 'cognitiveProgression'
          ? 'reschedule'
          : 'adjustContent';

      recs.push({
        id: nextId('ped'),
        title: DIM_TITLES_IT[d],
        description: DIM_DESCRIPTIONS_IT[d],
        impactScore,
        suggestedAction: action,
        source: 'pedagogy',
        tags: ['Pedagogia', DIM_LABELS_IT[d]],
      });
    }

    // Also surface any opportunities from the report directly
    if (report.opportunities.length > 0 && weakDims.length === 0) {
      const opp = report.opportunities[0];
      recs.push({
        id: nextId('ped'),
        title: 'Opportunità di miglioramento didattico',
        description: opp,
        impactScore: round3(clamp01(gap(report.overallScore, PEDAGOGY_TARGET) + 0.05)),
        suggestedAction: 'adjustContent',
        source: 'pedagogy',
        tags: ['Pedagogia'],
      });
    }
  }

  return recs;
}

// ── trust recommendations ─────────────────────────────────────────────────────

function fromTrust(reports: TrustReport[]): Recommendation[] {
  if (reports.length === 0) return [];

  const recs: Recommendation[] = [];

  for (const report of reports) {
    const score = report.classScore.overallScore;
    if (score >= TRUST_TARGET) continue;

    const g = gap(score, TRUST_TARGET);

    // Map trust warnings to recommendations
    for (const warn of report.classScore.warningFlags.slice(0, 2)) {
      recs.push({
        id: nextId('trust'),
        title: 'Affidabilità AI ridotta — azione richiesta',
        description: warn,
        impactScore: round3(clamp01(g + 0.10)),
        suggestedAction: 'highlightRisk',
        source: 'trust',
        tags: ['Fiducia AI', `Livello: ${report.trustLevelLabel}`],
      });
    }

    // Generic trust report recommendations
    for (const r of report.recommendations.slice(0, 1)) {
      recs.push({
        id: nextId('trust'),
        title: 'Migliora la qualità dei dati AI',
        description: r,
        impactScore: round3(clamp01(g)),
        suggestedAction: 'adjustContent',
        source: 'trust',
        tags: ['Qualità dati', 'Fiducia AI'],
      });
    }
  }

  return recs;
}

// ── simulation / benchmark recommendations ────────────────────────────────────

function fromBenchmarks(benchmarks: BenchmarkMetrics[]): Recommendation[] {
  if (benchmarks.length === 0) return [];

  const recs: Recommendation[] = [];

  // Average across all benchmark runs
  const n = benchmarks.length;
  const avgF1 = benchmarks.reduce((s, b) => s + (b.f1Score ?? 0), 0) / n;
  const avgRDR = benchmarks.reduce((s, b) => s + b.riskDetectionRate, 0) / n;
  const avgFPR = benchmarks.reduce((s, b) => s + b.falsePositiveRate, 0) / n;
  const avgHealth = benchmarks.reduce((s, b) => s + b.classHealthScore, 0) / n;

  if (avgF1 < F1_TARGET) {
    recs.push({
      id: nextId('sim'),
      title: 'Precisione AI insufficiente — rivedi i dati di input',
      description: `L'F1 medio su ${n} simulazioni è ${(avgF1 * 100).toFixed(1)}% (obiettivo ≥ ${F1_TARGET * 100}%). Aumenta il numero di valutazioni per studente per migliorare la qualità del modello.`,
      impactScore: round3(clamp01(gap(avgF1, F1_TARGET) * 2)),
      suggestedAction: 'highlightRisk',
      source: 'simulation',
      tags: ['Simulazione', `F1: ${(avgF1 * 100).toFixed(0)}%`],
    });
  }

  if (avgRDR < RISK_DETECTION_TARGET) {
    recs.push({
      id: nextId('sim'),
      title: 'Tassi di rilevamento rischio bassi',
      description: `Il modello rileva solo il ${(avgRDR * 100).toFixed(1)}% degli studenti a rischio reale. Inserisci valutazioni recenti per aumentare la copertura diagnostica.`,
      impactScore: round3(clamp01(gap(avgRDR, RISK_DETECTION_TARGET) * 1.5)),
      suggestedAction: 'highlightRisk',
      source: 'simulation',
      tags: ['Rilevamento rischio', `RDR: ${(avgRDR * 100).toFixed(0)}%`],
    });
  }

  if (avgFPR > 0.20) {
    recs.push({
      id: nextId('sim'),
      title: 'Falsi positivi elevati — verifica i segnali AI',
      description: `Il ${(avgFPR * 100).toFixed(1)}% degli studenti non a rischio viene segnalato erroneamente. Aggiungi valutazioni formative per ridurre il rumore del modello.`,
      impactScore: round3(clamp01(avgFPR)),
      suggestedAction: 'adjustContent',
      source: 'simulation',
      tags: ['Falsi positivi', `FPR: ${(avgFPR * 100).toFixed(0)}%`],
    });
  }

  if (avgHealth < 50) {
    recs.push({
      id: nextId('sim'),
      title: 'Salute della classe critica',
      description: `Il punteggio medio di salute della classe è ${avgHealth.toFixed(0)}/100. Interveni con attività di recupero e pianifica una verifica formativa di classe.`,
      impactScore: round3(clamp01(gap(avgHealth / 100, 0.50) + 0.15)),
      suggestedAction: 'addExercise',
      source: 'simulation',
      tags: ['Salute classe', `Score: ${avgHealth.toFixed(0)}/100`],
    });
  }

  return recs;
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Generate prioritised recommendations by combining all three signal sources.
 *
 * @param pedagogyReports  From Sprint 6 `generatePedagogyReport()`
 * @param trustReports     From Sprint 7 `generateTrustReport()`
 * @param benchmarks       From Sprint 3 `computeBenchmarkMetrics()`
 *
 * Returns an empty array when all three input arrays are empty.
 * Results are sorted by `impactScore` descending.
 */
export function generateRecommendations(
  pedagogyReports: PedagogyReport[],
  trustReports:    TrustReport[],
  benchmarks:      BenchmarkMetrics[],
): Recommendation[] {
  if (
    pedagogyReports.length === 0 &&
    trustReports.length === 0 &&
    benchmarks.length === 0
  ) {
    return [];
  }

  const all: Recommendation[] = [
    ...fromPedagogy(pedagogyReports),
    ...fromTrust(trustReports),
    ...fromBenchmarks(benchmarks),
  ];

  // Deduplicate by suggestedAction within a source (keep highest impact)
  const seen = new Map<string, Recommendation>();
  for (const r of all) {
    const key = `${r.source}::${r.suggestedAction}::${r.title}`;
    const existing = seen.get(key);
    if (!existing || r.impactScore > existing.impactScore) {
      seen.set(key, r);
    }
  }

  return [...seen.values()].sort((a, b) => b.impactScore - a.impactScore);
}
