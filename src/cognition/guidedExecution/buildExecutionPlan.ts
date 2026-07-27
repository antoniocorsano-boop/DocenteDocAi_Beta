/**
 * buildExecutionPlan.ts — Maps a NextAction into a step-by-step ExecutionPlan.
 *
 * Architecture rule: PURE FUNCTION — no side effects, no store reads.
 * One plan per known action ID; unknown IDs get a single-step generic plan.
 */

import type { NextAction } from '../decisionEngine/types';
import type { ExecutionPlan } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Plan library — one entry per known NextAction.id
// ─────────────────────────────────────────────────────────────────────────────

const PLANS: Record<string, (action: NextAction) => ExecutionPlan> = {

  'da-add-first-student': (action) => ({
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'navigate-aula',
        label: 'Vai alla sezione Aula',
        instruction: 'Tocca "Aula" nel menu principale per aprire il registro della classe.',
        icon: 'school',
        targetView: 'aula',
        targetElementHint: '[aria-label*="Aula"], [data-view="aula"]',
      },
      {
        id: 'open-add-student',
        label: 'Apri "Aggiungi studente"',
        instruction: 'Cerca il pulsante "+" o "Aggiungi studente" e toccalo.',
        icon: 'person_add',
        targetElementHint: '[aria-label*="Aggiungi studente"], button[data-action="add-student"]',
      },
      {
        id: 'fill-student-name',
        label: 'Inserisci nome e cognome',
        instruction: 'Scrivi il nome completo dello studente nel campo di testo.',
        icon: 'badge',
        targetElementHint: 'input[name*="nome"], input[placeholder*="nome"]',
      },
      {
        id: 'confirm-student',
        label: 'Conferma e salva',
        instruction: 'Tocca "Salva" o "Conferma" per aggiungere lo studente alla classe.',
        icon: 'check_circle',
        targetElementHint: 'button[type="submit"], button[aria-label*="Salva"]',
      },
    ],
  }),

  'da-create-lesson': (action) => ({
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'navigate-lesson',
        label: 'Apri "Crea lezione"',
        instruction: 'Vai nella sezione Lezioni e tocca il pulsante per creare una nuova lezione.',
        icon: 'edit_document',
        targetView: 'lesson',
        targetElementHint: 'button[aria-label*="Crea lezione"], [data-action="new-lesson"]',
      },
      {
        id: 'fill-lesson-title',
        label: 'Scrivi il titolo della lezione',
        instruction: 'Inserisci un titolo chiaro che descriva l\'argomento trattato.',
        icon: 'title',
        targetElementHint: 'input[name*="titolo"], input[placeholder*="Titolo"]',
      },
      {
        id: 'select-date',
        label: 'Imposta la data',
        instruction: 'Seleziona la data in cui si è svolta o si svolgerà la lezione.',
        icon: 'calendar_today',
        targetElementHint: 'input[type="date"], [aria-label*="data"]',
      },
      {
        id: 'save-lesson',
        label: 'Salva la lezione',
        instruction: 'Tocca "Salva" per registrare la lezione nel tuo storico.',
        icon: 'save',
        targetElementHint: 'button[type="submit"], button[aria-label*="Salva"]',
      },
    ],
  }),

  'da-create-uda': (action) => ({
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'navigate-uda',
        label: 'Vai alla Pianificazione',
        instruction: "Apri la sezione Pianificazione per creare la tua prima UDA.",
        icon: 'layers',
        targetView: 'uda',
        targetElementHint: '[data-view="uda"], [aria-label*="Pianificazione"]',
      },
      {
        id: 'new-uda',
        label: 'Crea nuova UDA',
        instruction: 'Tocca "+" o "Nuova UDA" per aprire il wizard di creazione.',
        icon: 'add_box',
        targetElementHint: 'button[aria-label*="Nuova UDA"], [data-action="new-uda"]',
      },
      {
        id: 'uda-title',
        label: 'Dai un titolo alla UDA',
        instruction: 'Inserisci il titolo dell\'Unità Didattica Apprendimento.',
        icon: 'title',
        targetElementHint: 'input[name*="titolo"], input[placeholder*="Titolo UDA"]',
      },
      {
        id: 'uda-objectives',
        label: 'Definisci gli obiettivi',
        instruction: 'Scrivi almeno un obiettivo di apprendimento per questa UDA.',
        icon: 'target',
        targetElementHint: 'textarea[name*="obiettivi"], [aria-label*="Obiettivi"]',
      },
      {
        id: 'uda-save',
        label: 'Salva e pubblica',
        instruction: 'Tocca "Salva" per creare la UDA e iniziare ad associare lezioni.',
        icon: 'check_circle',
        targetElementHint: 'button[type="submit"], button[aria-label*="Salva"]',
      },
    ],
  }),

  'da-connect-drive': (action) => ({
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'navigate-settings',
        label: 'Apri le Impostazioni',
        instruction: "Vai nelle Impostazioni per configurare il backup Google Drive.",
        icon: 'settings',
        targetView: 'settings',
        targetElementHint: '[data-view="settings"], [aria-label*="Impostazioni"]',
      },
      {
        id: 'find-drive-section',
        label: 'Trova "Backup Drive"',
        instruction: 'Cerca la sezione Google Drive o Backup nella lista impostazioni.',
        icon: 'folder_open',
        targetElementHint: '[aria-label*="Google Drive"], [data-section="backup"]',
      },
      {
        id: 'connect-drive',
        label: 'Connetti il tuo account Google',
        instruction: 'Tocca "Connetti Google Drive" e autorizza l\'accesso quando richiesto.',
        icon: 'link',
        targetElementHint: 'button[aria-label*="Connetti"], button[aria-label*="Drive"]',
      },
    ],
  }),

  'da-annual-plan': (action) => ({
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'navigate-planning',
        label: 'Vai alla Pianificazione Annuale',
        instruction: 'Apri la sezione Pianificazione per creare il piano dell\'anno scolastico.',
        icon: 'calendar_month',
        targetView: 'planning',
        targetElementHint: '[data-view="planning"], [aria-label*="Piano Annuale"]',
      },
      {
        id: 'new-annual-plan',
        label: 'Crea il piano annuale',
        instruction: 'Tocca "Nuovo Piano" o "Piano Annuale" per avviare la procedura guidata.',
        icon: 'add_box',
        targetElementHint: 'button[aria-label*="Piano annuale"], [data-action="new-annual-plan"]',
      },
      {
        id: 'annual-materie',
        label: 'Seleziona le materie',
        instruction: 'Aggiungi le materie che insegnerai quest\'anno scolastico.',
        icon: 'subject',
        targetElementHint: '[aria-label*="Materie"], [data-section="materie"]',
      },
      {
        id: 'annual-uda',
        label: 'Aggiungi almeno una UDA',
        instruction: 'Associa una UDA al piano annuale per strutturare gli obiettivi.',
        icon: 'layers',
        targetElementHint: 'button[aria-label*="Aggiungi UDA"]',
      },
      {
        id: 'save-annual-plan',
        label: 'Salva il piano',
        instruction: 'Tocca "Salva" o "Pubblica" per completare il piano annuale.',
        icon: 'check_circle',
        targetElementHint: 'button[type="submit"], button[aria-label*="Salva"]',
      },
    ],
  }),

  'da-discover-copilot': (action) => ({
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'open-copilot',
        label: 'Apri il pannello Copilot',
        instruction: 'Vai nella sezione Copilot Docente per esplorare le raccomandazioni AI.',
        icon: 'auto_awesome',
        targetView: 'copilot',
        targetElementHint: '[data-view="copilot"], [aria-label*="Copilot"]',
      },
      {
        id: 'explore-recommendations',
        label: 'Esplora le raccomandazioni',
        instruction: 'Leggi le raccomandazioni AI personalizzate per la tua classe.',
        icon: 'recommend',
        targetElementHint: '[aria-label*="Raccomandazioni"]',
      },
      {
        id: 'try-analysis',
        label: "Prova un'analisi",
        instruction: 'Tocca una raccomandazione per approfondire e capire come si applica.',
        icon: 'analytics',
        targetElementHint: '[data-type="recommendation"], .recommendation-card',
      },
    ],
  }),

  'da-view-analytics': (action) => ({
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'navigate-copilot',
        label: 'Apri il Copilot Docente',
        instruction: 'Vai nella sezione Copilot Docente dove trovi la Dashboard AI.',
        icon: 'auto_awesome',
        targetView: 'copilot',
        targetElementHint: '[data-view="copilot"], [aria-label*="Copilot"]',
      },
      {
        id: 'open-dashboard',
        label: 'Apri la Dashboard AI',
        instruction: 'Seleziona il tab "Dashboard" per visualizzare trend e performance della classe.',
        icon: 'dashboard',
        targetElementHint: '[aria-label*="Dashboard"], [data-tab="dashboard"]',
      },
      {
        id: 'read-insights',
        label: 'Leggi gli insight',
        instruction: 'Scorri i grafici di progressione e identifica eventuali studenti a rischio.',
        icon: 'analytics',
        targetElementHint: '[aria-label*="Insight"], .insight-card',
      },
    ],
  }),

  'da-link-book': (action) => ({
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'navigate-settings',
        label: 'Apri le Impostazioni',
        instruction: 'Vai nelle Impostazioni per collegare il tuo libro di testo adottato.',
        icon: 'settings',
        targetView: 'settings',
        targetElementHint: '[data-view="settings"], [aria-label*="Impostazioni"]',
      },
      {
        id: 'find-book-section',
        label: 'Cerca "Integrazioni libro"',
        instruction: 'Trova la sezione "Libro di testo" o "Integrazioni didattiche" nella lista.',
        icon: 'menu_book',
        targetElementHint: '[aria-label*="Libro"], [data-section="book"]',
      },
      {
        id: 'link-book-service',
        label: 'Collega il servizio',
        instruction: 'Inserisci il codice ISBN o il nome del libro adottato e salva.',
        icon: 'link',
        targetElementHint: 'input[name*="isbn"], button[aria-label*="Collega libro"]',
      },
    ],
  }),

  'da-enable-automation': (action) => ({
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'navigate-copilot',
        label: 'Apri il Copilot Docente',
        instruction: 'Vai nella sezione Copilot Docente per configurare le automazioni AI.',
        icon: 'auto_awesome',
        targetView: 'copilot',
        targetElementHint: '[data-view="copilot"], [aria-label*="Copilot"]',
      },
      {
        id: 'open-spiegabilita',
        label: 'Apri "Spiegabilità & Automazioni"',
        instruction: 'Seleziona il tab "Spiegabilità" che contiene i controlli delle automazioni.',
        icon: 'bolt',
        targetElementHint: '[aria-label*="Spiegabilità"], [data-tab="spiegabilita"]',
      },
      {
        id: 'enable-automation-toggle',
        label: 'Attiva le automazioni',
        instruction: "Attiva l'interruttore \"Suggerimenti automatici\" per ricevere insights proattivi.",
        icon: 'toggle_on',
        targetElementHint: '[aria-label*="Automazioni"], input[type="checkbox"][data-id="automation"]',
      },
      {
        id: 'save-preferences',
        label: 'Salva le preferenze',
        instruction: 'Tocca "Salva" per applicare la configurazione.',
        icon: 'check_circle',
        targetElementHint: 'button[aria-label*="Salva"], button[type="submit"]',
      },
    ],
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic fallback for unknown action IDs
// ─────────────────────────────────────────────────────────────────────────────

function buildGenericPlan(action: NextAction): ExecutionPlan {
  return {
    actionId: action.id,
    actionLabel: action.label,
    steps: [
      {
        id: 'generic-navigate',
        label: action.cta,
        instruction: action.description,
        icon: action.icon,
        targetView: action.targetView,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a step-by-step ExecutionPlan from a NextAction.
 *
 * @param action - The NextAction from the decision engine.
 * @returns An ExecutionPlan with ordered steps.
 */
export function buildExecutionPlan(action: NextAction): ExecutionPlan {
  const factory = PLANS[action.id];
  return factory ? factory(action) : buildGenericPlan(action);
}
