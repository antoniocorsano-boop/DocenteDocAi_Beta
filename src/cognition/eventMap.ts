/**
 * EventMap.ts — Mappa canonica degli eventi dell'app DocenteDoc AI.
 *
 * Fonte unica di veritÃ  per:
 *   - TCM (UsageTracker, WorkflowPatternDetector, CapabilityEngine)
 *   - Copilot (quando e cosa suggerire)
 *   - Analytics / Debugging
 *   - Documentazione degli intent utente
 *
 * Ogni AppEvent descrive:
 *   - name           → chiave tipizzata (keyof CognitionEvents)
 *   - source         → modulo/feature che emette l'evento
 *   - description    → spiegazione leggibile (per debug e docs)
 *   - payload        → schema del payload (chiave → tipo stringa)
 *   - type           → userAction | systemAction | copilotInteraction
 *   - frequency      → rare | occasional | frequent
 *   - requiresStudents → false = compatibile con modalitÃ  personale (no classe)
 *   - patterns       → WorkflowPattern ID associati
 *   - copilotHint    → suggerimento Copilot associato a questo evento
 *
 * Per aggiungere un evento:
 *   1. Aggiungilo a CognitionEvents in CognitionBus.ts
 *   2. Aggiungilo a eventMap qui sotto
 *   3. Aggiungi eventuali predictions in CopilotPredictions.ts
 */

import type { CognitionEvents } from './CognitionBus';

// â”€â”€ Interface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AppEvent {
  /** Chiave event tipizzata — deve corrispondere a un key di CognitionEvents */
  name: keyof CognitionEvents;
  /** Modulo/feature che emette questo evento */
  source: string;
  /** Spiegazione leggibile: cosa succede e perché viene emesso */
  description: string;
  /** Schema del payload: chiave → descrizione tipo (solo documentazione) */
  payload: Record<string, string>;
  /** Categoria semantica dell'evento */
  type: 'userAction' | 'systemAction' | 'copilotInteraction';
  /** Frequenza di emissione attesa durante una sessione tipica */
  frequency: 'rare' | 'occasional' | 'frequent';
  /**
   * false o assente = evento compatibile con modalitÃ  personale (docente senza classe).
   * true = evento richiede almeno uno studente configurato.
   */
  requiresStudents?: boolean;
  /** ID dei WorkflowPattern che includono questo evento */
  patterns?: string[];
  /** Suggerimento proattivo che il Copilot può offrire al verificarsi di questo evento */
  copilotHint?: string;
}

// â”€â”€ Mappa completa degli eventi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const eventMap: AppEvent[] = [

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  REGISTRO / LEZIONI
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'lesson.created',
    source: 'Classroom/Register → useAppEngine.onAddLessons',
    description: 'Il docente ha aggiunto una nuova lezione al registro.',
    payload: { lessonId: 'string' },
    type: 'userAction',
    frequency: 'frequent',
    requiresStudents: true,
    patterns: ['lessonWorkflow'],
    copilotHint: 'Vuoi generare una verifica per questa lezione?',
  },
  {
    name: 'lesson.updated',
    source: 'Classroom/Register → useAppEngine',
    description: 'Il docente ha modificato i dettagli di una lezione esistente.',
    payload: { lessonId: 'string' },
    type: 'userAction',
    frequency: 'frequent',
    requiresStudents: true,
    patterns: ['lessonWorkflow'],
  },
  {
    name: 'lesson.deleted',
    source: 'Classroom/Register → useAppEngine',
    description: 'Il docente ha eliminato una lezione dal registro.',
    payload: { lessonId: 'string' },
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: true,
  },
  {
    name: 'attendance.recorded',
    source: 'Classroom/Register → useAppEngine.onMarkAttendance',
    description: 'Il docente ha registrato la presenza/assenza per una lezione.',
    payload: { lessonId: 'string' },
    type: 'userAction',
    frequency: 'frequent',
    requiresStudents: true,
    patterns: ['lessonWorkflow'],
    copilotHint: 'Vuoi aggiungere un\'annotazione per gli assenti?',
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  VALUTAZIONI
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'assessment.generated',
    source: 'Copilot/Assessment → AI Pipeline',
    description: 'Il Copilot AI ha generato una verifica per una lezione.',
    payload: { assessmentId: 'string' },
    type: 'copilotInteraction',
    frequency: 'occasional',
    requiresStudents: true,
    patterns: ['assessmentWorkflow'],
    copilotHint: 'Verifica generata — vuoi personalizzarla o salvarla subito?',
  },
  {
    name: 'evaluation.added',
    source: 'Classroom/Grades → useAppEngine.handleAddEvaluation',
    description: 'Il docente ha inserito una valutazione per uno studente.',
    payload: { studentId: 'string' },
    type: 'userAction',
    frequency: 'frequent',
    requiresStudents: true,
    patterns: ['assessmentWorkflow'],
    copilotHint: 'Vuoi generare un feedback personalizzato per questo studente?',
  },
  {
    name: 'evaluation.bulk_added',
    source: 'Classroom/Grades → importEvaluations',
    description: 'Il docente ha importato valutazioni multiple in blocco.',
    payload: { count: 'number' },
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: true,
    patterns: ['assessmentWorkflow'],
    copilotHint: 'Import completato — vuoi vedere l\'analisi della classe?',
  },
  {
    name: 'rubric.created',
    source: 'Copilot/Rubric → AI Pipeline',
    description: 'Il Copilot ha generato una rubrica di valutazione.',
    payload: { rubricId: 'string' },
    type: 'copilotInteraction',
    frequency: 'occasional',
    requiresStudents: false,
    patterns: ['assessmentWorkflow'],
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  UDA / PROGETTAZIONE
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'uda.created',
    source: 'Planning/UDA → useAppEngine.handleCreateUda',
    description: 'Il docente ha creato una nuova UnitÃ  Didattica di Apprendimento.',
    payload: { udaId: 'string' },
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: false,
    patterns: ['planningWorkflow'],
    copilotHint: 'UDA creata — vuoi pianificare subito la sequenza di lezioni?',
  },
  {
    name: 'uda.updated',
    source: 'Planning/UDA → useAppEngine.onSaveUda',
    description: 'Il docente ha salvato modifiche a una UDA esistente.',
    payload: { udaId: 'string' },
    type: 'userAction',
    frequency: 'frequent',
    requiresStudents: false,
    patterns: ['planningWorkflow'],
  },
  {
    name: 'planning.wizard.completed',
    source: 'Planning/Wizard → ClassPlanningWizard | AnnualPlanningWizard',
    description: 'Il docente ha completato il wizard di pianificazione.',
    payload: {},
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: false,
    patterns: ['planningWorkflow'],
    copilotHint: 'Piano completato — vuoi esportarlo in PDF?',
  },
  {
    name: 'annual.plan.created',
    source: 'Planning/Annual → AnnualPlanningWizard',
    description: 'Il docente ha creato il piano annuale.',
    payload: {},
    type: 'userAction',
    frequency: 'rare',
    requiresStudents: false,
    patterns: ['planningWorkflow'],
    copilotHint: 'Piano annuale pronto — vuoi condividerlo con i colleghi?',
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  STUDENTI
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'student.added',
    source: 'Classroom/Students → studentActions.saveStudent',
    description: 'Il docente ha aggiunto uno studente alla classe.',
    payload: { studentId: 'string' },
    type: 'userAction',
    frequency: 'occasional',
  },
  {
    name: 'student.profile.updated',
    source: 'Classroom/Students → studentActions.saveStudent',
    description: 'Il docente ha aggiornato il profilo di uno studente.',
    payload: { studentId: 'string' },
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: true,
  },
  {
    name: 'student.risk.changed',
    source: 'AI/Prediction → unifiedOrchestrator',
    description: 'Il sistema AI ha rilevato un cambio nel livello di rischio di uno studente.',
    payload: { studentId: 'string', risk: 'low|medium|high' },
    type: 'systemAction',
    frequency: 'occasional',
    requiresStudents: true,
    patterns: ['analysisWorkflow'],
    copilotHint: 'Studente a rischio rilevato — vuoi vedere la spiegazione AI o generare un piano di intervento?',
  },

  // â”€â”€ Crescita classe (milestone) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    name: 'class.first_student_added',
    source: 'Classroom/Students → studentActions.saveStudent (milestone)',
    description: 'Primo studente aggiunto a una classe vuota — milestone onboarding.',
    payload: { studentId: 'string' },
    type: 'userAction',
    frequency: 'rare',
    copilotHint: 'Ottima mossa! Ora puoi iniziare a registrare lezioni e valutazioni.',
  },
  {
    name: 'class.roster.completed',
    source: 'Classroom/Students → importStudents (bulk)',
    description: 'Il docente ha importato o completato il registro della classe.',
    payload: { studentCount: 'number' },
    type: 'userAction',
    frequency: 'rare',
    copilotHint: 'Classe configurata — vuoi importare le valutazioni dell\'anno precedente?',
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  KNOWLEDGE BASE
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'kb.document.uploaded',
    source: 'KnowledgeBase → handleSaveToKb',
    description: 'Il docente ha caricato un documento nella Knowledge Base.',
    payload: { docId: 'string' },
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: false,
    copilotHint: 'Documento salvato — vuoi che il Copilot lo analizzi e lo indicizzi?',
  },
  {
    name: 'kb.document.queried',
    source: 'KnowledgeBase → AI query',
    description: 'Il docente ha interrogato la Knowledge Base con una domanda AI.',
    payload: { query: 'string' },
    type: 'userAction',
    frequency: 'frequent',
    requiresStudents: false,
    patterns: ['analysisWorkflow'],
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  AI / COPILOT
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'copilot.suggestion.accepted',
    source: 'Copilot/Actions → executeCopilotAction',
    description: 'Il docente ha accettato e avviato un suggerimento del Copilot.',
    payload: { suggestionId: 'string' },
    type: 'copilotInteraction',
    frequency: 'occasional',
  },
  {
    name: 'copilot.suggestion.rejected',
    source: 'Copilot/Provider → dismiss',
    description: 'Il docente ha ignorato/rifiutato un suggerimento del Copilot.',
    payload: { suggestionId: 'string' },
    type: 'copilotInteraction',
    frequency: 'occasional',
  },
  {
    name: 'copilot.manual_prompt',
    source: 'Copilot/Chat → AssistantModal | CopilotDocentePanel',
    description: 'Il docente ha inviato un prompt manuale al Copilot AI.',
    payload: {},
    type: 'copilotInteraction',
    frequency: 'frequent',
    patterns: ['analysisWorkflow'],
  },
  {
    name: 'copilot.automation.enabled',
    source: 'Copilot/Settings',
    description: 'Il docente ha abilitato le automazioni del Copilot.',
    payload: {},
    type: 'userAction',
    frequency: 'rare',
  },
  {    name: 'artistic.suggestions.generated',
    source: 'ArtisticConsilium → generateArtisticSuggestions',
    description: 'Il Consilium Artistico ha generato attività artistiche tramite AI per una UDA o contesto docente.',
    payload: { count: 'number (attività generate)', subject: 'string | undefined', gradeLevel: 'string | undefined' },
    type: 'copilotInteraction',
    frequency: 'occasional',
    requiresStudents: false,
    copilotHint: 'Attività artistiche pronte — aprile il tab Artistico per esplorarle.',
  },
  {    name: 'ai.pipeline.completed',
    source: 'AI/Orchestrator → unifiedOrchestrator | PipelineRegistry',
    description: 'Una pipeline AI ha completato l\'elaborazione.',
    payload: { pipeline: 'string (pipeline id, es. copilot.chat)' },
    type: 'systemAction',
    frequency: 'occasional',
  },
  {
    name: 'ai.interaction',
    source: 'AI → qualsiasi chiamata AI completata',
    description: 'Interazione generica con il layer AI completata.',
    payload: {},
    type: 'copilotInteraction',
    frequency: 'frequent',
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  DRIVE / BACKUP
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'drive.connected',
    source: 'Settings/Cloud → useDriveSyncEngine.handleConnectDrive',
    description: 'Il docente ha collegato il proprio account Google Drive.',
    payload: {},
    type: 'userAction',
    frequency: 'rare',
    requiresStudents: false,
    patterns: ['driveWorkflow'],
    copilotHint: 'Google Drive collegato — abilita il backup automatico per proteggere i tuoi dati.',
  },
  {
    name: 'drive.backup.saved',
    source: 'Settings/Cloud → useDriveSyncEngine.handleSyncToDrive',
    description: 'Il backup dei dati è stato salvato su Google Drive.',
    payload: {},
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: false,
    patterns: ['driveWorkflow'],
  },
  {
    name: 'drive.backup.restored',
    source: 'Settings/Cloud → useDriveSyncEngine.handleRestoreFromDrive',
    description: 'I dati sono stati ripristinati da un backup su Google Drive.',
    payload: {},
    type: 'userAction',
    frequency: 'rare',
    requiresStudents: false,
    patterns: ['driveWorkflow'],
    copilotHint: 'Ripristino completato — vuoi verificare l\'integritÃ  dei dati?',
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  NAVIGAZIONE
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'navigation.view_changed',
    source: 'Navigation → useNavigationEngine.handleNavigate',
    description: 'Il docente ha navigato verso una nuova sezione dell\'app.',
    payload: { from: 'string (view id)', to: 'string (view id)' },
    type: 'userAction',
    frequency: 'frequent',
    requiresStudents: false,
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  EXPORT
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'export.generated',
    source: 'Export → PDF/CSV generator',
    description: 'Il docente ha esportato un documento (PDF o CSV).',
    payload: { format: 'pdf|csv', type: 'string (document type)' },
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: false,
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  ANALYTICS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'analytics.viewed',
    source: 'Analytics/Dashboard → AnalyticsHub',
    description: 'Il docente ha aperto la sezione Analytics / Dashboard.',
    payload: {},
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: false,
    patterns: ['analysisWorkflow'],
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  WORKSPACE / USO PERSONALE
  //  Questi eventi sono compatibili con la modalitÃ  senza studenti.
  //  Il sistema si adegua all'uso: lo strumento cresce con il docente.
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'teacher.preference.updated',
    source: 'Settings → settingsActions.setSettings | setThemeState',
    description: 'Il docente ha aggiornato una preferenza personale (tema, lingua, layout, privacy).',
    payload: { key: 'string (preference key)', value: 'string (new value)' },
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: false,
    copilotHint: 'Preferenze aggiornate — l\'app si adegua alla tua configurazione.',
  },
  {
    name: 'workspace.configured',
    source: 'Onboarding → Settings wizard',
    description: 'Il docente ha completato la configurazione iniziale del workspace.',
    payload: {},
    type: 'userAction',
    frequency: 'rare',
    requiresStudents: false,
    copilotHint: 'Workspace configurato! Puoi iniziare subito a lavorare o aggiungere studenti in seguito.',
  },
  {
    name: 'feature.discovered',
    source: 'Navigation → prima visita di una view/feature',
    description: 'Il docente ha raggiunto una funzionalitÃ  per la prima volta.',
    payload: { feature: 'string (view o feature id)' },
    type: 'systemAction',
    frequency: 'occasional',
    requiresStudents: false,
    copilotHint: 'Nuova area scoperta — vuoi una breve guida su questa funzionalitÃ ?',
  },
  {
    name: 'session.mode',
    source: 'App → modalitÃ  personale vs. classe',
    description: 'Il docente è passato tra modalitÃ  personale (senza classe) e modalitÃ  classe.',
    payload: { mode: 'personal|classroom' },
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: false,
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  LIBRI / SERVIZI ESTERNI
  //  Integrations: libri di testo, editori, LMS, portali PA
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'book.account.linked',
    source: 'Settings/Integrations → external book service OAuth',
    description: 'Il docente ha collegato l\'account di un editore o piattaforma libro.',
    payload: {
      serviceId: 'string (es. pearson, zanichelli, mondadori)',
      bookIsbn: 'string (ISBN del libro adottato)',
      publisher: 'string (nome editore)',
    },
    type: 'userAction',
    frequency: 'rare',
    requiresStudents: false,
    copilotHint: 'Account libro collegato — ora puoi accedere alle risorse digitali direttamente dall\'app.',
  },
  {
    name: 'book.service.interacted',
    source: 'Settings/Integrations → book service actions',
    description: 'Il docente ha interagito con un servizio libro collegato (es. aperto risorse, sincronizzato contenuti).',
    payload: {
      serviceId: 'string',
      action: 'string (es. open_resource, sync, view_exercises)',
      resourceId: 'string (ID risorsa acceduta)',
    },
    type: 'userAction',
    frequency: 'occasional',
    requiresStudents: false,
    copilotHint: 'Risorsa libro aperta — vuoi integrarla nella pianificazione della tua UDA?',
  },
  {
    name: 'external.service.connected',
    source: 'Settings/Integrations → external service OAuth',
    description: 'Il docente ha connesso un servizio esterno (LMS, registro elettronico, portale PA, Classroom).',
    payload: {
      serviceId: 'string',
      serviceType: 'string (es. lms, registro, pa_portal, google_classroom)',
    },
    type: 'userAction',
    frequency: 'rare',
    requiresStudents: false,
    copilotHint: 'Servizio connesso — le tue attivitÃ  saranno sincronizzate automaticamente.',
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  SISTEMA
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    name: 'app.session.started',
    source: 'App → useCognitionBusEmitter (mount)',
    description: 'L\'app è stata avviata e una nuova sessione di lavoro è iniziata.',
    payload: {},
    type: 'systemAction',
    frequency: 'frequent',
    requiresStudents: false,
  },
  {
    name: 'onboarding.completed',
    source: 'Onboarding → OnboardingWizard.onComplete',
    description: 'Il docente ha completato il flusso di onboarding iniziale.',
    payload: {},
    type: 'userAction',
    frequency: 'rare',
    requiresStudents: false,
    copilotHint: 'Benvenuto! Sono qui per aiutarti — puoi iniziare subito a pianificare.',
  },
];
// ── Lookup utilities ───────────────────────────────────────────────────────

/** Lookup a single event by name. Returns undefined if not found. */
export function getEventMeta(name: keyof CognitionEvents): AppEvent | undefined {
  return eventMap.find((e) => e.name === name);
}

/** All events that participate in a given WorkflowPattern */
export function getEventsByPattern(patternId: string): AppEvent[] {
  return eventMap.filter((e) => e.patterns?.includes(patternId));
}

/** All events of a given semantic type */
export function getEventsByType(type: AppEvent['type']): AppEvent[] {
  return eventMap.filter((e) => e.type === type);
}

/** All events that have a Copilot hint (proactive suggestion) */
export function getCopilotEvents(): AppEvent[] {
  return eventMap.filter((e) => e.copilotHint != null);
}

/** Events compatible with personal mode (no students required) */
export function getPersonalModeEvents(): AppEvent[] {
  return eventMap.filter((e) => e.requiresStudents !== true);
}
