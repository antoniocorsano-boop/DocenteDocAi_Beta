/**
 * documentAI/intentDetector.ts — Maps ParsedDocument → DocumentIntent.
 *
 * Mapping table (hard rule, not learned):
 *   STUDENT_LIST      → add_students_from_doc
 *   GRADES_TABLE      → import_grades
 *   OFFICIAL_DOCUMENT → generate_email
 *   LESSON_PLAN       → parse_document  (pre-fill UDA wizard in app)
 *   UNKNOWN           → show_next_step  (fallback — no automatic action)
 *
 * Design:
 *   - Pure function
 *   - No side effects
 *   - Never throws
 */

import type { ParsedDocument, DocumentIntent } from './types';

/**
 * Derive the correct DocumentIntent from a parsed document.
 * Confidence is inherited from the document parser.
 */
export function detectDocumentIntent(doc: ParsedDocument): DocumentIntent {
  switch (doc.type) {
    case 'STUDENT_LIST':
      return { action: 'add_students_from_doc', document: doc, confidence: doc.confidence };

    case 'GRADES_TABLE':
      return { action: 'import_grades', document: doc, confidence: doc.confidence };

    case 'OFFICIAL_DOCUMENT':
      return { action: 'generate_email', document: doc, confidence: doc.confidence };

    case 'LESSON_PLAN':
      // Confidence penalty: UI wizard is needed to complete the UDA
      return { action: 'parse_document', document: doc, confidence: doc.confidence * 0.85 };

    case 'UNKNOWN':
    default:
      return { action: 'show_next_step', document: doc, confidence: 0 };
  }
}
