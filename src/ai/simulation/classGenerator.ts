/**
 * classGenerator.ts — Realistic classroom dataset simulation (Sprint 4)
 *
 * Produces an arbitrary number of synthetic classes with realistic grade
 * distributions, temporal trends, and the correct Italian school evaluation
 * types. Feeds both the AI benchmark script and the AIDevToolsPanel.
 *
 * Output is fully typed and directly consumable by `runAIAnalysis()`.
 */
import type { Studente, Valutazione } from '@/types';
import { buildAIContext, type AIContext } from '../contextEngine/contextBuilder';

// ── options ───────────────────────────────────────────────────────────────────

export interface GeneratorOptions {
  /** Number of classes to generate (default: 10) */
  classes?: number;
  /** Students per class (default: 20) */
  studentsPerClass?: number;
  /** Fraction of students with a declining/at-risk profile (0–1, default: 0.15) */
  atRiskRatio?: number;
  /** Fraction of students with an excellence profile (0–1, default: 0.15) */
  excellenceRatio?: number;
  /** Subjects to generate evaluations for */
  subjects?: string[];
  /** Historical window in days (default: 90) */
  daysBack?: number;
  /** Evaluations per student per subject (default: 5) */
  evalsPerSubject?: number;
}

// ── output types ──────────────────────────────────────────────────────────────

export interface SimulatedClassMeta {
  atRiskCount: number;
  excellenceCount: number;
  averageCount: number;
  /** Arithmetic mean of all generated grades */
  averageGrade: number;
}

export interface SimulatedClassContext {
  className: string;
  students: Studente[];
  evaluations: Valutazione[];
  /** Pre-built AIContext — pass directly to runAIAnalysis() */
  context: AIContext;
  meta: SimulatedClassMeta;
}

// ── internal helpers ──────────────────────────────────────────────────────────

type GradeProfile = 'at_risk' | 'excellent' | 'average';

const DEFAULT_SUBJECTS: readonly string[] = [
  'Matematica',
  'Italiano',
  'Storia',
  'Scienze',
  'Inglese',
];

const EVAL_TYPES: ReadonlyArray<Valutazione['tipo']> = [
  'Scritto',
  'Orale',
  'Verifica',
  'Test',
];

let _globalEvalCounter = 0;

function makeStudentId(classIdx: number, studentIdx: number): string {
  return `sim-${classIdx + 1}-${String(studentIdx + 1).padStart(3, '0')}`;
}

function makeEvalId(): string {
  return `eval-sim-${String(++_globalEvalCounter).padStart(6, '0')}`;
}

function formatVoto(n: number): string {
  const clamped = Math.max(1, Math.min(10, n));
  return clamped.toFixed(1).replace('.', ',');
}

/** Returns an ISO date string `offset` days before today. */
function dateOffset(daysFromStart: number, daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack + daysFromStart);
  return d.toISOString().slice(0, 10);
}

/**
 * Generates a grade value for a given profile with realistic noise and temporal
 * trend (at-risk students trend slightly downward over time).
 */
function gradeForProfile(
  profile: GradeProfile,
  evalIndex: number,
  totalEvals: number,
  subjectSeed: number,
): number {
  const progress = totalEvals > 1 ? evalIndex / (totalEvals - 1) : 0;
  const noise = ((subjectSeed * 37 + evalIndex * 13) % 21) / 10 - 1; // [-1, +1]

  switch (profile) {
    case 'at_risk':
      // Starts near 5, trends down to ~3.5 over time
      return 5.0 - progress * 1.5 + noise * 0.6;
    case 'excellent':
      // Consistently high, slight upward trend
      return 8.5 + progress * 0.5 + noise * 0.4;
    case 'average':
    default:
      // Stable around 6.5
      return 6.5 + noise * 0.8;
  }
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Generates `options.classes` synthetic classes of Italian school students.
 *
 * @example
 * const dataset = generateSimulatedClasses({ classes: 100 })
 * for (const cls of dataset) {
 *   const result = runAIAnalysis(cls.context)
 * }
 */
export function generateSimulatedClasses(
  options: GeneratorOptions = {},
): SimulatedClassContext[] {
  const {
    classes = 10,
    studentsPerClass = 20,
    atRiskRatio = 0.15,
    excellenceRatio = 0.15,
    subjects = DEFAULT_SUBJECTS as string[],
    daysBack = 90,
    evalsPerSubject = 5,
  } = options;

  // Reset counter so benchmark runs are deterministic across calls
  _globalEvalCounter = 0;

  const classNames = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
  ];

  return Array.from({ length: classes }, (_, classIdx): SimulatedClassContext => {
    const yearNum = (classIdx % 5) + 1;
    const sectionLetter = classNames[Math.floor(classIdx / 5) % classNames.length];
    const className = `${yearNum}${sectionLetter}`;

    const atRiskCount = Math.max(1, Math.round(studentsPerClass * atRiskRatio));
    const excellenceCount = Math.max(1, Math.round(studentsPerClass * excellenceRatio));
    const averageCount = Math.max(0, studentsPerClass - atRiskCount - excellenceCount);

    const profiles: GradeProfile[] = [
      ...Array<GradeProfile>(atRiskCount).fill('at_risk'),
      ...Array<GradeProfile>(excellenceCount).fill('excellent'),
      ...Array<GradeProfile>(averageCount).fill('average'),
    ];

    const students: Studente[] = [];
    const evaluations: Valutazione[] = [];
    let gradeSum = 0;
    let gradeCount = 0;

    for (let si = 0; si < studentsPerClass; si++) {
      const studentId = makeStudentId(classIdx, si);
      const profile = profiles[si] ?? 'average';

      students.push({
        id: studentId,
        nome: `Studente${si + 1}`,
        cognome: `Cl${classIdx + 1}`,
        classe: className,
      });

      // Generate evaluations spread evenly over the `daysBack` window
      for (let subjectIdx = 0; subjectIdx < subjects.length; subjectIdx++) {
        const subject = subjects[subjectIdx];
        const subjectSeed = subject.charCodeAt(0) + subject.charCodeAt(subject.length - 1);

        for (let ei = 0; ei < evalsPerSubject; ei++) {
          const grade = gradeForProfile(profile, ei, evalsPerSubject, subjectSeed + si);
          const daysFromStart = Math.round((ei / evalsPerSubject) * daysBack);
          const evalType = EVAL_TYPES[ei % EVAL_TYPES.length];

          gradeSum += grade;
          gradeCount++;

          evaluations.push({
            id: makeEvalId(),
            studenteId: studentId,
            materia: subject,
            data: dateOffset(daysFromStart, daysBack),
            tipo: evalType,
            voto: formatVoto(grade),
            argomento: '',
          });
        }
      }
    }

    const context = buildAIContext(students, [], evaluations);

    return {
      className,
      students,
      evaluations,
      context,
      meta: {
        atRiskCount,
        excellenceCount,
        averageCount,
        averageGrade:
          gradeCount > 0
            ? parseFloat((gradeSum / gradeCount).toFixed(2))
            : 0,
      },
    };
  });
}

/**
 * Convenience wrapper — generates a single class context by index.
 * Useful when you need one class at a time without building the full set.
 */
export function generateSingleClass(
  classIndex: number,
  options: Omit<GeneratorOptions, 'classes'> = {},
): SimulatedClassContext {
  return generateSimulatedClasses({ ...options, classes: classIndex + 1 })[classIndex];
}
