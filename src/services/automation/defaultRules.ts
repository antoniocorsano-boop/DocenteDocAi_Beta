/**
 * automation/defaultRules.ts — Built-in automation rules for DocenteDoc AI.
 *
 * Call `registerDefaultRules()` once at app startup (e.g. from main.tsx or
 * the first import of the automation module) to activate these rules.
 *
 * Each rule is designed around a single concern, easily enabled/disabled
 * per-installation via `automationEngine.disable(ruleId)`.
 */

import type { AutomationRule, AutomationTriggerPayload } from './types';
import { automationEngine } from './automationEngine';

// ─── Rule definitions ─────────────────────────────────────────────────────────

/**
 * RULE 1 — Auto-import students from high-confidence STUDENT_LIST documents.
 *
 * Fires when: STUDENT_LIST is detected with OCR confidence ≥ 0.85.
 * Action: routeDocumentIntent → handleAddStudentsFromDoc (via actionRouter)
 * Confirmation: required (teacher must approve student import)
 */
const autoImportStudents: AutomationRule = {
  id: 'auto_import_students',
  name: 'Importazione automatica studenti',
  description:
    'Quando viene rilevata una lista studenti con alta confidenza, ' +
    'propone di importare gli studenti nel registro.',
  triggerType: 'document_processed',
  condition: (payload: AutomationTriggerPayload): boolean => {
    if (payload.type !== 'document_processed') return false;
    return (
      payload.data.intent.document.type === 'STUDENT_LIST' &&
      payload.data.ocrConfidence >= 0.85
    );
  },
  action: { type: 'route_document_intent' },
  enabled: true,
  requiresConfirmation: true,
};

/**
 * RULE 2 — Confirm before importing grades.
 *
 * Fires when: GRADES_TABLE is detected (any confidence).
 * Action: routeDocumentIntent → handleImportGrades (via actionRouter)
 * Confirmation: always required — grade imports are high-risk.
 */
const confirmGradeImport: AutomationRule = {
  id: 'confirm_grade_import',
  name: 'Importazione voti da documento',
  description:
    'Quando viene rilevata una tabella voti, ' +
    'richiede conferma prima di importare le valutazioni.',
  triggerType: 'document_processed',
  condition: (payload: AutomationTriggerPayload): boolean => {
    if (payload.type !== 'document_processed') return false;
    return payload.data.intent.document.type === 'GRADES_TABLE';
  },
  action: { type: 'route_document_intent' },
  enabled: true,
  requiresConfirmation: true,
};

/**
 * RULE 3 — Warn on low-confidence OCR.
 *
 * Fires when: any document is processed with OCR confidence < 0.4.
 * Action: send_chat_message (no store mutation)
 * Confirmation: none — this is informational only.
 */
const warnLowConfidence: AutomationRule = {
  id: 'warn_low_confidence',
  name: 'Avviso qualità documento',
  description:
    'Notifica quando la qualità del documento è insufficiente per ' +
    'un\'elaborazione affidabile.',
  triggerType: 'document_processed',
  condition: (payload: AutomationTriggerPayload): boolean => {
    if (payload.type !== 'document_processed') return false;
    return payload.data.ocrConfidence < 0.4;
  },
  action: {
    type: 'send_chat_message',
    template:
      '⚠️ Il documento ({{documentType}}) è stato elaborato con bassa ' +
      'confidenza ({{confidence}}). Ti consiglio di riprendere la foto ' +
      'in condizioni di luce migliori o di inserire i dati manualmente.',
  },
  enabled: true,
  requiresConfirmation: false,
};

/**
 * RULE 4 — Track official documents and suggest email generation.
 *
 * Fires when: OFFICIAL_DOCUMENT is detected.
 * Action: send_chat_message suggesting the generate_email action.
 * Confirmation: none — just a suggestion.
 */
const suggestEmailForOfficialDoc: AutomationRule = {
  id: 'suggest_email_official_doc',
  name: 'Suggerimento email per documento ufficiale',
  description:
    'Quando viene rilevato un documento ufficiale, ' +
    'suggerisce di generare una bozza email.',
  triggerType: 'document_processed',
  condition: (payload: AutomationTriggerPayload): boolean => {
    if (payload.type !== 'document_processed') return false;
    return payload.data.intent.document.type === 'OFFICIAL_DOCUMENT';
  },
  action: {
    type: 'send_chat_message',
    template:
      '📧 Ho rilevato un documento ufficiale. ' +
      'Vuoi che generi una bozza email da inviare? ' +
      'Scrivi "genera email" per procedere.',
  },
  enabled: true,
  requiresConfirmation: false,
};

/**
 * RULE 5 — Log all assessment creations for audit trail.
 *
 * Fires when: any assessment is created.
 * Action: log_only (creates an audit entry in the execution log)
 * Confirmation: none.
 */
const auditAssessmentCreation: AutomationRule = {
  id: 'audit_assessment_creation',
  name: 'Registro audit valutazioni',
  description: 'Registra ogni nuova valutazione nel log di automazione per audit.',
  triggerType: 'assessment_created',
  condition: (_payload: AutomationTriggerPayload): boolean => true,
  action: { type: 'log_only' },
  enabled: true,
  requiresConfirmation: false,
};

// ─── Registration ─────────────────────────────────────────────────────────────

let _registered = false;

/**
 * Register all default rules into the engine.
 * Idempotent — safe to call multiple times.
 */
export function registerDefaultRules(): void {
  if (_registered) return;
  _registered = true;

  [
    autoImportStudents,
    confirmGradeImport,
    warnLowConfidence,
    suggestEmailForOfficialDoc,
    auditAssessmentCreation,
  ].forEach((r) => automationEngine.register(r));
}

/**
 * Individual rule IDs — useful for `automationEngine.disable(RULE_IDS.xxx)`.
 */
export const RULE_IDS = {
  autoImportStudents: 'auto_import_students',
  confirmGradeImport: 'confirm_grade_import',
  warnLowConfidence: 'warn_low_confidence',
  suggestEmailForOfficialDoc: 'suggest_email_official_doc',
  auditAssessmentCreation: 'audit_assessment_creation',
} as const;
