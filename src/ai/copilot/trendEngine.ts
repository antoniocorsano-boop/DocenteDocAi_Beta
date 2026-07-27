/**
 * trendEngine.ts — Sprint 4 Trend Prediction
 *
 * Pure functions for computing grade trend forecasts using simple
 * ordinary-least-squares linear regression on chronological evaluations.
 *
 * Rules:
 * - Minimum 3 data points required for a reliable regression
 * - Projection horizon: next 30 days (3 synthetic future points)
 * - Risk threshold: projected grade < 6.0
 * - Excellence threshold: projected grade >= 8.0
 * - Italian 1–10 grade scale: output clamped to [1, 10]
 */
import type { Studente, Valutazione } from '@/types';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseVoto(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? -1 : n;
}

function toDateNumber(dateStr: string): number {
  return new Date(dateStr).getTime();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Ordinary least-squares linear regression.
 * Returns { slope, intercept } for y = slope*x + intercept.
 */
function linearRegression(
  points: Array<{ x: number; y: number }>,
): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };

  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumXX = points.reduce((a, p) => a + p.x * p.x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * R-squared measure of fit quality [0–1].
 * Values below 0.2 mean scatter is too high to trust the prediction.
 */
function rSquared(
  points: Array<{ x: number; y: number }>,
  slope: number,
  intercept: number,
): number {
  const meanY = points.reduce((a, p) => a + p.y, 0) / points.length;
  const ssTot = points.reduce((a, p) => a + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((a, p) => a + (p.y - (slope * p.x + intercept)) ** 2, 0);
  if (ssTot === 0) return 1;
  return Math.max(0, 1 - ssRes / ssTot);
}

// ── public types ──────────────────────────────────────────────────────────────

export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface TrendPoint {
  /** ISO date string "YYYY-MM-DD" */
  date: string;
  /** Short label "DD/MM" */
  label: string;
  /** Actual average grade that day (null for projected points) */
  actual: number | null;
  /** Regression line value (both historical and projected) */
  regression: number;
  /** True for the 3 synthetic future points */
  projected: boolean;
}

export interface SubjectTrend {
  subject: string;
  /**
   * All grades chronologically sorted.
   * Minimum 3 required; if fewer → insufficient = true.
   */
  points: TrendPoint[];
  slope: number;
  rSquared: number;
  direction: TrendDirection;
  /** Projected grade 30 days from now */
  projectedGrade: number;
  /** True when not enough data for regression */
  insufficient: boolean;
}

export interface StudentForecast {
  studentId: string;
  studentName: string;
  /** Per-subject trend analysis */
  subjects: SubjectTrend[];
  /** Overall weighted average of subject projected grades */
  overallProjected: number;
  /** Subjects where projectedGrade < 6.0 */
  atRiskSubjects: string[];
  /** Subjects where projectedGrade >= 8.0 */
  excellenceSubjects: string[];
}

// ── per-subject trend computation ─────────────────────────────────────────────

function computeSubjectTrend(
  grades: Array<{ date: string; voto: number }>,
  subject: string,
): SubjectTrend {
  // Sort ascending by date
  const sorted = [...grades].sort((a, b) => a.date.localeCompare(b.date));

  // Group by day → average per day
  const byDay = new Map<string, number[]>();
  for (const g of sorted) {
    const day = g.date.slice(0, 10);
    const arr = byDay.get(day) ?? [];
    arr.push(g.voto);
    byDay.set(day, arr);
  }
  const dailyEntries = [...byDay.entries()].map(([day, vs]) => ({
    date: day,
    avg: vs.reduce((a, b) => a + b, 0) / vs.length,
  }));

  if (dailyEntries.length < 3) {
    // Not enough data — return stub
    const last = dailyEntries[dailyEntries.length - 1]?.avg ?? 0;
    return {
      subject,
      points: dailyEntries.map((e) => ({
        date: e.date,
        label: toShortLabel(e.date),
        actual: parseFloat(e.avg.toFixed(1)),
        regression: parseFloat(e.avg.toFixed(1)),
        projected: false,
      })),
      slope: 0,
      rSquared: 0,
      direction: 'stable',
      projectedGrade: parseFloat(last.toFixed(1)),
      insufficient: true,
    };
  }

  // Normalise timestamps to days-since-first to minimise floating-point error
  const t0 = toDateNumber(dailyEntries[0].date);
  const MS_PER_DAY = 86_400_000;

  const regrPoints = dailyEntries.map((e) => ({
    x: (toDateNumber(e.date) - t0) / MS_PER_DAY,
    y: e.avg,
  }));

  const { slope, intercept } = linearRegression(regrPoints);
  const r2 = rSquared(regrPoints, slope, intercept);

  // Historical points + regression overlay
  const histPoints: TrendPoint[] = dailyEntries.map((e, i) => ({
    date: e.date,
    label: toShortLabel(e.date),
    actual: parseFloat(e.avg.toFixed(1)),
    regression: parseFloat(clamp(slope * regrPoints[i].x + intercept, 1, 10).toFixed(1)),
    projected: false,
  }));

  // 3 future synthetic points at +10d, +20d, +30d from last actual
  const lastX = regrPoints[regrPoints.length - 1].x;
  const lastDate = new Date(dailyEntries[dailyEntries.length - 1].date);
  const projPoints: TrendPoint[] = [10, 20, 30].map((offsetDays) => {
    const xFuture = lastX + offsetDays;
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + offsetDays);
    const isoDate = futureDate.toISOString().slice(0, 10);
    return {
      date: isoDate,
      label: toShortLabel(isoDate),
      actual: null,
      regression: parseFloat(clamp(slope * xFuture + intercept, 1, 10).toFixed(1)),
      projected: true,
    };
  });

  const projectedGrade = projPoints[2].regression; // +30d value

  const direction: TrendDirection =
    slope > 0.03 ? 'improving' : slope < -0.03 ? 'declining' : 'stable';

  return {
    subject,
    points: [...histPoints, ...projPoints],
    slope: parseFloat(slope.toFixed(4)),
    rSquared: parseFloat(r2.toFixed(3)),
    direction,
    projectedGrade,
    insufficient: false,
  };
}

function toShortLabel(isoDate: string): string {
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return isoDate;
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Generates per-student, per-subject grade trend forecasts.
 *
 * @param students    All students in the class (or single student)
 * @param evaluations Full evaluation list (will be filtered internally)
 * @param daysBack    Historical window in days (default 90)
 * @returns           One `StudentForecast` per student (skips students with no data)
 */
export function generateForecasts(
  students: Studente[],
  evaluations: Valutazione[],
  daysBack = 90,
): StudentForecast[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  return students.flatMap((student): StudentForecast[] => {
    const evals = evaluations.filter((e) => {
      if (e.studenteId !== student.id) return false;
      const d = new Date(e.data);
      return !isNaN(d.getTime()) && d >= cutoff;
    });

    if (evals.length === 0) return [];

    // Group by subject
    const bySubject = new Map<string, Array<{ date: string; voto: number }>>();
    for (const e of evals) {
      const v = parseVoto(e.voto);
      if (v < 0) continue;
      const arr = bySubject.get(e.materia) ?? [];
      arr.push({ date: e.data, voto: v });
      bySubject.set(e.materia, arr);
    }

    if (bySubject.size === 0) return [];

    const subjects = [...bySubject.entries()].map(([subj, grades]) =>
      computeSubjectTrend(grades, subj),
    );

    const sufficientSubjects = subjects.filter((s) => !s.insufficient);
    const overallProjected =
      sufficientSubjects.length > 0
        ? parseFloat(
            (
              sufficientSubjects.reduce((a, s) => a + s.projectedGrade, 0) /
              sufficientSubjects.length
            ).toFixed(1),
          )
        : 0;

    const atRiskSubjects = subjects
      .filter((s) => !s.insufficient && s.projectedGrade < 6.0)
      .map((s) => s.subject);

    const excellenceSubjects = subjects
      .filter((s) => !s.insufficient && s.projectedGrade >= 8.0)
      .map((s) => s.subject);

    const name =
      `${student.cognome ?? ''} ${student.nome ?? ''}`.trim() ||
      student.id;

    return [
      {
        studentId: student.id,
        studentName: name,
        subjects,
        overallProjected,
        atRiskSubjects,
        excellenceSubjects,
      },
    ];
  });
}
