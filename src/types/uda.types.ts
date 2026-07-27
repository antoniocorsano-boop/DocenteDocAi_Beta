// ============================================================================
// UDA DOMAIN — lessons, slots, UDA cards, competencies, rubriche, timetable
// ============================================================================

export interface Slot {
    giorno: string;
    ora: string;
    classe?: string;
    materia?: string;
    lezioneId?: string;
}

export interface MaterialeDidattico {
    id: string;
    type: 'kb' | 'file' | 'link' | 'ai_deliverable';
    kbId?: string;
    fileName?: string;
    file?: { name: string; content: string; mimeType: string };
    url?: string;
    label?: string;
}

export interface Lezione {
    id: string;
    classe: string;
    materia: string;
    contenuto: string;
    svolta: boolean;
    data?: string;
    tipoLezione?: 'Teoria' | 'Disegno' | 'Laboratorio' | 'Test' | 'Verifica' | 'Disposizione' | 'Ricevimento';
    unitaDiApprendimento?: string;
    /** FK to Uda.id — preferred over the string unitaDiApprendimento */
    udaId?: string;
    nota?: string;
    obiettivi?: string;
    contesto?: string;
    compiti?: string;
    adattamenti?: string;
    materialiDidattici?: MaterialeDidattico[];
    externalLink?: string;
}

export interface Uda {
    id: string;
    title: string;
    classe: string;
    materia: string;
    introduction: string;
    finalProduct: string;
    competencyIds: string[];
    phases: { id: string; title: string; description: string; activities: string; duration: string }[];
    evaluation: string;
    tools: string;
    startDate?: string;
    endDate?: string;
    linkedEventId?: string;
    externalLink?: string;

    // Properties for GanttBar visualization (now required)
    startPos: number;
    width: number;
    color: string;
    borderColor: string;
    textColor: string;
}

export interface Indicatore {
    livelloId: string;
    descrizione: string;
    nota?: string;
}

export interface Criterio {
    competenzaId: string;
    indicatori: Indicatore[];
}

export interface Rubrica {
    id: string;
    titolo: string;
    criteri: Criterio[];
}

export interface Livello {
    id: string;
    nome: string;
    voto: string;
    punteggio: string;
    descrizione: string;
}

export interface Competenza {
    id: string;
    codice: string;
    nome: string;
    framework?: string;
    livelli: Livello[];
    disciplines?: string[];
}

export interface ValutazioneCompetenza {
    id: string;
    studenteId: string;
    competenzaId: string;
    livelloId: string;
    materia: string;
    data: string;
    provaId?: string;
    nota?: string;
    lezioneId?: string;
}

export interface TeachingAssignment {
    id: string;
    classId: string;
    subjectId: string;
    color: string;
    hoursPerWeek: number;
}

export interface CurriculumObjective {
    id: string;
    text: string;
    type: 'knowledge' | 'skill';
}

export interface CurriculumNucleo {
    id: string;
    title: string;
    objectives: CurriculumObjective[];
}

export interface CurriculumSubject {
    id: string;
    subject: string;
    gradeLevel: string;
    nuclei: CurriculumNucleo[];
    lastUpdated: string;
}

export interface TimetableSettings {
    timeSlots: string[];
    defaultView: string;
    schoolType: string;
    livelli: string[];
    sezioni: string[];
    classi: string[];
    disciplines: string[];
    teachingAssignments: TeachingAssignment[];
    competenze: Competenza[];
    nomeInsegnante: string;
    cognomeInsegnante?: string;
    email?: string;
    nomeIstituto: string;
    cittaIstituto: string;
    anniScolastici: string[];
    annoScolasticoCorrente: string;
    activityStartDate: string;
    activityEndDate: string;
    notificationSettings: {
        enabled: boolean;
        reminders: string[];
        desktopNotifications: boolean;
    };
    showGuidanceTips: boolean;
    visualTheme: string;
    uiMode: 'classic' | 'flow';
    visualPreferences: {
        font: string;
        shape: string;
    };
    backupFolderId?: string;
    backupFolderName?: string;
    googleClientId?: string;
    googleApiKey?: string;
    autoSyncEnabled: boolean;
    autoSyncInterval: number;
    securityPin: string;
    /** Numero di ore di lezione giornaliere (default 6) */
    oreGiornaliere?: number;
    /** Ora di inizio della prima lezione (formato HH:MM, default '08:00') */
    orarioInizio?: string;
    /** Flag persistito: true dopo che l'utente ha completato o saltato l'onboarding */
    onboarded?: boolean;
}
