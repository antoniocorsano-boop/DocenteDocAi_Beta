/**
 * simulation/types.ts — Tipi pubblici del Simulation Engine.
 */

export type DeviceType = 'mobile' | 'desktop';

/** Tipo di landing che il motore può attivare. */
export type LandingType = 'schedule' | 'class' | 'lesson' | 'settings';

/** Stato di avanzamento della simulazione. */
export type SimStatus = 'idle' | 'running' | 'paused' | 'done';

// ─── LessonEvent ──────────────────────────────────────────────────────────────

/**
 * Un evento nella giornata simulata.
 * time: orario HH:mm
 * skillHint: ctaType della skill da attivare (es. 'START_LESSON')
 */
export interface LessonEvent {
  /** Orario HH:mm */
  time:       string;
  classeId:   string;
  materia:    string;
  /** ctaType della skill più rilevante per questo evento */
  skillHint:  string;
  /** Durata in minuti (default 5) — scala con speedMultiplier */
  duration?:  number;
  /** Etichetta leggibile per la timeline */
  label?:     string;
}

// ─── SimulationOptions ────────────────────────────────────────────────────────

export interface SimulationOptions {
  device:            DeviceType;
  /** 1 = tempo reale, 60 = 1 secondo per minuto (velocità demo default) */
  speedMultiplier?:  number;
  tenantId?:         string;
}

// ─── SimulationMetrics ────────────────────────────────────────────────────────

export interface SimulationMetrics {
  timestamp:       number;
  /** "<time>_<classeId>" */
  eventId:         string;
  /** ctaType della skill attivata (o "none") */
  skillTriggered:  string;
  /** true = Jarvis ha eseguito automaticamente */
  autoAction:      boolean;
  landingShown:    boolean;
  /** Latenza processo evento in ms */
  responseTimeMs:  number;
  /** Densità contenuto 1–10 (basata su lunghezza testo) */
  contentDensity:  number;
}
