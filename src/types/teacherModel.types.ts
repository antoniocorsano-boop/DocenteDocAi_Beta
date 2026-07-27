/**
 * Teacher Cognitive Model (TCM) — Type Definitions
 *
 * Source of truth: docs/architecture/teacher-cognitive-model.md
 */

/** 4 internal capability levels — never exposed directly in UI */
export type CapabilityLevel = 1 | 2 | 3 | 4;

/** 3 UX-facing journey levels (mapped from CapabilityLevel) */
export type JourneyLevel = 'esploratore' | 'praticante' | 'maestro';

/**
 * Sorgente del suggerimento — deve corrispondere a
 * DecisionContract.allowedSuggestionSources.
 */
export type SuggestionSource = 'copilot' | 'pattern' | 'artistic';

/** Tracks quantitative usage across main feature areas */
export interface UsageProfile {
  lessonsCreated: number;
  assessmentsGenerated: number;
  materialsUploaded: number;
  analyticsViews: number;
  copilotRequests: number;
  udaCreated: number;
  exportsGenerated: number;
  driveConnected: boolean;
  // — v2: personal mode & integrations (from new CognitionBus events) —
  /** Distinct feature areas visited for the first time (feature.discovered) */
  featuresDiscovered: number;
  /** External book/publisher services linked (book.account.linked) */
  bookServicesLinked: number;
  /** External services connected — LMS, registro, PA portals (external.service.connected) */
  externalServicesConnected: number;
  /** True when teacher is operating without a class (session.mode = 'personal') */
  isPersonalMode: boolean;
  /** True after workspace.configured fires (initial setup completed) */
  workspaceConfigured: boolean;
}

/** Inferred pedagogical preferences */
export interface PedagogicalProfile {
  assessmentPreference: 'quiz' | 'open' | 'collaborative' | 'mixed';
  feedbackStyle: 'brief' | 'detailed';
  averageDifficultyLevel: 1 | 2 | 3;
}

/** Detected intra-session workflow sequences (3h window, max 10 events) */
export interface WorkflowPattern {
  patternId: string;
  sequence: string[];
  occurrences: number;
  lastDetected: number; // timestamp ms
}

/** Tracks Copilot/AI interaction style */
export interface CopilotInteractionProfile {
  suggestionsAccepted: number;
  suggestionsRejected: number;
  manualPrompts: number;
  automationEnabled: boolean;
}

/** Proactive suggestion shown to user */
export interface CopilotSuggestion {
  id: string;
  type: 'automation' | 'feature' | 'workflow';
  message: string;
  targetView?: string;
  icon: string;
  /**
   * Chiave azione stabile — richiesta dal DecisionContract per tracciabilità,
   * deduplicazione e feedback loop.
   * Formato: '<dominio>.<azione>' es. 'uda.planning', 'drive.backup'
   */
  actionKey: string;
  /**
   * Spiegazione leggibile del perché il suggerimento viene proposto.
   * Il docente deve sempre poter capire "perché me lo stai mostrando?"
   */
  reason: string;
  /**
   * Priorità numerica (più alto = più importante).
   * Usato per ordinamento deterministico nel SuggestionEngine.
   */
  priority: number;
  /**
   * Sorgente del suggerimento (copilot | pattern | artistic).
   */
  source: SuggestionSource;
  /**
   * Timestamp dell'ultima volta che è stato mostrato (per cooldown).
   */
  lastShownAt?: number;
}

/** Root Teacher Cognitive Model state (persisted at 'docentedoc-tcm-v1') */
export interface TeacherModel {
  /** Internal capability level 1–4 */
  capabilityLevel: CapabilityLevel;
  /** Confidence of the current classification (0.0–1.0) */
  confidenceScore: number;
  /** True when a level-up has occurred and celebration hasn't been shown yet */
  levelUpPending: boolean;
  /** Hint IDs the user has explicitly dismissed */
  dismissedHints: string[];
  /** Timestamp of last model update */
  lastUpdated: number;
  usageProfile: UsageProfile;
  pedagogicalProfile: PedagogicalProfile;
  workflowPatterns: WorkflowPattern[];
  copilotInteractionProfile: CopilotInteractionProfile;

  // ── v3: Memoria decisionale (feedback loop) ──────────────────────────────

  /**
   * actionKey delle azioni eseguite dall'utente.
   * Usato per deduplicazione: non suggerire azioni già completate.
   */
  completedActions: string[];

  /**
   * Mappa actionKey → numero di volte che il suggerimento è stato ignorato.
   * Usato per deprioritizzare suggerimenti non graditi.
   */
  ignoredSuggestions: Record<string, number>;

  /**
   * Preferenze esplicite del docente emerse dall'interazione.
   */
  preferences: TeacherPreferences;

  /**
   * Cooldown per suggerimento: actionKey → timestamp dell'ultima volta mostrato.
   * Gestito dal SuggestionEngine per evitare spam cognitivo.
   */
  suggestionCooldown: Record<string, number>;
}

/** Preferenze del docente emerse dall'interazione con il sistema */
export interface TeacherPreferences {
  /** Livello di verbosità preferito per i suggerimenti */
  suggestionVerbosity: 'concise' | 'detailed';
  /** Accetta suggerimenti artistici/creativi */
  acceptsArtisticSuggestions: boolean;
  /** Accetta suggerimenti sulla gestione della classe (default: true) */
  acceptsClassManagementSuggestions?: boolean;
  /** Accetta suggerimenti sulla progettazione didattica (default: true) */
  acceptsLessonDesignSuggestions?: boolean;
  /** Accetta suggerimenti sull'integrazione libri (default: true) */
  acceptsBookIntegrationSuggestions?: boolean;
  /** Orario preferito per i reminder (non implementato, riservato per futuro) */
  preferredReminderTime?: string;
}
