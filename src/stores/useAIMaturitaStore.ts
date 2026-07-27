/**
 * useAIMaturitaStore.ts — Zustand store per il plugin AI Maturità
 *
 * Persistente su localStorage (chiave: 'docentedoc-ai-maturita').
 *
 * Cosa viene persistito:
 *   - sections (score, collapsed, blockers, recommendations)
 *   - interactionMode
 *
 * Cosa NON viene persistito:
 *   - isLoading (stato transitorio)
 *   - error (stato transitorio)
 *   - globalScore (calcolato al runtime da sections)
 *
 * Mock data seed: punteggi realistici fissi che simulano una scuola
 * in fase di preparazione alla PA readiness e PNRR.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  MaturitaState,
  MaturitaStore,
  MaturitaSection,
  InteractionMode,
  SectionId,
} from '../types/aiMaturita.types';

// ── Helper: calcola global score pesato ──────────────────────────────────────

function computeGlobalScore(sections: MaturitaSection[]): number {
  const totalWeight = sections.reduce((acc, s) => acc + s.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = sections.reduce((acc, s) => acc + s.score * s.weight, 0);
  return Math.round(weighted / totalWeight);
}

// ── Mock data seed ────────────────────────────────────────────────────────────

const SEED_SECTIONS: MaturitaSection[] = [
  {
    id: 'pedagogia',
    label: 'Pedagogia AI',
    icon: 'school',
    score: 72,
    weight: 0.25,
    collapsed: false,
    lastUpdated: '2026-03-15T09:00:00.000Z',
    blockers: [
      {
        id: 'ped-001',
        descrizione: 'UDA completa mancante per 2 classi su 4',
        severita: 'media',
        azioneSuggerita: 'Compila le UDA mancanti nel modulo Progettazione Hub',
      },
      {
        id: 'ped-002',
        descrizione: 'Piano formazione docenti AI non allegato',
        severita: 'bassa',
        azioneSuggerita: 'Carica il piano formazione annuale nel modulo Setting',
      },
    ],
    recommendations: [
      'Completa le UDA con obiettivi digitali per tutte le classi',
      'Aggiungi attività di AI-literacy al curriculum',
      'Utilizza almeno 3 strumenti predittivi nelle prossime 4 settimane',
    ],
  },
  {
    id: 'trust',
    label: 'Trust Score',
    icon: 'verified_user',
    score: 65,
    weight: 0.20,
    collapsed: false,
    lastUpdated: '2026-03-15T09:00:00.000Z',
    blockers: [
      {
        id: 'trst-001',
        descrizione: 'Report bias non ancora generato per questa classe',
        severita: 'media',
        azioneSuggerita: 'Genera il report bias dal tab Dev Tools > Bias Report',
      },
      {
        id: 'trst-002',
        descrizione: 'Mancano 3 valutazioni AF per completare il profilo trust',
        severita: 'bassa',
        azioneSuggerita: 'Aggiungi le valutazioni mancanti nel registro',
      },
    ],
    recommendations: [
      'Genera il report di bias prima del prossimo consiglio di classe',
      'Documenta 2+ interventi di recupero per gli studenti a rischio',
      'Attiva la spiegabilità AI per le predizioni agli studenti',
    ],
  },
  {
    id: 'curriculum',
    label: 'Curriculum Coverage',
    icon: 'menu_book',
    score: 80,
    weight: 0.20,
    collapsed: true,
    lastUpdated: '2026-03-15T09:00:00.000Z',
    blockers: [],
    recommendations: [
      'Allinea 2 UDA al framework DigComp 2.2',
      'Aggiungi competenze trasversali alle rubriche esistenti',
    ],
  },
  {
    id: 'gdpr',
    label: 'GDPR Compliance',
    icon: 'lock',
    score: 45,
    weight: 0.15,
    collapsed: false,
    lastUpdated: '2026-03-15T09:00:00.000Z',
    blockers: [
      {
        id: 'gdpr-001',
        descrizione: 'DPA (Data Processing Agreement) con fornitore AI non firmato',
        severita: 'critica',
        azioneSuggerita: 'Contatta l\'ufficio legale per far firmare il DPA al DS entro 30 giorni',
      },
      {
        id: 'gdpr-002',
        descrizione: 'Registro trattamenti dati non aggiornato con attività AI',
        severita: 'critica',
        azioneSuggerita: 'Aggiorna il registro RT includendo l\'uso di DocenteDocAI',
      },
    ],
    recommendations: [
      'Completa il DPA con il fornitore AI — requisito bloccante PNRR',
      'Nomina il DPO o verifica se la nomina è già in essere',
      'Aggiorna l\'informativa privacy agli alunni e famiglie',
    ],
  },
  {
    id: 'accessibilita',
    label: 'Accessibilità',
    icon: 'accessibility_new',
    score: 60,
    weight: 0.10,
    collapsed: true,
    lastUpdated: '2026-03-15T09:00:00.000Z',
    blockers: [
      {
        id: 'acc-001',
        descrizione: 'Dichiarazione accessibilità WCAG 2.1 AA non pubblicata',
        severita: 'media',
        azioneSuggerita: 'Pubblica la dichiarazione di accessibilità sul sito istituzionale',
      },
    ],
    recommendations: [
      'Pubblica la dichiarazione accessibilità sul portale scolastico',
      'Verifica compatibilità screen reader per i materiali AI generati',
    ],
  },
  {
    id: 'pa_readiness',
    label: 'PA Readiness',
    icon: 'account_balance',
    score: 30,
    weight: 0.10,
    collapsed: false,
    lastUpdated: '2026-03-15T09:00:00.000Z',
    blockers: [
      {
        id: 'par-001',
        descrizione: 'SPID referente didattico non configurato nell\'app',
        severita: 'critica',
        azioneSuggerita: 'Configura SPID del docente referente nel pannello Impostazioni',
      },
      {
        id: 'par-002',
        descrizione: 'SLA con fornitore AI non firmato',
        severita: 'critica',
        azioneSuggerita: 'Richiedi al DS di firmare il SLA allegato alla proposta commerciale',
      },
      {
        id: 'par-003',
        descrizione: 'Piano triennale innovazione digitale non allegato',
        severita: 'media',
        azioneSuggerita: 'Allega il PTDI aggiornato nella sezione documentazione',
      },
    ],
    recommendations: [
      'Configura SPID — requisito obbligatorio per bandi MIM e PNRR',
      'Firma il SLA con il fornitore AI entro il prossimo CDA',
      'Prepara il PTDI aggiornato con riferimento all\'uso di AI in classe',
    ],
  },
];

// ── Stato iniziale ────────────────────────────────────────────────────────────

const INITIAL_STATE: Omit<MaturitaState, 'globalScore'> = {
  sections: SEED_SECTIONS,
  interactionMode: 'classica',
  isLoading: false,
  error: null,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAIMaturitaStore = create<MaturitaStore>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      ...INITIAL_STATE,
      globalScore: computeGlobalScore(SEED_SECTIONS),

      // ── Actions ────────────────────────────────────────────────────────────
      actions: {
        setInteractionMode: (mode: InteractionMode) => {
          set({ interactionMode: mode });
        },

        toggleSection: (id: SectionId) => {
          set((state) => ({
            sections: state.sections.map((s) =>
              s.id === id ? { ...s, collapsed: !s.collapsed } : s
            ),
          }));
        },

        recalculate: () => {
          const { sections } = get();
          set({ globalScore: computeGlobalScore(sections) });
        },

        reset: () => {
          set({
            sections: SEED_SECTIONS,
            interactionMode: 'classica',
            globalScore: computeGlobalScore(SEED_SECTIONS),
            isLoading: false,
            error: null,
          });
        },

        hydrate: (sections: MaturitaSection[]) => {
          set({
            sections,
            globalScore: computeGlobalScore(sections),
          });
        },
      },
    }),
    {
      name: 'docentedoc-ai-maturita',
      // Persistiamo solo sections e interactionMode; globalScore e stati transitori esclusi
      partialize: (state) => ({
        sections: state.sections,
        interactionMode: state.interactionMode,
      }),
      // Dopo idratazione, ricalcola globalScore dai sections persistiti
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.globalScore = computeGlobalScore(state.sections);
        }
      },
    }
  )
);

// ── Selectors per uso in componenti ──────────────────────────────────────────

/** Restituisce la sezione per id, o undefined se non trovata */
export const useMaturitaSection = (id: SectionId): MaturitaSection | undefined =>
  useAIMaturitaStore((state) => state.sections.find((s) => s.id === id));

/** Restituisce il globalScore corrente */
export const useGlobalScore = (): number =>
  useAIMaturitaStore((state) => state.globalScore);

/** Restituisce la modalità di interazione corrente */
export const useInteractionMode = (): InteractionMode =>
  useAIMaturitaStore((state) => state.interactionMode);
