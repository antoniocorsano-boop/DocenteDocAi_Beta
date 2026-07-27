// ============================================================================
// STUDENT DOMAIN — student records, evaluations, grades, inclusion plans
// ============================================================================

export interface StudentHistoryRecord {
    year: string;
    classe: string;
    averageGrade: string;
    absencesPercentage: number;
    finalOutcome?: 'Promosso' | 'Bocciato' | 'Sospeso' | 'Ritirato' | 'Trasferito' | 'Diplomato';
    competencySummary?: { name: string; level: string }[];
}

export interface Studente {
    id: string;
    nome: string;
    cognome: string;
    classe: string;
    dataNascita?: string;
    isArchived?: boolean;
    archiveYear?: string;
    history?: StudentHistoryRecord[];
    hasBES?: boolean;
    hasDSA?: boolean;
    has104?: boolean;
}

export interface Valutazione {
    id: string;
    studenteId: string;
    materia: string;
    data: string;
    tipo: 'Scritto' | 'Orale' | 'Pratico' | 'Test' | 'Verifica' | 'Ricevimento';
    voto: string;
    argomento?: string;
    note?: string;
    /** FK to Lezione.id — set when evaluation is entered during a classroom session */
    lezioneId?: string;
}

export type HomeworkStatus = 'completed' | 'partial' | 'missing' | 'default';

export interface HomeworkSubmission {
    id: string;
    studentId: string;
    lessonId: string;
    date: string;
    content?: string;
    file?: { name: string; data: string; mimeType: string };
    status: 'pending' | 'graded';
    teacherFeedback?: string;
}

export interface ParticipationEntry {
    type: 'positive' | 'question' | 'collaboration' | 'distraction';
    timestamp: number;
}

export interface ParticipationBadge {
    id: string;
    label: string;
    icon: string;
    color: string;
}

export interface ObservationEntry {
    autonomy: number;
    collaboration: number;
    responsibility: number;
    note: string;
}

export interface EPortfolioEntry {
    id: string;
    studentId: string;
    title: string;
    date: string;
    description: string;
    category: 'capolavoro' | 'riflessione' | 'certificazione' | 'altro';
    fileUrl?: string;
    tags: string[];
}

export interface OrientamentoActivity {
    id: string;
    title: string;
    date: string;
    durationHours: number;
    description: string;
    type: 'didattica' | 'extra-curriculare' | 'PCTO' | 'esperienziale' | 'altro';
    studentIds: string[];
    classes: string[];
    competenciesAddressed: string[];
}

export interface StudentOrientamentoState {
    studentId: string;
    hasCapolavoro: boolean;
    hasAutovalutazione: boolean;
    totalHours: number;
    activities: string[];
    ePortfolio: string[];
    selfReflection: string;
    tutorNotes: string;
}

export interface PianoInclusione {
    id: string;
    puntiDiForza: string;
    areeDiIntervento: string;
    misureCompensative: string;
    misureDispensative: string;
    criteriValutazionePersonalizzati: string;
    obiettiviPerMateria?: Record<string, string>;
}

export type PeriodoValutazione = 'primo-quadrimestre' | 'secondo-quadrimestre';

export interface GiudizioPeriodico {
    studenteId: string;
    periodo: PeriodoValutazione;
    annoScolastico: string;
    giudizio: string;
    comportamento: string;
    educazioneCivica: string;
    note: string;
    votoDisciplina: string;
    votoAmmissione: string;
    votoUscita: string;
}

export interface Prova {
    id: string;
    titolo: string;
    data: string;
    materia: string;
    tipo: Valutazione['tipo'];
    voti: Record<string, Valutazione>;
}

export interface RegisterEntry {
    id: string;
    date: string;
    slotKey: string;
    lessonId: string;
    classe: string;
    materia: string;
    studentAttendance: Record<string, 'presente' | 'assente' | 'ritardo'>;
    status: 'draft' | 'finalized';
    homeworkCheck?: Record<string, HomeworkStatus>;
    participation?: Record<string, ParticipationEntry[]>;
    quickNotes?: Record<string, string>;
    observations?: Record<string, ObservationEntry>;
    checkedObjectives?: Record<number, boolean>;
    notes?: string;
}
