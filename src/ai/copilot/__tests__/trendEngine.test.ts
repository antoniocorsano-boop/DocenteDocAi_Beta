import { describe, it, expect } from 'vitest';
import { generateForecasts } from '../trendEngine';
import type { TrendDirection } from '../trendEngine';
import type { Studente, Valutazione } from '@/types';

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeStudent(id: string, nome = 'Test', cognome = 'Studente'): Studente {
  return { id, nome, cognome, classe: '3A' };
}

/** Creates evaluations spread over the last N days before a given anchor */
function makeEvals(
  studenteId: string,
  materia: string,
  grades: number[],
  anchorDaysAgo = 60,
): Valutazione[] {
  const anchor = new Date();
  anchor.setDate(anchor.getDate() - anchorDaysAgo);

  return grades.map((grade, i) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + i * 7); // one per week
    return {
      id: `e-${studenteId}-${materia}-${i}`,
      studenteId,
      materia,
      data: d.toISOString().slice(0, 10),
      tipo: 'Scritto',
      voto: String(grade),
    };
  });
}

// ── generateForecasts — no data ───────────────────────────────────────────────

describe('generateForecasts — no data', () => {
  it('returns empty array when student list is empty', () => {
    expect(generateForecasts([], [], 90)).toEqual([]);
  });

  it('returns empty array when no evaluations exist for the students', () => {
    const student = makeStudent('s1');
    expect(generateForecasts([student], [], 90)).toEqual([]);
  });

  it('excludes students whose evaluations are all outside the window', () => {
    const student = makeStudent('s1');
    // Evaluation from 120 days ago — outside 90-day window
    const oldEval: Valutazione = {
      id: 'old1',
      studenteId: 's1',
      materia: 'Matematica',
      data: new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10),
      tipo: 'Scritto',
      voto: '7',
    };
    expect(generateForecasts([student], [oldEval], 90)).toEqual([]);
  });
});

// ── generateForecasts — single student improving ──────────────────────────────

describe('generateForecasts — improving trend', () => {
  const student = makeStudent('up1', 'Luca', 'Salvi');
  // grades rising: 5, 6, 7, 8, 9 over 5 weeks
  const evals = makeEvals('up1', 'Matematica', [5, 6, 7, 8, 9]);

  let forecasts: ReturnType<typeof generateForecasts>;
  beforeEach(() => {
    forecasts = generateForecasts([student], evals, 90);
  });

  it('produces exactly one forecast', () => {
    expect(forecasts).toHaveLength(1);
  });

  it('studentName is set correctly', () => {
    expect(forecasts[0].studentName).toContain('Salvi');
  });

  it('subject Matematica has an improving direction', () => {
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Matematica')!;
    expect(subj).toBeDefined();
    expect(subj.direction).toBe<TrendDirection>('improving');
  });

  it('slope is positive for an improving trend', () => {
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Matematica')!;
    expect(subj.slope).toBeGreaterThan(0);
  });

  it('projected grade is within [1, 10]', () => {
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Matematica')!;
    expect(subj.projectedGrade).toBeGreaterThanOrEqual(1);
    expect(subj.projectedGrade).toBeLessThanOrEqual(10);
  });

  it('does not appear in atRiskSubjects when improving toward 9', () => {
    expect(forecasts[0].atRiskSubjects).not.toContain('Matematica');
  });

  it('appears in excellenceSubjects when projected >= 8', () => {
    // With grades 5→9 the projection should reach excellence territory
    expect(forecasts[0].excellenceSubjects).toContain('Matematica');
  });
});

// ── generateForecasts — declining trend ──────────────────────────────────────

describe('generateForecasts — declining trend', () => {
  const student = makeStudent('dn1', 'Sara', 'Neri');
  // grades falling: 8, 7, 6, 5, 4
  const evals = makeEvals('dn1', 'Italiano', [8, 7, 6, 5, 4]);

  let forecasts: ReturnType<typeof generateForecasts>;
  beforeEach(() => {
    forecasts = generateForecasts([student], evals, 90);
  });

  it('direction is declining', () => {
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Italiano')!;
    expect(subj.direction).toBe<TrendDirection>('declining');
  });

  it('slope is negative', () => {
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Italiano')!;
    expect(subj.slope).toBeLessThan(0);
  });

  it('appears in atRiskSubjects when projected < 6', () => {
    expect(forecasts[0].atRiskSubjects).toContain('Italiano');
  });

  it('does not appear in excellenceSubjects', () => {
    expect(forecasts[0].excellenceSubjects).not.toContain('Italiano');
  });
});

// ── generateForecasts — stable trend ─────────────────────────────────────────

describe('generateForecasts — stable trend', () => {
  const student = makeStudent('st1', 'Marco', 'Conti');
  // grades flat: 7, 7, 7, 7, 7
  const evals = makeEvals('st1', 'Fisica', [7, 7, 7, 7, 7]);

  it('direction is stable when grades are identical', () => {
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Fisica')!;
    expect(subj.direction).toBe<TrendDirection>('stable');
  });

  it('projected grade equals observed grade for a flat series', () => {
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Fisica')!;
    // For perfectly flat data the projection should be very close to the mean
    expect(subj.projectedGrade).toBeCloseTo(7, 0);
  });
});

// ── generateForecasts — insufficient data ────────────────────────────────────

describe('generateForecasts — insufficient data (< 3 unique days)', () => {
  const student = makeStudent('ins1');
  const evals: Valutazione[] = [
    // Only 2 distinct days — regression not triggered
    { id: 'e1', studenteId: 'ins1', materia: 'Chimica', data: '2026-02-10', tipo: 'Scritto', voto: '6' },
    { id: 'e2', studenteId: 'ins1', materia: 'Chimica', data: '2026-02-20', tipo: 'Scritto', voto: '7' },
  ];

  it('marks subject as insufficient', () => {
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0]?.subjects.find((s) => s.subject === 'Chimica');
    expect(subj?.insufficient).toBe(true);
  });

  it('still returns a StudentForecast entry', () => {
    const forecasts = generateForecasts([student], evals, 90);
    expect(forecasts).toHaveLength(1);
  });
});

// ── generateForecasts — projection points structure ───────────────────────────

describe('generateForecasts — projection point structure', () => {
  const student = makeStudent('pt1', 'Elena', 'Greco');
  const evals = makeEvals('pt1', 'Matematica', [5, 6, 7, 8, 9]);

  it('historical points have non-null actual values', () => {
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Matematica')!;
    const historical = subj.points.filter((p) => !p.projected);
    expect(historical.length).toBeGreaterThan(0);
    for (const p of historical) {
      expect(p.actual).not.toBeNull();
    }
  });

  it('projected points have null actual values', () => {
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Matematica')!;
    const projected = subj.points.filter((p) => p.projected);
    expect(projected).toHaveLength(3); // +10, +20, +30 days
    for (const p of projected) {
      expect(p.actual).toBeNull();
    }
  });

  it('projected regression values are within [1, 10]', () => {
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Matematica')!;
    const projected = subj.points.filter((p) => p.projected);
    for (const p of projected) {
      expect(p.regression).toBeGreaterThanOrEqual(1);
      expect(p.regression).toBeLessThanOrEqual(10);
    }
  });

  it('all points have a label in DD/MM format', () => {
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Matematica')!;
    for (const p of subj.points) {
      expect(p.label).toMatch(/^\d{2}\/\d{2}$/);
    }
  });
});

// ── generateForecasts — rSquared ──────────────────────────────────────────────

describe('generateForecasts — R² quality metric', () => {
  it('R² is 1 for a perfectly linear series', () => {
    const student = makeStudent('r2p', 'Test', 'R2');
    // perfectly linear: y = x
    const evals = makeEvals('r2p', 'Mat', [4, 5, 6, 7, 8]);
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Mat')!;
    expect(subj.rSquared).toBeCloseTo(1, 1);
  });

  it('R² is between 0 and 1', () => {
    const student = makeStudent('r2r', 'Test', 'R2rand');
    // noisy grades
    const evals = makeEvals('r2r', 'Mat', [5, 8, 4, 9, 3, 7, 6]);
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects.find((s) => s.subject === 'Mat')!;
    expect(subj.rSquared).toBeGreaterThanOrEqual(0);
    expect(subj.rSquared).toBeLessThanOrEqual(1);
  });
});

// ── generateForecasts — multiple students ─────────────────────────────────────

describe('generateForecasts — multiple students', () => {
  const students = [
    makeStudent('m1', 'Alice', 'A'),
    makeStudent('m2', 'Bob', 'B'),
    makeStudent('m3', 'Carol', 'C'),
  ];
  const evals = [
    ...makeEvals('m1', 'Mat', [8, 8, 9, 9, 10]),
    ...makeEvals('m2', 'Mat', [4, 4, 3, 3, 2]),
    // m3 has no recent evals — skipped
  ];

  it('produces one forecast per student with data', () => {
    const forecasts = generateForecasts(students, evals, 90);
    expect(forecasts).toHaveLength(2);
  });

  it('overallProjected is > 0 for students with data', () => {
    const forecasts = generateForecasts(students, evals, 90);
    for (const f of forecasts) {
      expect(f.overallProjected).toBeGreaterThan(0);
    }
  });

  it('m2 (declining) appears in atRiskSubjects', () => {
    const forecasts = generateForecasts(students, evals, 90);
    const m2 = forecasts.find((f) => f.studentId === 'm2')!;
    expect(m2.atRiskSubjects).toContain('Mat');
  });

  it('m1 (excellent trajectory) appears in excellenceSubjects', () => {
    const forecasts = generateForecasts(students, evals, 90);
    const m1 = forecasts.find((f) => f.studentId === 'm1')!;
    expect(m1.excellenceSubjects).toContain('Mat');
  });
});

// ── generateForecasts — multi-subject ─────────────────────────────────────────

describe('generateForecasts — multi-subject per student', () => {
  const student = makeStudent('ms1', 'Giulia', 'Barone');
  const evals = [
    ...makeEvals('ms1', 'Matematica', [4, 4, 3, 3, 2]),   // declining → risk
    ...makeEvals('ms1', 'Italiano',   [7, 7, 7, 7, 7]),   // stable
    ...makeEvals('ms1', 'Scienze',    [7, 8, 9, 9, 10]),  // improving → excellence
  ];

  it('creates one SubjectTrend per subject', () => {
    const [forecast] = generateForecasts([student], evals, 90);
    expect(forecast.subjects).toHaveLength(3);
  });

  it('atRiskSubjects contains only Matematica', () => {
    const [forecast] = generateForecasts([student], evals, 90);
    expect(forecast.atRiskSubjects).toContain('Matematica');
    expect(forecast.atRiskSubjects).not.toContain('Italiano');
    expect(forecast.atRiskSubjects).not.toContain('Scienze');
  });

  it('excellenceSubjects contains Scienze', () => {
    const [forecast] = generateForecasts([student], evals, 90);
    expect(forecast.excellenceSubjects).toContain('Scienze');
  });

  it('overallProjected is average of subject projections', () => {
    const [forecast] = generateForecasts([student], evals, 90);
    const projectedSum = forecast.subjects.reduce((a, s) => a + s.projectedGrade, 0);
    const expectedAvg = projectedSum / forecast.subjects.length;
    expect(forecast.overallProjected).toBeCloseTo(expectedAvg, 0);
  });
});

// ── generateForecasts — grade clamping ───────────────────────────────────────

describe('generateForecasts — grade clamping at scale boundaries', () => {
  it('regression output never exceeds 10 even for strongly improving data', () => {
    const student = makeStudent('cl1');
    // All grades 9 or 10 — projection already at ceiling
    const evals = makeEvals('cl1', 'Mat', [9, 9.5, 10, 10, 10]);
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects[0];
    expect(subj.projectedGrade).toBeLessThanOrEqual(10);
  });

  it('regression output never goes below 1 for strongly declining data', () => {
    const student = makeStudent('cl2');
    // All grades at floor
    const evals = makeEvals('cl2', 'Mat', [1, 1, 1, 1, 1]);
    const forecasts = generateForecasts([student], evals, 90);
    const subj = forecasts[0].subjects[0];
    expect(subj.projectedGrade).toBeGreaterThanOrEqual(1);
  });
});
