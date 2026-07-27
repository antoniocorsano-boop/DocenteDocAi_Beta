import { create } from 'zustand';
import {
    Studente, PianoInclusione, Valutazione, ValutazioneCompetenza,
    OrientamentoActivity, EPortfolioEntry, StudentOrientamentoState
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

// Student State interface - defines the shape of the store state
export interface StudentState {
    students: Studente[];
    pianiInclusione: Record<string, PianoInclusione>;
    evaluations: Valutazione[];
    competencyEvals: ValutazioneCompetenza[];
    studentProfileContext: Studente | null;
    selectedClassForDashboard: string | null;
    orientamentoActivities: OrientamentoActivity[];
    ePortfolioEntries: EPortfolioEntry[];
    studentOrientamentoStates: Record<string, StudentOrientamentoState>;
}

// Student Actions interface - defines all available actions
export interface StudentActions {
    setStudents: (input: Studente[] | ((prev: Studente[]) => Studente[])) => void;
    setPianiInclusione: (input: Record<string, PianoInclusione> | ((prev: Record<string, PianoInclusione>) => Record<string, PianoInclusione>)) => void;
    setEvaluations: (input: Valutazione[] | ((prev: Valutazione[]) => Valutazione[])) => void;
    setCompetencyEvals: (input: ValutazioneCompetenza[] | ((prev: ValutazioneCompetenza[]) => ValutazioneCompetenza[])) => void;
    setStudentProfileContext: (student: Studente | null) => void;
    setSelectedClassForDashboard: (className: string | null) => void;
    setOrientamentoActivities: (input: OrientamentoActivity[] | ((prev: OrientamentoActivity[]) => OrientamentoActivity[])) => void;
    setEPortfolioEntries: (input: EPortfolioEntry[] | ((prev: EPortfolioEntry[]) => EPortfolioEntry[])) => void;
    setStudentOrientamentoStates: (input: Record<string, StudentOrientamentoState> | ((prev: Record<string, StudentOrientamentoState>) => Record<string, StudentOrientamentoState>)) => void;

    // Helper Actions
    addEvaluation: (evaluation: Omit<Valutazione, 'id'>) => void;
    updateEvaluation: (id: string, updates: Partial<Valutazione>) => void;
    deleteEvaluation: (id: string) => void;

    // Student Actions
    saveStudent: (student: Studente) => void;
    deleteStudent: (id: string) => void;
    importStudents: (newStudents: Studente[]) => void;
    importEvaluations: (newEvaluations: Valutazione[]) => void;

    // Inclusion Actions
    savePianoInclusione: (piano: PianoInclusione) => void;
    deletePianoInclusione: (id: string) => void;

    loadFromBackup: (data: Partial<StudentState>) => void;
    resetStudentData: () => void;
}

// Complete store type - combines state and actions
export type StudentStore = StudentState & { actions: StudentActions };

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

// Create the Zustand store with proper typing
export const useStudentStore = create<StudentStore>((set) => ({
    students: [],
    pianiInclusione: {},
    evaluations: [],
    competencyEvals: [],
    studentProfileContext: null,
    selectedClassForDashboard: null,
    orientamentoActivities: [],
    ePortfolioEntries: [],
    studentOrientamentoStates: {},
    actions: {
        setStudents: (input) => set((state) => ({ 
            students: typeof input === 'function' ? input(state.students) : input 
        })),
        setPianiInclusione: (input) => set((state) => ({ 
            pianiInclusione: typeof input === 'function' ? input(state.pianiInclusione) : input 
        })),
        setEvaluations: (input) => set((state) => ({ 
            evaluations: typeof input === 'function' ? input(state.evaluations) : input 
        })),
        setCompetencyEvals: (input) => set((state) => ({ 
            competencyEvals: typeof input === 'function' ? input(state.competencyEvals) : input 
        })),
        setStudentProfileContext: (student) => set({ studentProfileContext: student }),
        setSelectedClassForDashboard: (className) => set({ selectedClassForDashboard: className }),
        setOrientamentoActivities: (input) => set((state) => ({ 
            orientamentoActivities: typeof input === 'function' ? input(state.orientamentoActivities) : input 
        })),
        setEPortfolioEntries: (input) => set((state) => ({ 
            ePortfolioEntries: typeof input === 'function' ? input(state.ePortfolioEntries) : input 
        })),
        setStudentOrientamentoStates: (input) => set((state) => ({ 
            studentOrientamentoStates: typeof input === 'function' ? input(state.studentOrientamentoStates) : input 
        })),
        
        addEvaluation: (evaluation) => set((state) => ({
            evaluations: [...state.evaluations, { ...evaluation, id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }]
        })),
        updateEvaluation: (id, updates) => set((state) => ({
            evaluations: state.evaluations.map(e => e.id === id ? { ...e, ...updates } : e)
        })),
        deleteEvaluation: (id) => set((state) => ({
            evaluations: state.evaluations.filter(e => e.id !== id)
        })),

        saveStudent: (student) => set((state) => {
            const exists = state.students.find(s => s.id === student.id);
            if (exists) {
                return { students: state.students.map(s => s.id === student.id ? student : s) };
            }
            return { students: [...state.students, student] };
        }),
        deleteStudent: (id) => set((state) => ({
            students: state.students.filter(s => s.id !== id)
        })),
        importStudents: (newStudents) => set((state) => {
            const existingIds = new Set(state.students.map(s => s.id));
            const uniqueNewStudents = newStudents.filter(s => !existingIds.has(s.id));
            return { students: [...state.students, ...uniqueNewStudents] };
        }),
        importEvaluations: (newEvaluations) => set((state) => ({
            evaluations: [...state.evaluations, ...newEvaluations]
        })),

        savePianoInclusione: (piano) => set((state) => ({
            pianiInclusione: { ...state.pianiInclusione, [piano.id]: piano }
        })),
        deletePianoInclusione: (id) => set((state) => {
            const newPiani = { ...state.pianiInclusione };
            delete newPiani[id];
            return { pianiInclusione: newPiani };
        }),

        loadFromBackup: (data) => set((state) => ({
            ...state,
            ...data
        })),
        resetStudentData: () => set({
            students: [],
            pianiInclusione: {},
            evaluations: [],
            competencyEvals: [],
            studentProfileContext: null,
            selectedClassForDashboard: null,
            orientamentoActivities: [],
            ePortfolioEntries: [],
            studentOrientamentoStates: {}
        })
    }
}));

