/**
 * Type Definitions Index
 *
 * Domain type modules. All types are re-exported from src/types.ts for
 * backward-compatible access via `import { X } from '../types'`.
 *
 * Domain modules (import directly for tree-shaking in isolated modules):
 * - uda.types     — Slot, Lezione, Uda, Rubrica, Competenza, TimetableSettings …
 * - student.types — Studente, Valutazione, RegisterEntry, PianoInclusione …
 * - ai.types      — AiSettings, KnowledgeBaseEntry, Corpus, DTOs …
 * - template.types — DocumentTemplate, Report, BrochureContent …
 * - calendar.types — EventoCalendario, TipoEvento
 * - analytics.types — AnalyticsEvent, AnalyticsMetrics, AnalyticsSettings
 */

export * from './uda.types';
export * from './student.types';
export * from './ai.types';
export * from './template.types';
export * from './calendar.types';
export * from './analytics.types';
export * from './metrics';
export * from './SyncConflictData';
export * from './funding.types';
export * from './aiMaturita.types';
export * from './teacherModel.types';
export * from './integration.types';
export * from './sovereignty.types';
export * from './settings.types';


// Legacy types.ts exports (to be migrated)
// NOTE: Import from '../types' for now until migration is complete
