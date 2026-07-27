/**
 * useFundingStore.ts — Zustand store per finanziamenti e bandi educativi
 *
 * Persistente su localStorage (chiave: 'docentedoc-funding').
 * Solo submissions e compliance sono persistiti (il report si ricalcola on-demand).
 *
 * API pubblica:
 *   actions.compute()         — calcola FundingReport da contesto classe
 *   actions.clear()           — resetta report e stato transitorio
 *   actions.trackSubmission() — crea/aggiorna una candidatura
 *   actions.readyToSubmit()   — verifica compliance completa
 *   actions.updateCompliance()— aggiorna singoli flag compliance
 *   actions.refreshBandi()    — ricarica bandi da mock API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FundingReport,
  ProjectType,
  CandidaturaSubmission,
  SubmissionStatus,
  ComplianceCheck,
  UserFundingProfile,
  ApprovazioneSimulation,
} from '../types/funding.types';
import {
  computeFundingReport,
  simulateApprovazione,
  refreshBandiFromAPI,
  BANDI_CATALOGO,
} from '../ai/funding/FundingAI';
import type { Lezione, Studente } from '../types';

// ── State ─────────────────────────────────────────────────────────────────────

interface FundingState {
  /** Report calcolato (null fino al primo compute) */
  report: FundingReport | null;
  /** Storico candidature per bando */
  submissions: CandidaturaSubmission[];
  /** Stato compliance normativa utente */
  compliance: ComplianceCheck;
  /** Simulazioni approvazione per bando */
  simulations: Record<string, ApprovazioneSimulation>;
  /** Loading state per operazioni async */
  isLoading: boolean;
  /** Ultimo errore */
  error: string | null;
  /** Timestamp ultimo aggiornamento bandi */
  lastBandiUpdate: string | null;
}

// ── Actions ───────────────────────────────────────────────────────────────────

interface FundingActions {
  /**
   * Calcola il FundingReport combinando contesto classe e compliance.
   * Aggiorna lo store con il nuovo report.
   */
  compute: (
    projectType: ProjectType,
    userProfile: UserFundingProfile,
    lessons: Lezione[],
    students: Studente[]
  ) => Promise<void>;

  /** Svuota report, simulazioni ed errori (mantiene submissions e compliance) */
  clear: () => void;

  /**
   * Crea o aggiorna una candidatura per un bando.
   * Se la submission esiste già per bandoId, la aggiorna.
   */
  trackSubmission: (
    bandoId: string,
    status: SubmissionStatus,
    documents: string[],
    note?: string
  ) => void;

  /**
   * Restituisce true se tutti i flag compliance sono attivi.
   * Pre-requisito per marcare una candidatura come "inviato".
   */
  readyToSubmit: () => boolean;

  /** Aggiorna parzialmente i flag compliance */
  updateCompliance: (check: Partial<ComplianceCheck>) => void;

  /** Simula la probabilità di approvazione per un bando specifico */
  simulateBando: (
    bandoId: string,
    lessonCount: number,
    studentCount: number,
    aiMaturita: 'bassa' | 'media' | 'alta'
  ) => ApprovazioneSimulation | null;

  /** Aggiorna il catalogo bandi da mock API ministeriale */
  refreshBandi: () => Promise<void>;

  /** Aggiunge bozza testuale a una candidatura esistente */
  setBozzaTestuale: (bandoId: string, bozza: string) => void;
}

export type FundingStore = FundingState & { actions: FundingActions };

// ── Valori iniziali ───────────────────────────────────────────────────────────

const INITIAL_COMPLIANCE: ComplianceCheck = {
  gdpr: false,
  spid: false,
  sla: false,
  dpa: false,
};

const INITIAL_STATE: FundingState = {
  report: null,
  submissions: [],
  compliance: INITIAL_COMPLIANCE,
  simulations: {},
  isLoading: false,
  error: null,
  lastBandiUpdate: null,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useFundingStore = create<FundingStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      actions: {
        compute: async (projectType, userProfile, lessons, students) => {
          set({ isLoading: true, error: null });
          try {
            // Arricchisce il profilo con i flag compliance dallo store
            const storeCompliance = get().compliance;
            const enrichedProfile: UserFundingProfile = {
              ...userProfile,
              hasGdprRegistry: userProfile.hasGdprRegistry ?? storeCompliance.gdpr,
              hasSpid: userProfile.hasSpid ?? storeCompliance.spid,
              hasDpa: userProfile.hasDpa ?? storeCompliance.dpa,
              hasSla: userProfile.hasSla ?? storeCompliance.sla,
            };
            const report = computeFundingReport(projectType, enrichedProfile, lessons, students);
            set({ report, isLoading: false });
          } catch (e) {
            const error = e instanceof Error ? e.message : 'Errore nel calcolo dei finanziamenti';
            set({ isLoading: false, error });
          }
        },

        clear: () =>
          set({
            report: null,
            simulations: {},
            error: null,
            isLoading: false,
          }),

        trackSubmission: (bandoId, status, documents, note) => {
          set((state) => {
            const existingIdx = state.submissions.findIndex((s) => s.bandoId === bandoId);
            const updated: CandidaturaSubmission = {
              bandoId,
              status,
              documents,
              note,
              dataSottomissione:
                status === 'inviato' ? new Date().toISOString() : state.submissions[existingIdx]?.dataSottomissione,
              probabilitaApprovazione: state.submissions[existingIdx]?.probabilitaApprovazione,
              bozzaTestuale: state.submissions[existingIdx]?.bozzaTestuale,
            };
            const submissions =
              existingIdx >= 0
                ? state.submissions.map((s, i) => (i === existingIdx ? updated : s))
                : [...state.submissions, updated];
            return { submissions };
          });
        },

        readyToSubmit: () => {
          const { compliance } = get();
          return compliance.gdpr && compliance.spid && compliance.sla && compliance.dpa;
        },

        updateCompliance: (check) => {
          set((state) => ({ compliance: { ...state.compliance, ...check } }));
        },

        simulateBando: (bandoId, lessonCount, studentCount, aiMaturita) => {
          const { compliance } = get();
          const bando = BANDI_CATALOGO.find((b) => b.id === bandoId);
          if (!bando) return null;

          const sim = simulateApprovazione(bando, compliance, lessonCount, studentCount, aiMaturita);

          set((state) => ({
            simulations: { ...state.simulations, [bandoId]: sim },
            submissions: state.submissions.map((s) =>
              s.bandoId === bandoId ? { ...s, probabilitaApprovazione: sim.probabilita } : s
            ),
          }));

          return sim;
        },

        refreshBandi: async () => {
          set({ isLoading: true });
          try {
            await refreshBandiFromAPI();
            set({ isLoading: false, lastBandiUpdate: new Date().toISOString() });
          } catch {
            set({ isLoading: false, error: 'Impossibile aggiornare il catalogo bandi.' });
          }
        },

        setBozzaTestuale: (bandoId, bozza) => {
          set((state) => ({
            submissions: state.submissions.map((s) =>
              s.bandoId === bandoId ? { ...s, bozzaTestuale: bozza } : s
            ),
          }));
        },
      },
    }),
    {
      name: 'docentedoc-funding',
      // Persiste solo submissions e compliance; report e simulations si rigenerano on-demand
      partialize: (state) => ({
        submissions: state.submissions,
        compliance: state.compliance,
        lastBandiUpdate: state.lastBandiUpdate,
      }),
    }
  )
);
