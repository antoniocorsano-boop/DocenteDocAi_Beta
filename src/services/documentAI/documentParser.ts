/**
 * documentAI/documentParser.ts — Converts raw OCR text → structured ParsedDocument.
 *
 * Heuristic pattern-based parsing for Italian school documents.
 * No ML model required — rules cover the common cases for a teacher's workflow.
 *
 * Design:
 *   - Pure function: no side effects, no imports from stores
 *   - Never throws — always returns a ParsedDocument (falls back to UNKNOWN)
 *   - Warnings are non-blocking: partial data is returned with warnings
 */

import type {
  ParsedDocument,
  ParsedStudentList,
  ParsedGradesTable,
  ParsedOfficialDocument,
  ParsedLessonPlan,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lines that look like Italian full names: "Mario Rossi", "DE LUCA Anna", etc. */
const NAME_LINE_RE = /^([A-ZÀÈÉÌÒÙ][a-zàèéìòù']+(?:\s+[A-ZÀÈÉÌÒÙ][a-zàèéìòù']+){1,3})\s*$/;

/** Grade patterns: "7", "7.5", "7,5", "ottimo", "sufficiente", "A", "B" */
const GRADE_RE = /\b(\d{1,2}(?:[.,]\d)?|ottimo|distinto|buono|sufficiente|insufficiente|[A-E])\b/i;

/** Class name patterns: "2B", "3A", "IV B", "quinta" */
const CLASS_RE = /\b([1-5IVX]+\s*[A-Z])\b/i;

// ─── Student list detector ────────────────────────────────────────────────────

function tryParseStudentList(text: string): ParsedStudentList | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Need at least 3 name-like lines to be confident
  const nameLines = lines.filter((l) => NAME_LINE_RE.test(l));
  if (nameLines.length < 3) return null;

  const classMatch = text.match(CLASS_RE);
  const parsedClass = classMatch?.[1]?.toUpperCase();

  return {
    students: nameLines.map((name) => ({
      name,
      className: parsedClass,
    })),
  };
}

// ─── Grades table detector ────────────────────────────────────────────────────

function tryParseGradesTable(text: string): ParsedGradesTable | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Look for lines that contain both a name and a grade value
  const evalLines = lines.filter((l) => NAME_LINE_RE.test(l.split(/\t|  +/)[0]) && GRADE_RE.test(l));
  if (evalLines.length < 2) return null;

  const subjectMatch = text.match(/(?:materia|disciplina|subject)[:\s]+([^\n]+)/i);

  return {
    evaluations: evalLines.map((line) => {
      const cols = line.split(/\t|  +/);
      const studentName = cols[0]?.trim() ?? '';
      const gradeMatch = line.match(GRADE_RE);
      return {
        studentName,
        grade: gradeMatch?.[1] ?? '',
        subject: subjectMatch?.[1]?.trim(),
      };
    }),
  };
}

// ─── Official document detector ───────────────────────────────────────────────

const OFFICIAL_KEYWORDS_RE =
  /\b(oggetto|spett\.?le|al\s+dirigente|alla\s+preside|ministero|circolare|comunicazione\s+ufficiale|verbale)\b/i;

function tryParseOfficialDocument(text: string): ParsedOfficialDocument | null {
  if (!OFFICIAL_KEYWORDS_RE.test(text)) return null;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const objectMatch = text.match(/oggetto[:\s]+([^\n]+)/i);
  const recipientMatch = text.match(/(?:spett\.?le|al\s+dirigente|alla\s+preside)[:\s]+([^\n]+)/i);

  return {
    title: objectMatch?.[1]?.trim(),
    recipient: recipientMatch?.[1]?.trim(),
    body: lines.join('\n'),
  };
}

// ─── Lesson plan detector ─────────────────────────────────────────────────────

const LESSON_PLAN_KEYWORDS_RE =
  /\b(obiettivi|competenze|attivit[àa]|metodologia|uda|unit[àa]\s+didattica|programmazione)\b/i;

function tryParseLessonPlan(text: string): ParsedLessonPlan | null {
  if (!LESSON_PLAN_KEYWORDS_RE.test(text)) return null;

  const subjectMatch = text.match(/(?:disciplina|materia|subject)[:\s]+([^\n]+)/i);
  const objectiveLines = text
    .split('\n')
    .filter((l) => /^\s*[-•*]\s+.{5,}/.test(l))
    .map((l) => l.replace(/^\s*[-•*]\s+/, '').trim())
    .slice(0, 8);

  return {
    subject: subjectMatch?.[1]?.trim(),
    objectives: objectiveLines.length > 0 ? objectiveLines : undefined,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStudentList(data: ParsedStudentList): string[] {
  const warnings: string[] = [];
  const unclear = data.students.filter((s) => s.name.split(' ').length < 2);
  if (unclear.length > 0) {
    warnings.push(`${unclear.length} nome${unclear.length > 1 ? 'i' : ''} poco chiar${unclear.length > 1 ? 'i' : 'o'}: ${unclear.map((s) => s.name).join(', ')}`);
  }
  return warnings;
}

function validateGradesTable(data: ParsedGradesTable): string[] {
  const warnings: string[] = [];
  const missing = data.evaluations.filter((e) => !e.grade);
  if (missing.length > 0) {
    warnings.push(`${missing.length} valutazion${missing.length > 1 ? 'i' : 'e'} senza voto`);
  }
  return warnings;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Parse raw OCR text into a typed ParsedDocument.
 * Detection order follows document likelihood in teacher workflows.
 */
export function parseDocument(rawText: string, ocrConfidence: number): ParsedDocument {
  if (!rawText.trim()) {
    return { type: 'UNKNOWN', confidence: 0, data: { rawText }, warnings: ['Nessun testo estratto'] };
  }

  // Student list — most common document type
  const studentData = tryParseStudentList(rawText);
  if (studentData) {
    const warnings = validateStudentList(studentData);
    return { type: 'STUDENT_LIST', confidence: ocrConfidence * 0.95, data: studentData, warnings };
  }

  // Grades table
  const gradesData = tryParseGradesTable(rawText);
  if (gradesData) {
    const warnings = validateGradesTable(gradesData);
    return { type: 'GRADES_TABLE', confidence: ocrConfidence * 0.88, data: gradesData, warnings };
  }

  // Official document
  const officialData = tryParseOfficialDocument(rawText);
  if (officialData) {
    return { type: 'OFFICIAL_DOCUMENT', confidence: ocrConfidence * 0.82, data: officialData };
  }

  // Lesson plan
  const lessonData = tryParseLessonPlan(rawText);
  if (lessonData) {
    return { type: 'LESSON_PLAN', confidence: ocrConfidence * 0.80, data: lessonData };
  }

  // Fallback
  return {
    type: 'UNKNOWN',
    confidence: ocrConfidence * 0.3,
    data: { rawText },
    warnings: ['Tipo documento non riconosciuto — richiesta conferma utente'],
  };
}
