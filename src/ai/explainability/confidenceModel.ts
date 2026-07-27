/**
 * confidenceModel.ts — Estimates the reliability of an AI risk prediction.
 *
 * Confidence is NOT the same as riskProbability.  It answers:
 * "How much should the teacher trust this prediction?"
 *
 * Inputs (all contribute additively to a [0,1] score):
 *   1. Data volume   — more evaluations → higher confidence
 *   2. Data recency  — recent evaluations → higher confidence
 *   3. Consistency   — low grade volatility → higher confidence
 *   4. Subject spread — multiple subjects → higher confidence
 *   5. Temporal span  — data spread over several weeks → higher confidence
 *
 * Each component is normalised to [0,1] and weighted; the weighted sum is
 * the final confidence score.
 */

import type { Valutazione } from '@/types/student.types';

// ── types ─────────────────────────────────────────────────────────────────────

export type ConfidenceLevel = 'very_high' | 'high' | 'medium' | 'low' | 'insufficient';

export interface ConfidenceBreakdown {
  /** 0–1 composite confidence score */
  score: number;
  level: ConfidenceLevel;
  /** Human-readable label (Italian) */
  label: string;
  /** Colour hint for UI (aligned with MD3 semantic tokens) */
  colorToken: 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning';
  components: {
    dataVolume:    number; // 0–1
    dataRecency:   number; // 0–1
    consistency:   number; // 0–1
    subjectSpread: number; // 0–1
    temporalSpan:  number; // 0–1
  };
}

// ── weights ───────────────────────────────────────────────────────────────────

const W = {
  dataVolume:    0.30,
  dataRecency:   0.25,
  consistency:   0.20,
  subjectSpread: 0.15,
  temporalSpan:  0.10,
} as const;

// ── helpers ───────────────────────────────────────────────────────────────────

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function parseGrade(voto: string): number {
  const n = parseFloat(voto.replace(',', '.'));
  return Number.isFinite(n) ? n : -1;
}

function parseDate(iso: string): number {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.getTime() : 0;
}

function variance(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = nums.reduce((s, n) => s + n, 0) / nums.length;
  return nums.reduce((s, n) => s + (n - m) ** 2, 0) / nums.length;
}

// ── component calculators ─────────────────────────────────────────────────────

/**
 * Volume: saturates at 10 evaluations → 1.0
 * 0 evals → 0, 3 evals → 0.45, 6 evals → 0.78, 10+ → 1.0
 */
function volumeScore(count: number): number {
  return clamp01(1 - Math.exp(-0.3 * count));
}

/**
 * Recency: the fraction of evaluations from the last 60 days.
 * All recent → 1.0; all old → 0.0.
 */
function recencyScore(evals: Valutazione[]): number {
  if (!evals.length) return 0;
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000; // 60 days ago
  const recent = evals.filter(e => parseDate(e.data) >= cutoff).length;
  return clamp01(recent / evals.length);
}

/**
 * Consistency: derived from inverse grade volatility.
 * Variance === 0 → perfect consistency (1.0); variance >= 5 → low (0.0).
 */
function consistencyScore(evals: Valutazione[]): number {
  const grades = evals.map(e => parseGrade(e.voto)).filter(n => n >= 0);
  if (grades.length < 2) return 0.5; // uncertain
  const v = variance(grades);
  return clamp01(1 - v / 5); // normalise: variance of 5 → score 0
}

/**
 * Subject spread: ≥ 3 subjects → 1.0; 1 subject → 0.33.
 */
function subjectSpreadScore(evals: Valutazione[]): number {
  const subjects = new Set(evals.map(e => e.materia)).size;
  return clamp01(subjects / 3);
}

/**
 * Temporal span: ≥ 90-day window → 1.0; < 7 days → 0.
 */
function temporalSpanScore(evals: Valutazione[]): number {
  if (evals.length < 2) return 0;
  const times = evals.map(e => parseDate(e.data)).filter(t => t > 0).sort((a, b) => a - b);
  if (times.length < 2) return 0;
  const spanDays = (times[times.length - 1] - times[0]) / (24 * 60 * 60 * 1000);
  return clamp01(spanDays / 90);
}

// ── confidence levels ─────────────────────────────────────────────────────────

function toLevel(score: number): {
  level: ConfidenceLevel;
  label: string;
  colorToken: ConfidenceBreakdown['colorToken'];
} {
  if (score >= 0.80) return { level: 'very_high', label: 'Molto alta',     colorToken: 'primary'   };
  if (score >= 0.60) return { level: 'high',      label: 'Alta',           colorToken: 'secondary' };
  if (score >= 0.40) return { level: 'medium',    label: 'Media',          colorToken: 'tertiary'  };
  if (score >= 0.20) return { level: 'low',       label: 'Bassa',          colorToken: 'warning'   };
  return                   { level: 'insufficient',label: 'Insufficiente', colorToken: 'error'     };
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Computes a full confidence breakdown for a student's evaluations.
 *
 * The returned `score` is independent of the risk score — it represents
 * data quality and should be shown alongside risk predictions in the UI.
 */
export function computeConfidence(evaluations: Valutazione[]): ConfidenceBreakdown {
  const vol  = round3(volumeScore(evaluations.length));
  const rec  = round3(recencyScore(evaluations));
  const con  = round3(consistencyScore(evaluations));
  const sub  = round3(subjectSpreadScore(evaluations));
  const span = round3(temporalSpanScore(evaluations));

  const score = round3(
    vol  * W.dataVolume    +
    rec  * W.dataRecency   +
    con  * W.consistency   +
    sub  * W.subjectSpread +
    span * W.temporalSpan,
  );

  const { level, label, colorToken } = toLevel(score);

  return {
    score,
    level,
    label,
    colorToken,
    components: {
      dataVolume:    vol,
      dataRecency:   rec,
      consistency:   con,
      subjectSpread: sub,
      temporalSpan:  span,
    },
  };
}

/**
 * Batch computation for a whole class.
 * Returns a map keyed by studentId.
 * `evaluations` may contain records for multiple students.
 */
export function computeClassConfidence(
  studentIds: string[],
  evaluations: Valutazione[],
): Map<string, ConfidenceBreakdown> {
  const result = new Map<string, ConfidenceBreakdown>();
  for (const id of studentIds) {
    const studentEvals = evaluations.filter(e => e.studenteId === id);
    result.set(id, computeConfidence(studentEvals));
  }
  return result;
}
