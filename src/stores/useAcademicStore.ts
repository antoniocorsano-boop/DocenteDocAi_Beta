import { create } from 'zustand';
import {
    Lezione, Slot, Uda, EventoCalendario, Rubrica, CurriculumSubject,
    HomeworkSubmission, RegisterEntry, GiudizioPeriodico, Report
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

// Academic State interface - defines the shape of the store state
export interface AcademicState {
    lessons: Record<string, Lezione>;
    slots: Record<string, Slot>;
    uda: Uda[];
    eventi: EventoCalendario[];
    rubriche: Rubrica[];
    curricula: CurriculumSubject[];
    submissions: HomeworkSubmission[];
    draftRegister: Record<string, RegisterEntry>;
    finalizedRegister: RegisterEntry[];
    giudizi: Record<string, GiudizioPeriodico>;
    reportistica: Report[];
}

// Academic Actions interface - defines all available actions
export interface AcademicActions {
    setLessons: (input: Record<string, Lezione> | ((prev: Record<string, Lezione>) => Record<string, Lezione>)) => void;
    setSlots: (input: Record<string, Slot> | ((prev: Record<string, Slot>) => Record<string, Slot>)) => void;
    setUda: (input: Uda[] | ((prev: Uda[]) => Uda[])) => void;
    setEventi: (input: EventoCalendario[] | ((prev: EventoCalendario[]) => EventoCalendario[])) => void;
    setRubriche: (input: Rubrica[] | ((prev: Rubrica[]) => Rubrica[])) => void;
    setCurricula: (input: CurriculumSubject[] | ((prev: CurriculumSubject[]) => CurriculumSubject[])) => void;
    setSubmissions: (input: HomeworkSubmission[] | ((prev: HomeworkSubmission[]) => HomeworkSubmission[])) => void;
    setDraftRegister: (input: Record<string, RegisterEntry> | ((prev: Record<string, RegisterEntry>) => Record<string, RegisterEntry>)) => void;
    setFinalizedRegister: (input: RegisterEntry[] | ((prev: RegisterEntry[]) => RegisterEntry[])) => void;
    setGiudizi: (input: Record<string, GiudizioPeriodico> | ((prev: Record<string, GiudizioPeriodico>) => Record<string, GiudizioPeriodico>)) => void;
    setReportistica: (input: Report[] | ((prev: Report[]) => Report[])) => void;

    // Helper Actions
    saveRubrica: (rubrica: Rubrica) => void;
    deleteRubrica: (id: string) => void;
    saveGiudizio: (giudizio: GiudizioPeriodico) => void;

    loadFromBackup: (data: Partial<AcademicState>) => void;
    resetAcademicData: () => void;
}

// Complete store type - combines state and actions
export type AcademicStore = AcademicState & { actions: AcademicActions };

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

// Create the Zustand store with proper typing
export const useAcademicStore = create<AcademicStore>((set) => ({
    lessons: {},
    slots: {},
    uda: [],
    eventi: [],
    rubriche: [],
    curricula: [],
    submissions: [],
    draftRegister: {},
    finalizedRegister: [],
    giudizi: {},
    reportistica: [],
    actions: {
        setLessons: (input) => set((state) => ({ 
            lessons: typeof input === 'function' ? input(state.lessons) : input 
        })),
        setSlots: (input) => set((state) => ({ 
            slots: typeof input === 'function' ? input(state.slots) : input 
        })),
        setUda: (input) => set((state) => ({ 
            uda: typeof input === 'function' ? input(state.uda) : input 
        })),
        setEventi: (input) => set((state) => ({ 
            eventi: typeof input === 'function' ? input(state.eventi) : input 
        })),
        setRubriche: (input) => set((state) => ({ 
            rubriche: typeof input === 'function' ? input(state.rubriche) : input 
        })),
        setCurricula: (input) => set((state) => ({ 
            curricula: typeof input === 'function' ? input(state.curricula) : input 
        })),
        setSubmissions: (input) => set((state) => ({ 
            submissions: typeof input === 'function' ? input(state.submissions) : input 
        })),
        setDraftRegister: (input) => set((state) => ({ 
            draftRegister: typeof input === 'function' ? input(state.draftRegister) : input 
        })),
        setFinalizedRegister: (input) => set((state) => ({ 
            finalizedRegister: typeof input === 'function' ? input(state.finalizedRegister) : input 
        })),
        setGiudizi: (input) => set((state) => ({ 
            giudizi: typeof input === 'function' ? input(state.giudizi) : input 
        })),
        setReportistica: (input) => set((state) => ({ 
            reportistica: typeof input === 'function' ? input(state.reportistica) : input 
        })),

        saveRubrica: (rubrica) => set((state) => {
            const otherRubrics = state.rubriche.filter(r => r.id !== rubrica.id);
            return { rubriche: [...otherRubrics, rubrica] };
        }),
        deleteRubrica: (id: string) => set((state) => ({
            rubriche: state.rubriche.filter(r => r.id !== id)
        })),
        saveGiudizio: (giudizio) => set((state) => ({
            giudizi: { ...state.giudizi, [`${giudizio.studenteId}-${giudizio.periodo}-${giudizio.annoScolastico}`]: giudizio }
        })),

        loadFromBackup: (data) => set((state) => ({
            ...state,
            ...data
        })),
        resetAcademicData: () => set({
            lessons: {},
            slots: {},
            uda: [],
            eventi: [],
            rubriche: [],
            curricula: [],
            submissions: [],
            draftRegister: {},
            finalizedRegister: [],
            giudizi: {},
            reportistica: []
        })
    }
}));

