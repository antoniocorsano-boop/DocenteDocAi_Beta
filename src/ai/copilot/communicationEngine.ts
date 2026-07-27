/**
 * communicationEngine.ts — Sprint 3 Communication Helper
 *
 * Pure functions that generate pre-filled message templates for
 * parents and students based on AI performance data.
 * No side-effects. Deterministic. Safe to useMemo.
 *
 * Italian school context: 1–10 grading, formal address for parents.
 */
import type { AISuggestion } from '../contextEngine/types';
import type { Studente, Valutazione } from '@/types';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseVoto(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? -1 : n;
}

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
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
    out.set(s, parseFloat(mean(scores).toFixed(1)));
  return out;
}

function today(): string {
  return new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ── public types ──────────────────────────────────────────────────────────────

export type MessageTarget = 'parent' | 'student';
export type MessageTemplate =
  | 'recovery_parent'
  | 'recovery_student'
  | 'excellence_parent'
  | 'excellence_student'
  | 'missing_assessment_parent'
  | 'general_feedback_student';

export interface GeneratedMessage {
  id: string;
  studentId: string;
  studentName: string;
  target: MessageTarget;
  template: MessageTemplate;
  subject: string;
  body: string;
  /** label shown in the UI */
  templateLabel: string;
}

// ── template factories ────────────────────────────────────────────────────────

function recoveryParent(
  student: Studente,
  weakSubjects: string[],
  classAvg: number,
): GeneratedMessage {
  const name = `${student.cognome} ${student.nome}`;
  const subjList = weakSubjects.length
    ? weakSubjects.map((s) => `• ${s}`).join('\n')
    : '• (materie da definire con il docente)';

  return {
    id: `rp-${student.id}`,
    studentId: student.id,
    studentName: name,
    target: 'parent',
    template: 'recovery_parent',
    templateLabel: 'Recupero — Genitore',
    subject: `Comunicazione scolastica — ${name} — supporto didattico`,
    body: `Gentile famiglia di ${name},

La contatto riguardo all'andamento scolastico di ${student.nome} nel corso di questo periodo.

L'analisi dei risultati registrati indica alcune difficoltà nelle seguenti materie:

${subjList}

La media attuale di ${student.nome} (${classAvg > 0 ? classAvg.toFixed(1) : 'N/D'}) suggerisce che potrebbe beneficiare di un supporto aggiuntivo. Le propongo pertanto le seguenti azioni:

1. Sessioni di recupero individuale con il docente (previo accordo orario).
2. Studio cooperativo con un compagno in una fase di consolidamento.
3. Revisione puntuale degli argomenti critici tramite materiali strutturati.

Resto a totale disposizione per un colloquio chiarificatore.

Cordialmente,
Il/La Docente
${today()}`,
  };
}

function recoveryStudent(
  student: Studente,
  weakSubjects: string[],
): GeneratedMessage {
  const name = `${student.nome}`;
  const subjList = weakSubjects.length
    ? weakSubjects.join(', ')
    : 'alcune materie';

  return {
    id: `rs-${student.id}`,
    studentId: student.id,
    studentName: `${student.cognome} ${student.nome}`,
    target: 'student',
    template: 'recovery_student',
    templateLabel: 'Recupero — Studente',
    subject: `Feedback personale — piano di supporto`,
    body: `Ciao ${name},

Ho analizzato i tuoi risultati recenti e voglio darti un feedback diretto e costruttivo.

Ho notato alcune difficoltà in: ${subjList}.

Non preoccuparti — queste sono aree su cui possiamo lavorare insieme. Ecco cosa ti suggerisco:

✓ Rivedi gli appunti delle ultime settimane e segna i concetti meno chiari.
✓ Chiedi chiarimenti durante la lezione, senza aspettare la verifica.
✓ Dedica 20–30 minuti ogni giorno agli esercizi di rinforzo che ti fornirò.

Sono convinto/a che con impegno costante riuscirai a recuperare. Parlami pure se hai domande.

Il/La tuo/a Docente
${today()}`,
  };
}

function excellenceParent(
  student: Studente,
  strongSubjects: string[],
  topAvg: number,
): GeneratedMessage {
  const name = `${student.cognome} ${student.nome}`;
  const subjList = strongSubjects.length
    ? strongSubjects.map((s) => `• ${s}`).join('\n')
    : '• (eccellenza trasversale)';

  return {
    id: `ep-${student.id}`,
    studentId: student.id,
    studentName: name,
    target: 'parent',
    template: 'excellence_parent',
    templateLabel: 'Eccellenza — Genitore',
    subject: `Comunicazione scolastica — ${name} — risultati di eccellenza`,
    body: `Gentile famiglia di ${name},

Sono lieto/a di condividere con voi i risultati positivi ottenuti da ${student.nome} in questo periodo.

${student.nome} ha dimostrato un rendimento eccellente nelle seguenti materie:

${subjList}

Con una media di ${topAvg.toFixed(1)}, ${student.nome} si colloca tra i migliori studenti della classe e mostra costanza, impegno e capacità di approfondimento autonomo.

Per valorizzare ulteriormente queste qualità, sto preparando attività di arricchimento e approfondimento personalizzate.

Vi ringrazio per il supporto che offrite a casa e resto disponibile per qualsiasi comunicazione.

Cordialmente,
Il/La Docente
${today()}`,
  };
}

function excellenceStudent(
  student: Studente,
  strongSubjects: string[],
): GeneratedMessage {
  const name = `${student.nome}`;
  const subjList = strongSubjects.length
    ? strongSubjects.join(', ')
    : 'più materie';

  return {
    id: `es-${student.id}`,
    studentId: student.id,
    studentName: `${student.cognome} ${student.nome}`,
    target: 'student',
    template: 'excellence_student',
    templateLabel: 'Eccellenza — Studente',
    subject: `Complimenti e proposta di approfondimento`,
    body: `Ciao ${name},

Volevo ringraziarti e complimentarmi per i tuoi risultati in ${subjList}.

Il tuo impegno e la tua costanza si vedono chiaramente nei voti e nella qualità del tuo lavoro. Sei uno stimolo positivo per tutta la classe.

Proprio per questo, ho pensato ad alcune proposte che potrebbero interessarti:

★ Un progetto di ricerca su un tema avanzato a tua scelta.
★ L'opportunità di supportare un compagno nel percorso di recupero (tutoring).
★ Un approfondimento da presentare alla classe come esperienza di condivisione.

Dimmi cosa ne pensi e se sei interessato/a. Sono curioso/a di sapere su cosa vorresti lavorare.

Il/La tuo/a Docente
${today()}`,
  };
}

function missingAssessmentParent(
  student: Studente,
  subjects: string[],
): GeneratedMessage {
  const name = `${student.cognome} ${student.nome}`;
  const subjList = subjects.length
    ? subjects.map((s) => `• ${s}`).join('\n')
    : '• (materie da verificare)';

  return {
    id: `map-${student.id}`,
    studentId: student.id,
    studentName: name,
    target: 'parent',
    template: 'missing_assessment_parent',
    templateLabel: 'Val. mancante — Genitore',
    subject: `Comunicazione scolastica — ${name} — valutazioni incomplete`,
    body: `Gentile famiglia di ${name},

La contatto per segnalare che ${student.nome} risulta privo/a di valutazioni in alcune materie nel periodo corrente:

${subjList}

L'assenza di dati di valutazione non mi consente di monitorare adeguatamente il suo percorso. Vi chiedo cortesemente di incoraggiare ${student.nome} a partecipare attivamente alle verifiche programmate.

In caso di difficoltà particolari o situazioni che devo conoscere, non esitate a contattarmi.

Cordialmente,
Il/La Docente
${today()}`,
  };
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Generates communication messages for all students flagged by AI suggestions.
 * Returns both parent and student versions for each suggestion.
 */
export function generateCommunications(
  suggestions: AISuggestion[],
  students: Studente[],
  evaluations: Valutazione[],
): GeneratedMessage[] {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const messages: GeneratedMessage[] = [];

  for (const suggestion of suggestions) {
    if (!suggestion.studentId) continue;
    const student = studentMap.get(suggestion.studentId);
    if (!student) continue;

    const avgs = subjectAverages(student.id, evaluations);

    if (suggestion.type === 'student_at_risk') {
      const weak = [...avgs.entries()]
        .filter(([, avg]) => avg < 5.5)
        .sort(([, a], [, b]) => a - b)
        .map(([s]) => s);
      const overallAvg = avgs.size
        ? mean([...avgs.values()])
        : 0;
      messages.push(recoveryParent(student, weak, overallAvg));
      messages.push(recoveryStudent(student, weak));
    }

    if (suggestion.type === 'student_excellence') {
      const strong = [...avgs.entries()]
        .filter(([, avg]) => avg >= 8)
        .sort(([, a], [, b]) => b - a)
        .map(([s]) => s);
      const topAvg = strong.length
        ? mean(strong.map((s) => avgs.get(s) ?? 0))
        : mean([...avgs.values()]);
      messages.push(excellenceParent(student, strong, topAvg));
      messages.push(excellenceStudent(student, strong));
    }

    if (suggestion.type === 'missing_assessment') {
      // subjects with zero valid evaluations
      const allSubjects = [...new Set(evaluations.map((e) => e.materia))];
      const missing = allSubjects.filter((s) => !avgs.has(s));
      messages.push(missingAssessmentParent(student, missing));
    }
  }

  return messages;
}
