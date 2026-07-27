/**
 * realisticClassData.ts — Fixture dataset for testing & demo (FASE 4)
 *
 * 3 classi italiane con 20–25 studenti ciascuna.
 * Distribuzione voti realistica per scuola italiana (1–10):
 *   - Classe 3A Scienze: media classe ~7.0 (buona)
 *   - Classe 2B Linguistico: media classe ~6.4 (sufficiente con rischi)
 *   - Classe 1C Tecnico: media classe ~6.8 (discreta)
 *
 * Ogni classe include:
 *   - 3–5 studenti a rischio (media < 5.5)
 *   - 3–4 studenti eccellenti (media ≥ 8.0)
 *   - resto nella fascia sufficiente (5.5–7.9)
 *
 * Tipi Valutazione italiani: Scritto | Orale | Pratico | Test | Verifica
 */
import type { Studente, Valutazione } from '@/types';

// ── helpers ───────────────────────────────────────────────────────────────────

let _valId = 1;
function uid(prefix: string): string {
  return `${prefix}-${String(_valId++).padStart(4, '0')}`;
}

type EvalTipo = Valutazione['tipo'];

function makeEval(
  studenteId: string,
  materia: string,
  data: string,
  voto: number,
  tipo: EvalTipo = 'Verifica',
): Valutazione {
  return {
    id: uid('val'),
    studenteId,
    materia,
    data,
    tipo,
    voto: voto.toFixed(1).replace('.', ','),
    argomento: '',
  };
}

// ── date helpers ──────────────────────────────────────────────────────────────

/** Returns an ISO date string N days before 2026-03-14 */
function daysAgo(n: number): string {
  const d = new Date('2026-03-14');
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── grade profiles ────────────────────────────────────────────────────────────

/** At-risk profile: grades in 3.5–5.5 range with decline */
function atRiskGrades(base: number): number[] {
  return [base + 0.5, base, base - 0.5, base - 1, base - 0.5, base, base - 1];
}

/** Average profile: grades in 5.5–7.5 range */
function averageGrades(base: number): number[] {
  return [base - 0.5, base, base + 0.5, base, base - 0.5, base + 1, base];
}

/** Excellent profile: grades in 8.0–10.0 range */
function excellentGrades(base: number): number[] {
  return [base, base + 0.5, base, base + 1, base + 0.5, base, base + 0.5];
}

function clamp(v: number): number {
  return Math.min(10, Math.max(1, Math.round(v * 2) / 2));
}

// ── 3A Scienze (22 studenti) ──────────────────────────────────────────────────

const MATERIE_3A = ['Matematica', 'Scienze', 'Italiano', 'Storia', 'Inglese'];

const students3A: Studente[] = [
  // Eccellenti
  { id: '3a-01', nome: 'Sofia',    cognome: 'Marchetti',  classe: '3A' },
  { id: '3a-02', nome: 'Luca',     cognome: 'Ferri',      classe: '3A' },
  { id: '3a-03', nome: 'Giulia',   cognome: 'Bianchi',    classe: '3A' },
  // Buoni
  { id: '3a-04', nome: 'Marco',    cognome: 'Ricci',      classe: '3A' },
  { id: '3a-05', nome: 'Elena',    cognome: 'Lombardi',   classe: '3A' },
  { id: '3a-06', nome: 'Andrea',   cognome: 'Conti',      classe: '3A' },
  { id: '3a-07', nome: 'Chiara',   cognome: 'Esposito',   classe: '3A' },
  { id: '3a-08', nome: 'Matteo',   cognome: 'Russo',      classe: '3A' },
  { id: '3a-09', nome: 'Laura',    cognome: 'Marino',     classe: '3A' },
  { id: '3a-10', nome: 'Davide',   cognome: 'Greco',      classe: '3A' },
  { id: '3a-11', nome: 'Francesca',cognome: 'Brunetti',   classe: '3A' },
  { id: '3a-12', nome: 'Simone',   cognome: 'Gallo',      classe: '3A' },
  { id: '3a-13', nome: 'Valentina',cognome: 'Pellegrini', classe: '3A' },
  { id: '3a-14', nome: 'Riccardo', cognome: 'Fontana',    classe: '3A' },
  { id: '3a-15', nome: 'Sara',     cognome: 'Ferrari',    classe: '3A' },
  { id: '3a-16', nome: 'Nicola',   cognome: 'Moretti',    classe: '3A' },
  // Sufficienti borderline
  { id: '3a-17', nome: 'Fabio',    cognome: 'Costa',      classe: '3A' },
  { id: '3a-18', nome: 'Alice',    cognome: 'Mancini',    classe: '3A' },
  // A rischio
  { id: '3a-19', nome: 'Carlo',    cognome: 'Sorrentino', classe: '3A', hasDSA: true },
  { id: '3a-20', nome: 'Irene',    cognome: 'De Luca',    classe: '3A' },
  { id: '3a-21', nome: 'Antonio',  cognome: 'Amato',      classe: '3A' },
  { id: '3a-22', nome: 'Giada',    cognome: 'Vitale',     classe: '3A' },
];

function buildEvals3A(): Valutazione[] {
  const evals: Valutazione[] = [];
  const profiles: Record<string, { type: 'excellent' | 'good' | 'average' | 'risk'; base: number }> = {
    '3a-01': { type: 'excellent', base: 9 },
    '3a-02': { type: 'excellent', base: 8.5 },
    '3a-03': { type: 'excellent', base: 8 },
    '3a-04': { type: 'good', base: 7.5 },
    '3a-05': { type: 'good', base: 7 },
    '3a-06': { type: 'good', base: 7 },
    '3a-07': { type: 'good', base: 7.5 },
    '3a-08': { type: 'average', base: 6.5 },
    '3a-09': { type: 'average', base: 6.5 },
    '3a-10': { type: 'average', base: 7 },
    '3a-11': { type: 'average', base: 6.5 },
    '3a-12': { type: 'average', base: 6 },
    '3a-13': { type: 'average', base: 6.5 },
    '3a-14': { type: 'average', base: 6 },
    '3a-15': { type: 'average', base: 7 },
    '3a-16': { type: 'average', base: 6 },
    '3a-17': { type: 'average', base: 5.5 },
    '3a-18': { type: 'average', base: 5.5 },
    '3a-19': { type: 'risk', base: 4.5 },
    '3a-20': { type: 'risk', base: 5 },
    '3a-21': { type: 'risk', base: 4 },
    '3a-22': { type: 'risk', base: 5 },
  };

  const tipi: EvalTipo[] = ['Verifica', 'Orale', 'Scritto', 'Test', 'Orale', 'Verifica', 'Orale'];
  const offsets = [80, 68, 55, 42, 30, 18, 7];

  for (const s of students3A) {
    const p = profiles[s.id];
    const gradeSeq =
      p.type === 'excellent'
        ? excellentGrades(p.base)
        : p.type === 'good'
          ? averageGrades(p.base + 0.5)
          : p.type === 'risk'
            ? atRiskGrades(p.base)
            : averageGrades(p.base);

    for (const materia of MATERIE_3A.slice(0, 3)) {
      gradeSeq.forEach((v, i) => {
        evals.push(makeEval(s.id, materia, daysAgo(offsets[i]), clamp(v), tipi[i]));
      });
    }
    // Spot checks in remaining subjects
    evals.push(makeEval(s.id, 'Storia', daysAgo(40), clamp(p.base), 'Orale'));
    evals.push(makeEval(s.id, 'Inglese', daysAgo(25), clamp(p.base + 0.5), 'Scritto'));
  }
  return evals;
}

// ── 2B Linguistico (23 studenti) ─────────────────────────────────────────────

const MATERIE_2B = ['Italiano', 'Inglese', 'Francese', 'Storia', 'Filosofia'];

const students2B: Studente[] = [
  // Eccellenti
  { id: '2b-01', nome: 'Alessia',  cognome: 'Colombo',   classe: '2B' },
  { id: '2b-02', nome: 'Lorenzo',  cognome: 'Rizzo',     classe: '2B' },
  { id: '2b-03', nome: 'Beatrice', cognome: 'Caruso',    classe: '2B' },
  // Buoni
  { id: '2b-04', nome: 'Federico', cognome: 'Genovese',  classe: '2B' },
  { id: '2b-05', nome: 'Martina',  cognome: 'Cattaneo',  classe: '2B' },
  { id: '2b-06', nome: 'Stefano',  cognome: 'Barbieri',  classe: '2B' },
  { id: '2b-07', nome: 'Roberta',  cognome: 'Santoro',   classe: '2B' },
  { id: '2b-08', nome: 'Daniele',  cognome: 'Longo',     classe: '2B' },
  { id: '2b-09', nome: 'Monica',   cognome: 'Ferrari',   classe: '2B' },
  // Sufficienti
  { id: '2b-10', nome: 'Claudio',  cognome: 'Martini',   classe: '2B' },
  { id: '2b-11', nome: 'Paola',    cognome: 'Grassi',    classe: '2B' },
  { id: '2b-12', nome: 'Enrico',   cognome: 'Bruno',     classe: '2B' },
  { id: '2b-13', nome: 'Serena',   cognome: 'Monti',     classe: '2B' },
  { id: '2b-14', nome: 'Massimo',  cognome: 'Leone',     classe: '2B' },
  { id: '2b-15', nome: 'Cristina', cognome: 'Pini',      classe: '2B' },
  { id: '2b-16', nome: 'Roberto',  cognome: 'Palumbo',   classe: '2B' },
  // Borderline
  { id: '2b-17', nome: 'Silvia',   cognome: 'Bianco',    classe: '2B' },
  { id: '2b-18', nome: 'Gabriele', cognome: 'Serra',     classe: '2B' },
  // A rischio
  { id: '2b-19', nome: 'Veronica', cognome: 'Ferraro',   classe: '2B', hasBES: true },
  { id: '2b-20', nome: 'Michele',  cognome: 'Russo',     classe: '2B' },
  { id: '2b-21', nome: 'Tania',    cognome: 'Neri',      classe: '2B' },
  { id: '2b-22', nome: 'Samuele',  cognome: 'Marini',    classe: '2B' },
  { id: '2b-23', nome: 'Elisa',    cognome: 'Conte',     classe: '2B' },
];

function buildEvals2B(): Valutazione[] {
  const evals: Valutazione[] = [];
  const profiles: Record<string, number> = {
    '2b-01': 9, '2b-02': 8.5, '2b-03': 8,
    '2b-04': 7.5, '2b-05': 7, '2b-06': 7, '2b-07': 7.5, '2b-08': 6.5, '2b-09': 7,
    '2b-10': 6.5, '2b-11': 6, '2b-12': 6.5, '2b-13': 6, '2b-14': 6, '2b-15': 6.5,
    '2b-16': 6, '2b-17': 5.5, '2b-18': 5.5,
    '2b-19': 4.5, '2b-20': 4, '2b-21': 5, '2b-22': 4.5, '2b-23': 5,
  };
  const tipi: EvalTipo[] = ['Scritto', 'Orale', 'Scritto', 'Orale', 'Verifica', 'Orale'];
  const offsets = [75, 60, 48, 35, 22, 10];

  for (const s of students2B) {
    const base = profiles[s.id] ?? 6;
    const isRisk = base < 5.5;
    const gradeSeq = isRisk ? atRiskGrades(base) : averageGrades(base);

    MATERIE_2B.slice(0, 3).forEach((materia) => {
      gradeSeq.slice(0, 6).forEach((v, i) => {
        evals.push(makeEval(s.id, materia, daysAgo(offsets[i]), clamp(v), tipi[i]));
      });
    });
    evals.push(makeEval(s.id, 'Storia', daysAgo(30), clamp(base), 'Orale'));
    evals.push(makeEval(s.id, 'Filosofia', daysAgo(15), clamp(base + 0.5), 'Orale'));
  }
  return evals;
}

// ── 1C Tecnico (21 studenti) ──────────────────────────────────────────────────

const MATERIE_1C = ['Matematica', 'Informatica', 'Italiano', 'Scienze', 'TIC'];

const students1C: Studente[] = [
  { id: '1c-01', nome: 'Alessandro', cognome: 'Ferretti',  classe: '1C' },
  { id: '1c-02', nome: 'Camilla',    cognome: 'Benedetti', classe: '1C' },
  { id: '1c-03', nome: 'Paolo',      cognome: 'Ricci',     classe: '1C' },
  { id: '1c-04', nome: 'Ginevra',    cognome: 'Martino',   classe: '1C' },
  { id: '1c-05', nome: 'Luca',       cognome: 'Negri',     classe: '1C' },
  { id: '1c-06', nome: 'Valentina',  cognome: 'Barbieri',  classe: '1C' },
  { id: '1c-07', nome: 'Dario',      cognome: 'Esposito',  classe: '1C' },
  { id: '1c-08', nome: 'Noemi',      cognome: 'Russo',     classe: '1C' },
  { id: '1c-09', nome: 'Flavio',     cognome: 'De Santis', classe: '1C' },
  { id: '1c-10', nome: 'Azzurra',    cognome: 'Colombo',   classe: '1C' },
  { id: '1c-11', nome: 'Emanuele',   cognome: 'Moro',      classe: '1C' },
  { id: '1c-12', nome: 'Giulia',     cognome: 'Fabbri',    classe: '1C' },
  { id: '1c-13', nome: 'Omar',       cognome: 'Al-Farsi',  classe: '1C' },
  { id: '1c-14', nome: 'Ilaria',     cognome: 'Vitali',    classe: '1C' },
  { id: '1c-15', nome: 'Giacomo',    cognome: 'Caruso',    classe: '1C' },
  { id: '1c-16', nome: 'Rosa',       cognome: 'Montanari', classe: '1C' },
  // Borderline
  { id: '1c-17', nome: 'Kevin',      cognome: 'Bernardi',  classe: '1C' },
  // A rischio
  { id: '1c-18', nome: 'Luca',       cognome: 'Verdi',     classe: '1C', has104: true },
  { id: '1c-19', nome: 'Eleonora',   cognome: 'Tosi',      classe: '1C' },
  { id: '1c-20', nome: 'Samir',      cognome: 'Haddad',    classe: '1C' },
  { id: '1c-21', nome: 'Tatiana',    cognome: 'Popescu',   classe: '1C' },
];

function buildEvals1C(): Valutazione[] {
  const evals: Valutazione[] = [];
  const profiles: Record<string, number> = {
    '1c-01': 9, '1c-02': 8.5, '1c-03': 8, '1c-04': 8,
    '1c-05': 7.5, '1c-06': 7, '1c-07': 7.5, '1c-08': 7, '1c-09': 7,
    '1c-10': 6.5, '1c-11': 6.5, '1c-12': 6.5, '1c-13': 7, '1c-14': 6,
    '1c-15': 6.5, '1c-16': 6,
    '1c-17': 5.5,
    '1c-18': 4, '1c-19': 5, '1c-20': 4.5, '1c-21': 5,
  };

  const tipi: EvalTipo[] = ['Verifica', 'Test', 'Pratico', 'Orale', 'Verifica', 'Test', 'Orale'];
  const offsets = [85, 70, 58, 44, 32, 20, 8];

  for (const s of students1C) {
    const base = profiles[s.id] ?? 6;
    const isRisk = base < 5.5;
    const gradeSeq = isRisk ? atRiskGrades(base) : averageGrades(base);

    MATERIE_1C.slice(0, 3).forEach((materia) => {
      gradeSeq.forEach((v, i) => {
        evals.push(makeEval(s.id, materia, daysAgo(offsets[i]), clamp(v), tipi[i]));
      });
    });
    evals.push(makeEval(s.id, 'Scienze', daysAgo(35), clamp(base), 'Test'));
    evals.push(makeEval(s.id, 'TIC', daysAgo(18), clamp(base + 0.5), 'Pratico'));
  }
  return evals;
}

// ── exports ───────────────────────────────────────────────────────────────────

export const FIXTURE_CLASSES = ['3A', '2B', '1C'] as const;
export type FixtureClass = (typeof FIXTURE_CLASSES)[number];

export const fixtureStudents: Record<FixtureClass, Studente[]> = {
  '3A': students3A,
  '2B': students2B,
  '1C': students1C,
};

export const fixtureEvaluations: Record<FixtureClass, Valutazione[]> = {
  '3A': buildEvals3A(),
  '2B': buildEvals2B(),
  '1C': buildEvals1C(),
};

/** Full flat arrays — useful for tests that don't filter by class */
export const allFixtureStudents: Studente[] = [
  ...students3A,
  ...students2B,
  ...students1C,
];

export const allFixtureEvaluations: Valutazione[] = [
  ...fixtureEvaluations['3A'],
  ...fixtureEvaluations['2B'],
  ...fixtureEvaluations['1C'],
];

/** Quick lookup: class label → display name */
export const FIXTURE_CLASS_LABELS: Record<FixtureClass, string> = {
  '3A': '3A Scienze',
  '2B': '2B Linguistico',
  '1C': '1C Tecnico',
};

/** Stats for test assertions */
export const FIXTURE_AT_RISK_IDS: Record<FixtureClass, string[]> = {
  '3A': ['3a-19', '3a-20', '3a-21', '3a-22'],
  '2B': ['2b-19', '2b-20', '2b-21', '2b-22', '2b-23'],
  '1C': ['1c-18', '1c-19', '1c-20', '1c-21'],
};

export const FIXTURE_EXCELLENT_IDS: Record<FixtureClass, string[]> = {
  '3A': ['3a-01', '3a-02', '3a-03'],
  '2B': ['2b-01', '2b-02', '2b-03'],
  '1C': ['1c-01', '1c-02', '1c-03', '1c-04'],
};
