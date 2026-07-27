// UI Text Constants - Material Design 3 Microcopy Standards
// Centralizes common UI text for consistency across the application

export const UI_TEXT = {
  // Common Actions
  CANCEL: 'Annulla',
  SAVE: 'Salva',
  ADD: 'Aggiungi',
  EDIT: 'Modifica',
  DELETE: 'Elimina',
  CONFIRM: 'Conferma',
  CREATE: 'Crea',
  UPDATE: 'Aggiorna',
  REMOVE: 'Rimuovi',
  CLOSE: 'Chiudi',

  // Common States
  LOADING: 'Caricamento...',
  SAVING: 'Salvataggio...',
  PROCESSING: 'Elaborazione...',
  SUCCESS: 'Operazione completata',
  ERROR: 'Si è verificato un errore',

  // Form Labels & Placeholders
  NAME: 'Nome',
  TITLE: 'Titolo',
  DESCRIPTION: 'Descrizione',
  EMAIL: 'Email',
  PHONE: 'Telefono',
  ADDRESS: 'Indirizzo',

  // Modal/Dialog Titles
  CONFIRM_DELETE: 'Conferma eliminazione',
  CONFIRM_SAVE: 'Conferma salvataggio',
  UNSAVED_CHANGES: 'Modifiche non salvate',

  // Empty States
  NO_DATA: 'Nessun dato disponibile',
  NO_RESULTS: 'Nessun risultato trovato',
  EMPTY_LIST: 'La lista è vuota',

  // Navigation
  BACK: 'Indietro',
  NEXT: 'Avanti',
  PREVIOUS: 'Precedente',
  CONTINUE: 'Continua',

  // Status Messages
  SAVED_SUCCESSFULLY: 'Salvato con successo',
  DELETED_SUCCESSFULLY: 'Eliminato con successo',
  UPDATED_SUCCESSFULLY: 'Aggiornato con successo',

  // Accessibility
  OPEN_MENU: 'Apri menu',
  CLOSE_MENU: 'Chiudi menu',
  EXPAND_SECTION: 'Espandi sezione',
  COLLAPSE_SECTION: 'Comprimi sezione',
} as const;

// Validation Messages
export const VALIDATION_TEXT = {
  REQUIRED: 'Campo obbligatorio',
  INVALID_EMAIL: 'Email non valida',
  INVALID_PHONE: 'Numero di telefono non valido',
  TOO_SHORT: (min: number) => `Deve contenere almeno ${min} caratteri`,
  TOO_LONG: (max: number) => `Deve contenere al massimo ${max} caratteri`,
  INVALID_FORMAT: 'Formato non valido',
} as const;

// Placeholder Examples
export const PLACEHOLDER_TEXT = {
  EXAMPLE_NAME: 'Es. Mario Rossi',
  EXAMPLE_TITLE: 'Es. Programmazione Annuale',
  EXAMPLE_DESCRIPTION: 'Es. Descrizione dettagliata dell\'attività',
  EXAMPLE_EMAIL: 'Es. mario.rossi@scuola.it',
  SEARCH: 'Cerca...',
  FILTER: 'Filtra...',
} as const;