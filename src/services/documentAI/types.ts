/**
 * documentAI/types.ts — Unified schema for Document AI pipeline.
 *
 * Rules:
 *   - Document AI modules NEVER write to stores
 *   - All modules return structured output only
 *   - Callers (actionRouter) own the store mutation
 *
 * Pipeline:
 *   ExtendedInput → ocrService → documentParser → intentDetector → ActionRouter
 */

// ─── Input ────────────────────────────────────────────────────────────────────

/**
 * Normalised input for the chat pipeline.
 * Extends the existing text-only flow to support image-based document inputs.
 */
export type ExtendedInput =
  | { type: 'text'; content: string; source: 'whatsapp' | 'telegram' | 'app' }
  | {
      type: 'image';
      /**
       * Base64-encoded image string (data URL or raw base64).
       * Using string avoids File API (not available in Edge Functions).
       */
      content: string;
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
      source: 'whatsapp' | 'telegram' | 'app';
      metadata?: Record<string, string>;
    };

// ─── Document types ───────────────────────────────────────────────────────────

export type DocumentType =
  | 'STUDENT_LIST'
  | 'GRADES_TABLE'
  | 'OFFICIAL_DOCUMENT'
  | 'LESSON_PLAN'
  | 'UNKNOWN';

// ─── OCR output ───────────────────────────────────────────────────────────────

export interface OcrResult {
  /** Raw extracted text — may contain noise */
  rawText: string;
  /** 0–1 confidence from the OCR provider */
  confidence: number;
  /** ISO timestamp of extraction */
  extractedAt: string;
}

// ─── Parsed document ─────────────────────────────────────────────────────────

export interface ParsedStudentList {
  students: Array<{ name: string; className?: string }>;
}

export interface ParsedGradesTable {
  evaluations: Array<{ studentName: string; grade: string; subject?: string }>;
}

export interface ParsedOfficialDocument {
  title?: string;
  body: string;
  recipient?: string;
}

export interface ParsedLessonPlan {
  subject?: string;
  objectives?: string[];
  sections?: string[];
}

/**
 * Unified parsed document output.
 * Each `type` carries its typed `data`; `warnings` are non-blocking.
 */
export type ParsedDocument =
  | { type: 'STUDENT_LIST';      confidence: number; data: ParsedStudentList;      warnings?: string[] }
  | { type: 'GRADES_TABLE';      confidence: number; data: ParsedGradesTable;      warnings?: string[] }
  | { type: 'OFFICIAL_DOCUMENT'; confidence: number; data: ParsedOfficialDocument; warnings?: string[] }
  | { type: 'LESSON_PLAN';       confidence: number; data: ParsedLessonPlan;       warnings?: string[] }
  | { type: 'UNKNOWN';           confidence: number; data: { rawText: string };    warnings?: string[] };

// ─── Document intent ──────────────────────────────────────────────────────────

/**
 * Maps a parsed document to actionRouter intent actions.
 *
 * Intent mapping table:
 *   STUDENT_LIST      → add_students_from_doc
 *   GRADES_TABLE      → import_grades
 *   OFFICIAL_DOCUMENT → generate_email
 *   LESSON_PLAN       → create_uda (pre-filled)
 *   UNKNOWN           → show_next_step (fallback)
 */
export type DocumentIntentAction =
  | 'add_students_from_doc'
  | 'import_grades'
  | 'generate_email'
  | 'parse_document'
  | 'show_next_step';

export interface DocumentIntent {
  action: DocumentIntentAction;
  document: ParsedDocument;
  /** 0–1 confidence that this is the right action for this document */
  confidence: number;
}
