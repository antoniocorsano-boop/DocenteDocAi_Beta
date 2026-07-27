/**
 * riskFactorAnalyzer.ts — Extracts quantified, human-readable risk signals
 * from raw student data.
 *
 * Each factor carries an `impact` weight in [0, 1] that reflects its relative
 * contribution to the overall risk score.  Factors are ordered by descending
 * impact so UIs can truncate to the top-N most important contributors.
 *
 * Design principles:
 *  - No external deps (pure functions, no network/IDB calls).
 *  - Fully deterministic: same inputs → same output.
 *  - Aligned with the existing `riskModel.ts` weights so explanations
 *    are **consistent** with the model's predictions.
 */

import type { Studente, Valutazione } from '@/types/student.types';

// ── types ─────────────────────────────────────────────────────────────────────

/** Machine-readable factor identifier */
export type RiskFactorId =
  | 'grade_below_sufficiency'
  | 'grade_drop'
  | 'declining_trend'
  | 'few_evaluations'
  | 'low_recent_grades'
  | 'grade_volatility'
  | 'multi_subject_risk'
  | 'special_needs_no_support_signal'
  | 'consecutive_fails';

/** A single contributing risk factor with a numeric impact score */
export interface RiskFactor {
  /** Stable identifier for i18n and programmatic use */
  id: RiskFactorId;
  /** Short human-readable label (Italian, for teachers) */
  label: string;
  /** Longer explanation suitable for tooltip or detail panel */
  description: string;
  /**
   * Weight of this factor in the overall risk score: [0, 1].
   * Sum of *active* factors reaches 1.0 only for a student at maximum risk.
   */
  impact: number;
  /** Raw measurement value (grade, count, %, etc.) serialised as string */
  evidence: string;
}

/** Complete factored analysis for one student */
export interface StudentRiskFactors {
  studentId: string;
  /** Factors sorted by descending impact */
  factors: RiskFactor[];
  /** Total effective risk contribution of all active factors: [0, 1] */
  totalImpact: number;
  /** The materia with the lowest average grade (primary risk subject) */
  worstSubject: string | null;
  /** Mean grade across all evaluations for this student */
  gradeAverage: number;
  /** Number of distinct subjects evaluated */
  subjectsCount: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function parseGrade(voto: string): number {
  const n = parseFloat(voto.replace(',', '.'));
  return Number.isFinite(n) ? n : -1;
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Linear slope using least-squares (more robust than last-minus-first). */
function leastSquaresSlope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const xs = Array.from({ length: n }, (_, i) => i);
  const mx = avg(xs);
  const my = avg(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

/** Variance of a series (for volatility detection). */
function variance(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = avg(nums);
  return avg(nums.map(x => (x - m) ** 2));
}

// ── Factor definitions ────────────────────────────────────────────────────────
// Each factor: { check(grades, student): boolean, impact, label, desc, evidence }

const FACTORS: Array<{
  id: RiskFactorId;
  impact: number;
  label: string;
  description: string;
  check: (grades: number[], student: Studente, evals: Valutazione[]) => string | null;
}> = [
  {
    id: 'grade_below_sufficiency',
    impact: 0.30,
    label: 'Media sotto la sufficienza',
    description: 'La media dei voti è inferiore a 6/10.',
    check: (grades) => {
      const m = avg(grades);
      return m < 6 && m > 0 ? `${round2(m)}/10` : null;
    },
  },
  {
    id: 'declining_trend',
    impact: 0.22,
    label: 'Trend voti in calo',
    description: 'La pendenza della curva dei voti nel tempo è negativa (regressione lineare).',
    check: (grades) => {
      if (grades.length < 3) return null;
      const slope = leastSquaresSlope(grades);
      return slope < -0.15 ? `${round2(slope)} voti/eval` : null;
    },
  },
  {
    id: 'low_recent_grades',
    impact: 0.18,
    label: 'Voti recenti bassi',
    description: 'Le ultime 3 valutazioni hanno una media inferiore a 5.5.',
    check: (grades) => {
      if (grades.length < 2) return null;
      const last = grades.slice(-3);
      const m = avg(last);
      return m < 5.5 ? `media recente ${round2(m)}/10` : null;
    },
  },
  {
    id: 'grade_drop',
    impact: 0.15,
    label: 'Calo improvviso',
    description: 'L\'ultimo voto è inferiore di almeno 2 punti rispetto alla media precedente.',
    check: (grades) => {
      if (grades.length < 3) return null;
      const prevMean = avg(grades.slice(0, -1));
      const last = grades[grades.length - 1];
      const drop = prevMean - last;
      return drop >= 2 ? `calo di ${round2(drop)} punti` : null;
    },
  },
  {
    id: 'grade_volatility',
    impact: 0.10,
    label: 'Alta variabilità dei voti',
    description: 'I voti oscillano molto, indicando prestazioni incoerenti.',
    check: (grades) => {
      if (grades.length < 4) return null;
      const v = variance(grades);
      return v > 2.5 ? `varianza ${round2(v)}` : null;
    },
  },
  {
    id: 'few_evaluations',
    impact: 0.10,
    label: 'Poche valutazioni',
    description: 'Meno di 3 valutazioni disponibili: stime meno affidabili.',
    check: (grades) => grades.length < 3 ? `${grades.length} valutazioni` : null,
  },
  {
    id: 'consecutive_fails',
    impact: 0.09,
    label: 'Insufficienze consecutive',
    description: 'Almeno 3 valutazioni consecutive con voto < 6.',
    check: (grades) => {
      let runLen = 0;
      let maxRun = 0;
      for (const g of grades) {
        runLen = g < 6 ? runLen + 1 : 0;
        if (runLen > maxRun) maxRun = runLen;
      }
      return maxRun >= 3 ? `${maxRun} insufficienze di fila` : null;
    },
  },
  {
    id: 'multi_subject_risk',
    impact: 0.08,
    label: 'Difficoltà in più materie',
    description: 'Media sotto la sufficienza in almeno 2 materie distinte.',
    check: (_, __, evals) => {
      const bySubject = new Map<string, number[]>();
      for (const e of evals) {
        const g = parseGrade(e.voto);
        if (g >= 0) {
          if (!bySubject.has(e.materia)) bySubject.set(e.materia, []);
          bySubject.get(e.materia)!.push(g);
        }
      }
      const failCount = [...bySubject.values()].filter(gs => avg(gs) < 6).length;
      return failCount >= 2 ? `${failCount} materie sotto la sufficienza` : null;
    },
  },
  {
    id: 'special_needs_no_support_signal',
    impact: 0.05,
    label: 'BES/DSA senza segnali di recupero',
    description: 'Lo studente ha un piano BES/DSA e i voti non mostrano miglioramento.',
    check: (grades, student) => {
      if (!student.hasBES && !student.hasDSA && !student.has104) return null;
      if (grades.length < 2) return null;
      const slope = leastSquaresSlope(grades);
      return slope <= 0 ? 'piano attivo, nessun segnale di recupero' : null;
    },
  },
];

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Analyzes a single student's evaluations and produces a structured,
 * weighted list of risk factors.
 */
export function analyzeStudentRiskFactors(
  student: Studente,
  evaluations: Valutazione[],
): StudentRiskFactors {
  const sorted = [...evaluations]
    .filter(e => e.studenteId === student.id)
    .sort((a, b) => a.data.localeCompare(b.data));

  const grades = sorted.map(e => parseGrade(e.voto)).filter(n => n >= 0);

  const activeFactors: RiskFactor[] = [];

  for (const def of FACTORS) {
    const evidence = def.check(grades, student, sorted);
    if (evidence !== null) {
      activeFactors.push({
        id: def.id,
        label: def.label,
        description: def.description,
        impact: def.impact,
        evidence,
      });
    }
  }

  // Sort by descending impact
  activeFactors.sort((a, b) => b.impact - a.impact);

  const totalImpact = round2(Math.min(
    activeFactors.reduce((s, f) => s + f.impact, 0),
    1,
  ));

  // Worst subject
  const bySubject = new Map<string, number[]>();
  for (const e of sorted) {
    const g = parseGrade(e.voto);
    if (g >= 0) {
      if (!bySubject.has(e.materia)) bySubject.set(e.materia, []);
      bySubject.get(e.materia)!.push(g);
    }
  }

  let worstSubject: string | null = null;
  let worstAvg = Infinity;
  for (const [subject, gs] of bySubject) {
    const a = avg(gs);
    if (a < worstAvg) { worstAvg = a; worstSubject = subject; }
  }

  return {
    studentId: student.id,
    factors: activeFactors,
    totalImpact,
    worstSubject,
    gradeAverage: round2(avg(grades)),
    subjectsCount: bySubject.size,
  };
}

/**
 * Batch version: analyses every student in the class.
 * Returns a map keyed by studentId for O(1) lookup.
 */
export function analyzeClassRiskFactors(
  students: Studente[],
  evaluations: Valutazione[],
): Map<string, StudentRiskFactors> {
  const result = new Map<string, StudentRiskFactors>();
  for (const student of students) {
    result.set(student.id, analyzeStudentRiskFactors(student, evaluations));
  }
  return result;
}
