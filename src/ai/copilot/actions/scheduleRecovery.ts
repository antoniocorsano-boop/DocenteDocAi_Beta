/**
 * scheduleRecovery.ts — Action: program a recovery activity
 *
 * Given an at-risk student and their weak subjects, produces a
 * CopilotAction that the teacher can accept to pre-fill a recovery
 * activity entry (sessions, format, objectives).
 */
import type { AISuggestion } from '../../contextEngine/types';
import type { Studente, Valutazione } from '@/types';
import type { CopilotAction, RecoveryPayload } from './types';

function parseVoto(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? -1 : n;
}

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
  const out = new Map<string, number>();
  for (const [s, scores] of bySubject)
    out.set(s, scores.reduce((a, b) => a + b, 0) / scores.length);
  return out;
}

function recoveryObjectives(
  subjects: string[],
  avgGrade: number,
): string[] {
  const base = subjects.map((s) => `Consolidare le basi di ${s}`);
  if (avgGrade < 4.5)
    base.push('Recuperare i prerequisiti fondamentali');
  else
    base.push('Colmare le lacune più critiche');
  base.push('Incrementare la partecipazione attiva in classe');
  return base;
}

/**
 * Builds a schedule_recovery CopilotAction for an at-risk student.
 *
 * @param suggestion - risk suggestion (type must be 'student_at_risk')
 * @param student    - full student record
 * @param evaluations - all evaluations (filtered per student internally)
 */
export function buildScheduleRecoveryAction(
  suggestion: AISuggestion,
  student: Studente,
  evaluations: Valutazione[],
): CopilotAction {
  const avgs = subjectAverages(student.id, evaluations);

  // Subjects below 5.5 threshold
  const weakSubjects = [...avgs.entries()]
    .filter(([, avg]) => avg < 5.5)
    .sort(([, a], [, b]) => a - b)   // worst first
    .map(([subj]) => subj);

  const subjects = weakSubjects.length > 0
    ? weakSubjects.slice(0, 3)
    : [...avgs.keys()].slice(0, 2);

  const allScores = [...avgs.values()];
  const avgGrade = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 5;

  const suggestedSessions = avgGrade < 4.5 ? 4 : avgGrade < 5.5 ? 3 : 2;
  const suggestedFormat: 'individual' | 'group' =
    suggestion.confidence > 0.8 ? 'individual' : 'group';

  const payload: RecoveryPayload = {
    type: 'schedule_recovery',
    suggestedSessions,
    suggestedFormat,
    objectives: recoveryObjectives(subjects, avgGrade),
  };

  const studentName = `${student.nome} ${student.cognome}`;
  const subjectList = subjects.join(', ') || 'materie a rischio';

  return {
    id: `recovery-${student.id}-${Date.now()}`,
    actionType: 'schedule_recovery',
    urgency: suggestion.confidence > 0.8 ? 'high' : 'medium',
    studentId: student.id,
    studentName,
    subjects,
    label: 'Crea attività recupero',
    description: `Programma ${suggestedSessions} sessioni di recupero in ${subjectList} per ${studentName}.`,
    payload,
  };
}
