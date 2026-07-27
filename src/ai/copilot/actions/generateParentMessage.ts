/**
 * generateParentMessage.ts — Action: generate a parent communication
 *
 * Produces a ready-to-send Italian-language message to the student's
 * parent/guardian, pre-filled with student name, subject, grade data,
 * and suggested next steps.
 */
import type { AISuggestion } from '../../contextEngine/types';
import type { Studente, Valutazione } from '@/types';
import type { CopilotAction, ParentMessagePayload } from './types';

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

function italianDate(): string {
  return new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function buildMessageBody(
  studentName: string,
  avgGrade: number,
  weakSubjects: string[],
  isDeclining: boolean,
): string {
  const subjectsList =
    weakSubjects.length > 0
      ? weakSubjects.join(', ')
      : 'alcune materie';

  const trendNote = isDeclining
    ? 'Il recente andamento mostra un trend negativo che richiede attenzione.'
    : `La media attuale è di ${avgGrade.toFixed(1)}/10.`;

  return (
    `Gentile famiglia,\n\n` +
    `Le scriviamo in merito all'andamento scolastico di ${studentName}.\n\n` +
    `${trendNote} ` +
    `Lo studente presenta difficoltà in: ${subjectsList}.\n\n` +
    `Le chiediamo di supportare il percorso di recupero anche a casa ` +
    `e di contattarci qualora desidera un colloquio.\n\n` +
    `Cordiali saluti,\n` +
    `Il Docente`
  );
}

/**
 * Builds a generate_parent_message CopilotAction for an at-risk student.
 */
export function buildGenerateParentMessageAction(
  suggestion: AISuggestion,
  student: Studente,
  evaluations: Valutazione[],
): CopilotAction {
  const avgs = subjectAverages(student.id, evaluations);

  const weakSubjects = [...avgs.entries()]
    .filter(([, avg]) => avg < 5.5)
    .sort(([, a], [, b]) => a - b)
    .map(([s]) => s)
    .slice(0, 3);

  const allScores = [...avgs.values()];
  const avgGrade =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 5;

  const isDeclining = suggestion.confidence > 0.75 && avgGrade < 5.5;
  const studentName = `${student.nome} ${student.cognome}`;

  const body = buildMessageBody(studentName, avgGrade, weakSubjects, isDeclining);
  const messageSubject = `Comunicazione scolastica — ${student.cognome} ${student.nome} — andamento didattico`;

  const payload: ParentMessagePayload = {
    type: 'generate_parent_message',
    subject: messageSubject,
    body,
    generatedAt: new Date().toISOString(),
  };

  return {
    id: `msg-${student.id}-${Date.now()}`,
    actionType: 'generate_parent_message',
    urgency: isDeclining ? 'high' : 'medium',
    studentId: student.id,
    studentName,
    subjects: weakSubjects,
    label: 'Comunica alla famiglia',
    description: `Genera messaggio per i genitori di ${studentName} — ${italianDate()}.`,
    payload,
  };
}
