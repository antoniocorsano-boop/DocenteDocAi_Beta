/**
 * planningEngine.ts — Sprint 2 Planning Assistant
 *
 * Pure functions: given AI suggestions + student/evaluation data,
 * generates typed activity plans for at-risk and excellence students.
 * No side effects. Deterministic output — safe to useMemo.
 */
import type { AISuggestion } from '../contextEngine/types';
import type { Studente, Valutazione, Uda } from '@/types';

// ── shared helpers ────────────────────────────────────────────────────────────

function parseVoto(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? -1 : n;
}

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Returns subject → average score map for one student */
function subjectAverages(
  studentId: string,
  evaluations: Valutazione[],
): Map<string, number> {
  const bySubject = new Map<string, number[]>();
  for (const e of evaluations) {
    if (e.studenteId !== studentId) continue;
    const v = parseVoto(e.voto);
    if (v < 0) continue;
    const arr = bySubject.get(e.materia) ?? [];
    arr.push(v);
    bySubject.set(e.materia, arr);
  }
  const result = new Map<string, number>();
  for (const [subj, scores] of bySubject) {
    result.set(subj, parseFloat(mean(scores).toFixed(1)));
  }
  return result;
}

// ── public types ──────────────────────────────────────────────────────────────

export type PlanType = 'recovery' | 'enrichment';

export interface ActivitySuggestion {
  title: string;
  description: string;
  type: 'individual' | 'group' | 'self-study' | 'project';
  estimatedSessions: number;
}

export interface SubjectGap {
  subject: string;
  avg: number;
  /** Score distance below the threshold (positive = below threshold) */
  gap: number;
}

export interface StudentPlan {
  studentId: string;
  studentName: string;
  planType: PlanType;
  /** Summary sentence for the teacher */
  summary: string;
  /** Weak subjects (recovery) or strong subjects (enrichment) */
  subjectFocus: SubjectGap[];
  activities: ActivitySuggestion[];
  /** UDA ids from existing plans that are relevant to this student */
  suggestedUdaIds: string[];
}

// ── recovery activity templates ───────────────────────────────────────────────

const RECOVERY_TEMPLATES: ActivitySuggestion[] = [
  {
    title: 'Recupero guidato individuale',
    description:
      'Sessione di ripasso individuale con esercizi graduati partendo dagli argomenti con maggiori lacune. Fornire schede strutturate e feedback immediato.',
    type: 'individual',
    estimatedSessions: 3,
  },
  {
    title: 'Studio cooperativo a coppie',
    description:
      'Abbinare lo studente con un compagno eccellente nella stessa materia per sessioni di tutoring peer-to-peer (20–30 min, 2×/settimana).',
    type: 'group',
    estimatedSessions: 4,
  },
  {
    title: 'Mappe concettuali e sintesi',
    description:
      'Produzione di mappe concettuali sugli argomenti critici. Lavoro autonomo + revisione in classe con correzione guidata.',
    type: 'self-study',
    estimatedSessions: 2,
  },
  {
    title: 'Verifica formativa desensibilizzata',
    description:
      'Piccola verifica orale o scritta (senza voto, solo feedback) per misurare avanzamento e ridurre ansia da prestazione.',
    type: 'individual',
    estimatedSessions: 1,
  },
];

// ── enrichment activity templates ─────────────────────────────────────────────

const ENRICHMENT_TEMPLATES: ActivitySuggestion[] = [
  {
    title: 'Progetto di approfondimento autonomo',
    description:
      'Assegnare un elaborato/progetto su un tema avanzato scelto dallo studente in accordo con il docente. Presentazione finale alla classe.',
    type: 'project',
    estimatedSessions: 5,
  },
  {
    title: 'Tutor di classe',
    description:
      'Coinvolgere lo studente come tutor per compagni in difficoltà nella stessa materia. Rinforza la comprensione profonda e le abilità trasversali.',
    type: 'group',
    estimatedSessions: 4,
  },
  {
    title: 'Ricerca bibliografica e relazione',
    description:
      'Ricerca su fonti primarie/secondarie con produzione di una relazione scritta e breve presentazione. Sviluppa metacognizione e metodo.',
    type: 'self-study',
    estimatedSessions: 3,
  },
  {
    title: 'Problem solving avanzato',
    description:
      'Esercizi e sfide a difficoltà crescente (livello olimpiadi / gare disciplinari). Valutazione solo qualitativa, focus sul processo.',
    type: 'individual',
    estimatedSessions: 3,
  },
];

// ── UDA matching ──────────────────────────────────────────────────────────────

/**
 * Finds UDA ids for the student's class that overlap with the focus subjects.
 */
function matchUdas(
  studentClass: string,
  focusSubjects: string[],
  udas: Uda[],
): string[] {
  const subjectSet = new Set(focusSubjects.map((s) => s.toLowerCase()));
  return udas
    .filter(
      (u) =>
        u.classe === studentClass &&
        subjectSet.has(u.materia.toLowerCase()),
    )
    .map((u) => u.id);
}

// ── main export ───────────────────────────────────────────────────────────────

const RISK_THRESHOLD = 5.5;
const EXCELLENCE_THRESHOLD = 8.0;

/**
 * Generates one StudentPlan per student flagged by the AI pipeline.
 * Pass the full class evaluations filtered to the selected class.
 */
export function generateStudentPlans(
  suggestions: AISuggestion[],
  students: Studente[],
  evaluations: Valutazione[],
  udas: Uda[],
): StudentPlan[] {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const plans: StudentPlan[] = [];

  for (const suggestion of suggestions) {
    if (!suggestion.studentId) continue;
    if (
      suggestion.type !== 'student_at_risk' &&
      suggestion.type !== 'student_excellence'
    )
      continue;

    const student = studentMap.get(suggestion.studentId);
    if (!student) continue;

    const avgs = subjectAverages(student.id, evaluations);
    const planType: PlanType =
      suggestion.type === 'student_at_risk' ? 'recovery' : 'enrichment';
    const threshold =
      planType === 'recovery' ? RISK_THRESHOLD : EXCELLENCE_THRESHOLD;

    // Build subject focus list
    const subjectFocus: SubjectGap[] = [];
    for (const [subj, avg] of avgs) {
      if (planType === 'recovery' && avg < threshold) {
        subjectFocus.push({ subject: subj, avg, gap: parseFloat((threshold - avg).toFixed(1)) });
      } else if (planType === 'enrichment' && avg >= threshold) {
        subjectFocus.push({ subject: subj, avg, gap: parseFloat((avg - threshold).toFixed(1)) });
      }
    }
    // Sort: recovery by worst first, enrichment by best first
    subjectFocus.sort((a, b) =>
      planType === 'recovery' ? a.avg - b.avg : b.avg - a.avg,
    );

    // If no subject focus found (e.g. suggestion based on trend, not avg),
    // include all subjects
    if (!subjectFocus.length) {
      for (const [subj, avg] of avgs) {
        subjectFocus.push({ subject: subj, avg, gap: 0 });
      }
    }

    const templates =
      planType === 'recovery' ? RECOVERY_TEMPLATES : ENRICHMENT_TEMPLATES;

    // Pick 2–3 activities relevant to the student's profile
    const activities = templates.slice(0, subjectFocus.length <= 1 ? 2 : 3);

    const name = `${student.cognome} ${student.nome}`;
    const focusNames = subjectFocus.slice(0, 3).map((sf) => sf.subject).join(', ');
    const summary =
      planType === 'recovery'
        ? `Piano di recupero per ${name}: priorità ${focusNames || 'tutte le materie'}.`
        : `Piano di approfondimento per ${name}: eccellenza in ${focusNames || 'tutte le materie'}.`;

    const suggestedUdaIds = matchUdas(
      student.classe,
      subjectFocus.map((sf) => sf.subject),
      udas,
    );

    plans.push({
      studentId: student.id,
      studentName: name,
      planType,
      summary,
      subjectFocus,
      activities,
      suggestedUdaIds,
    });
  }

  return plans;
}
