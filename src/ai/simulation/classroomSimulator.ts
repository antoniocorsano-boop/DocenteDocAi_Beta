/**
 * classroomSimulator.ts — Converts a `ClassroomScenario` into concrete
 * `Studente` / `Valutazione` records that the unified AI pipeline can ingest.
 *
 * Key responsibilities:
 *  - Produce deterministic records when the scenario seed is fixed.
 *  - Distribute risk according to `scenario.riskDistribution`.
 *  - Shape grade trajectories to match `scenario.trend`.
 *  - Sprinkle random anomalies controlled by `scenario.behaviorNoise`.
 */

import type { Studente, Valutazione } from '@/types/student.types';
import type { ClassroomScenario, RiskDistribution } from './scenarioGenerator';

// ── types ─────────────────────────────────────────────────────────────────────

/**
 * Ground-truth description of a simulated student — the "oracle" that
 * benchmark metrics compare against AI predictions.
 */
export interface SimulatedStudent {
  /** Matches the corresponding `Studente.id` */
  id: string;
  /** Learning engagement score in [0, 1]; 1 = fully engaged */
  engagement: number;
  /** Mean academic performance in [0, 10]; mirrors average grade */
  performance: number;
  /** Ground-truth risk score in [0, 1]; >= 0.65 = at-risk student */
  riskScore: number;
  /** Flags that produced the risk score */
  behaviorFlags: string[];
}

/** Everything the simulator returns for one scenario */
export interface SimulatedClassroom {
  students: Studente[];
  evaluations: Valutazione[];
  groundTruth: SimulatedStudent[];
}

// ── seeded PRNG (same algorithm as scenarioGenerator) ────────────────────────

function createPrng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return function (): number {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4_294_967_296;
  };
}

// ── configuration tables ──────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Luca', 'Sofia', 'Matteo', 'Giulia', 'Lorenzo', 'Chiara',
  'Alessandro', 'Martina', 'Francesco', 'Elena', 'Davide', 'Anna',
  'Andrea', 'Sara', 'Marco', 'Valentina', 'Simone', 'Federica',
  'Tommaso', 'Alessia', 'Nicola', 'Beatrice', 'Giacomo', 'Elisa',
  'Emanuele', 'Laura', 'Pietro', 'Roberta', 'Enrico', 'Monica',
  'Gianluca', 'Cristina',
];

const LAST_NAMES = [
  'Rossi', 'Ferrari', 'Russo', 'Bianchi', 'Romano', 'Gallo',
  'Costa', 'Fontana', 'Conti', 'Esposito', 'Ricci', 'Bruno',
  'De Luca', 'Moretti', 'Barbieri', 'Franzese', 'Vitale', 'Marino',
  'Greco', 'Lombardi', 'Mancini', 'Longo', 'Giordano', 'Colombo',
  'Martini', 'Coppola', 'Marchetti', 'Caruso', 'Ferrara', 'Serra',
  'Santoro', 'Messina',
];

const EVALUATION_TYPES: Valutazione['tipo'][] = [
  'Scritto', 'Orale', 'Pratico', 'Test', 'Verifica', 'Ricevimento',
];

const MATERIE = [
  'Matematica', 'Italiano', 'Storia', 'Scienze', 'Inglese',
  'Educazione Fisica', 'Arte', 'Musica', 'Tecnologia', 'Geografia',
];

const ARGOMENTI: Record<string, string[]> = {
  Matematica:  ['Equazioni', 'Frazioni', 'Geometria', 'Statistica', 'Probabilità'],
  Italiano:    ['Letteratura', 'Narrativa', 'Poesia', 'Analisi del testo', 'Grammatica'],
  Storia:      ['Medioevo', 'Rinascimento', 'Rivoluzione Industriale', 'XX Secolo', 'Antica Roma'],
  Scienze:     ['Cellule', 'Ecosistemi', 'Chimica di base', 'Corpo umano', 'Fisica'],
  Inglese:     ['Grammar', 'Reading comprehension', 'Writing', 'Listening', 'Speaking'],
  default:     ['Modulo 1', 'Modulo 2', 'Modulo 3', 'Verifica finale'],
};

function pickIndex<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ── risk-distribution parameters ─────────────────────────────────────────────

/**
 * What fraction of the class is truly at-risk for each distribution level.
 * at-risk = riskScore >= 0.65
 */
const AT_RISK_FRACTION: Record<RiskDistribution, number> = {
  low:    0.10,
  medium: 0.30,
  high:   0.55,
};

// ── grade helpers ─────────────────────────────────────────────────────────────

/**
 * Maps a [0, 10] performance score with optional drift to a grade string.
 * Italian scale: 2 – 10 (integers or .5 increments).
 */
function performanceToGrade(
  basePerf: number,
  drift: number,   // applied per evaluation to simulate trend
  noise: number,   // random ± noise
  rand: () => number,
): string {
  const raw = basePerf + drift + (rand() - 0.5) * noise * 2;
  const clamped = Math.max(2, Math.min(10, raw));
  // round to nearest 0.5
  const rounded = Math.round(clamped * 2) / 2;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

/** Produces an ISO date string `daysAgo` days before today. */
function isoDateDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Converts a `ClassroomScenario` into concrete domain records.
 *
 * The simulation is deterministic: calling this function twice with the same
 * scenario (same `scenario.seed`) always produces identical output.
 */
export function simulateClassroom(scenario: ClassroomScenario): SimulatedClassroom {
  const rand = createPrng(scenario.seed * 31 + 7); // derived seed, avoids collisions w/ generator

  const atRiskFraction = AT_RISK_FRACTION[scenario.riskDistribution];
  const atRiskCount = Math.floor(scenario.students * atRiskFraction);

  const materia = MATERIE[scenario.seed % MATERIE.length]; // stable materia per scenario

  const students: Studente[] = [];
  const evaluations: Valutazione[] = [];
  const groundTruth: SimulatedStudent[] = [];

  const usedNames = new Set<string>();

  for (let i = 0; i < scenario.students; i++) {
    // ── identity ──────────────────────────────────────────────────────────────
    let nome = pickIndex(FIRST_NAMES, rand);
    let cognome = pickIndex(LAST_NAMES, rand);
    // ensure unique names within the class
    let attempts = 0;
    while (usedNames.has(`${nome}-${cognome}`) && attempts < 10) {
      nome = pickIndex(FIRST_NAMES, rand);
      cognome = pickIndex(LAST_NAMES, rand);
      attempts++;
    }
    usedNames.add(`${nome}-${cognome}`);

    // ── risk assignment ───────────────────────────────────────────────────────
    // First `atRiskCount` students in the roster are marked at-risk.
    // The rest receive low risk scores.  This makes detection straightforward.
    const isAtRisk = i < atRiskCount;

    const riskScore = isAtRisk
      ? 0.65 + rand() * 0.35 // [0.65, 1.0]
      : rand() * 0.45;       // [0.0,  0.45]

    const engagement = isAtRisk ? 0.2 + rand() * 0.4 : 0.55 + rand() * 0.45;
    const basePerformance = isAtRisk ? 2 + rand() * 3.5 : 5.5 + rand() * 4.5; // [2,5.5] vs [5.5,10]

    const behaviorFlags: string[] = [];
    if (riskScore >= 0.75) behaviorFlags.push('declining_grades');
    if (riskScore >= 0.80) behaviorFlags.push('absences');
    if (engagement < 0.3) behaviorFlags.push('low_engagement');
    if (scenario.behaviorNoise > 0.5 && rand() > 0.7) behaviorFlags.push('behavioral_issues');

    const hasBES = scenario.specialNeedsRatio > 0 && rand() < scenario.specialNeedsRatio;
    const hasDSA = !hasBES && rand() < scenario.specialNeedsRatio * 0.5;
    const has104 = !hasBES && !hasDSA && rand() < scenario.specialNeedsRatio * 0.2;

    // ── birth date — random year in [1998, 2015] for school-age range ─────────
    const birthYear = 1998 + Math.floor(rand() * 17);
    const birthMonth = 1 + Math.floor(rand() * 12);
    const birthDay = 1 + Math.floor(rand() * 28);
    const dataNascita = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

    const student: Studente = {
      id: `sim-student-${i + 1}`,
      nome,
      cognome,
      classe: '3A-SIM',
      dataNascita,
      ...(hasBES && { hasBES: true }),
      ...(hasDSA && { hasDSA: true }),
      ...(has104 && { has104: true }),
    };
    students.push(student);

    groundTruth.push({
      id: student.id,
      engagement,
      performance: parseFloat(basePerformance.toFixed(2)),
      riskScore: parseFloat(riskScore.toFixed(3)),
      behaviorFlags,
    });

    // ── evaluations ───────────────────────────────────────────────────────────
    // Spread evaluations over the last 60 days from oldest → newest.
    const evalCount = scenario.evaluationsPerStudent;
    const evalSpacing = Math.floor(60 / evalCount);

    // trend drift per evaluation step
    const driftPerStep: Record<string, number> = {
      improving: +0.25,
      stable:     0,
      declining: -0.25,
    };
    const drift = driftPerStep[scenario.trend];

    const topicPool = ARGOMENTI[materia] ?? ARGOMENTI.default;

    for (let e = 0; e < evalCount; e++) {
      const daysAgo = 60 - e * evalSpacing;
      const grade = performanceToGrade(
        basePerformance,
        drift * e,
        scenario.behaviorNoise * 2.5, // scale noise to grade units
        rand,
      );

      const eval_: Valutazione = {
        id: `sim-eval-${i + 1}-${e + 1}`,
        studenteId: student.id,
        materia,
        data: isoDateDaysAgo(daysAgo),
        tipo: pickIndex(EVALUATION_TYPES, rand),
        voto: grade,
        argomento: pickIndex(topicPool, rand),
      };
      evaluations.push(eval_);
    }
  }

  return { students, evaluations, groundTruth };
}
