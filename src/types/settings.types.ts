/**
 * settings.types.ts — Tipi per il Settings Menu intelligente Orbit Jarvis.
 *
 * Modulo dominio: configurazione, preset, hint proattivi, skill settings.
 * Import sempre mediante barrel: `import { SettingsHint } from '@/types'`
 */

// ─── SettingsOption ───────────────────────────────────────────────────────────

/** Singola opzione configurabile all'interno di una skill o pannello. */
export interface SettingsOption {
  id:           string;
  label:        string;
  description?: string;
  type:         'boolean' | 'string' | 'number' | 'select';
  value:        boolean | string | number;
  options?:     Array<{ value: string | number; label: string }>;
  /** true → Jarvis mostra un badge "Consigliato" su questa opzione */
  recommended?: boolean;
}

// ─── SkillSettings ────────────────────────────────────────────────────────────

/**
 * Impostazioni configurabili esportate da una skill registrata.
 * Ogni skill in skillRegistry può dichiarare il proprio set di opzioni.
 */
export interface SkillSettings {
  /** ctaType della skill (chiave univoca in skillRegistry) */
  skillId:     string;
  ctaType:     string;
  label:       string;
  domain:      string;
  enabled:     boolean;
  options:     SettingsOption[];
}

// ─── SettingsCategory ─────────────────────────────────────────────────────────

/** Categoria del Settings Hub con metadata per sidebar e badge. */
export interface SettingsCategory {
  id:           string;
  label:        string;
  /** Material Symbols icon identifier */
  icon:         string;
  /** Numero di hint/suggerimenti attivi per questa categoria */
  badgeCount?:  number;
  /** Hint breve mostrato in cima al pannello categoria */
  hint?:        string;
  /** Scorciatoia tastiera (es. 'Alt+1') */
  shortcut?:    string;
}

// ─── SettingsHint ─────────────────────────────────────────────────────────────

/** Suggerimento proattivo generato da Jarvis in base al contesto. */
export interface SettingsHint {
  id:         string;
  categoryId: string;
  /** Messaggio breve leggibile mostrato nel banner Jarvis */
  message:    string;
  /** Priorità per ordinamento: 1 = alta, 3 = bassa */
  priority:   1 | 2 | 3;
  /** Il docente ha congedato questo hint */
  dismissed?: boolean;
  /** Categoria semantica del contesto che ha generato l'hint */
  source:     'behavior' | 'schedule' | 'skill' | 'device' | 'time';
}

// ─── SettingsPreset ───────────────────────────────────────────────────────────

/** Preset completo — applicato via useJarvisSettings.applyPreset() */
export interface SettingsPreset {
  id:          string;
  label:       string;
  description: string;
  /** Material Symbols icon identifier */
  icon:        string;
  /** Contesti in cui Jarvis suggerisce proattivamente questo preset */
  suggestedIn: Array<'morning' | 'lesson' | 'admin' | 'exam' | 'compliance'>;
}
