/**
 * suggestOralExam.ts — Action: suggest an oral exam
 *
 * For a student with declining trend or low written grades, proposes
 * scheduling an oral interrogazione in the weakest subject.
 */
import type { AISuggestion } from '../../contextEngine/types';
import type { Studente, Valutazione } from '@/types';
import type { CopilotAction, OralExamPayload } from './types';

function parseVoto(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? -1 : n;
}

function worstSubject(
  studentId: string,
  evaluations: Valutazione[],
): { subject: string; avg: number } | null {
  const bySubject = new Map<string, number[]>();
  for (const e of evaluations) {
    if (e.studenteId !== studentId) continue;
    const v = parseVoto(e.voto);
    if (v < 0) continue;
    const arr = bySubject.get(e.materia) ?? [];
    arr.push(v);
    bySubject.set(e.materia, arr);
  }
  if (bySubject.size === 0) return null;

  let worst: { subject: string; avg: number } | null = null;
  for (const [subject, scores] of bySubject) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const hasWrittenOrTest = evaluations.some(
      (e) =>
        e.studenteId === studentId &&
        e.materia === subject &&
        (e.tipo === 'Scritto' || e.tipo === 'Test' || e.tipo === 'Verifica'),
    );
    // Prefer subjects with written assessments (interrogazione balances the grade)
    if (!worst || avg < worst.avg || (avg === worst.avg && hasWrittenOrTest)) {
      worst = { subject, avg };
    }
  }
  return worst;
}

/**
 * Builds a suggest_oral_exam CopilotAction for a student.
 *
 * @param suggestion - AI suggestion (student_at_risk recommended)
 * @param student - full student record
 * @param evaluations - all evaluations
 */
export function buildSuggestOralExamAction(
  suggestion: AISuggestion,
  student: Studente,
  evaluations: Valutazione[],
): CopilotAction {
  const worst = worstSubject(student.id, evaluations);
  const subject = worst?.subject ?? 'materia a rischio';
  const avg = worst?.avg ?? 0;

  // Sense of urgency in days — lower avg → sooner suggested
  const windowDays = avg < 4 ? 7 : avg < 5 ? 14 : 21;

  const rationale =
    avg > 0
      ? `Media attuale ${avg.toFixed(1)}/10 in ${subject} — ` +
        (suggestion.confidence > 0.75
          ? 'il trend negativo rende urgente una valutazione orale.'
          : "un'interrogazione orale può ribilanciare la valutazione.")
      : `${student.nome} ${student.cognome} mostra lacune in ${subject}.`;

  const payload: OralExamPayload = {
    type: 'suggest_oral_exam',
    suggestedSubject: subject,
    rationale,
    windowDays,
  };

  const studentName = `${student.nome} ${student.cognome}`;

  return {
    id: `oral-${student.id}-${Date.now()}`,
    actionType: 'suggest_oral_exam',
    urgency: windowDays <= 7 ? 'high' : windowDays <= 14 ? 'medium' : 'low',
    studentId: student.id,
    studentName,
    subjects: [subject],
    label: 'Programma interrogazione',
    description: `Suggerito: interrogazione in ${subject} nei prossimi ${windowDays} giorni.`,
    payload,
  };
}
