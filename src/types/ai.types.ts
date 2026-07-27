// ============================================================================
// AI / GENAI DOMAIN — settings, suggestions, blobs, knowledge base, chat, DTOs
// ============================================================================

// Inline literal unions for Lezione.tipoLezione and Valutazione.tipo to keep
// this module standalone without cross-domain imports.
type LezioneTipo = 'Teoria' | 'Disegno' | 'Laboratorio' | 'Test' | 'Verifica' | 'Disposizione' | 'Ricevimento';
type ValutazioneTipo = 'Scritto' | 'Orale' | 'Pratico' | 'Test' | 'Verifica' | 'Ricevimento';

export interface AiSettings {
    model: string;
}

export interface AiSuggestion {
    id: string;
    icon: string;
    title: string;
    description: string;
    action: { type: string; payload?: string | Record<string, unknown> };
}

// FIX: Corrected 'action' type to be always present and structured
export interface SystemSuggestion {
    id: string;
    message: string;
    targetView?: string; // made optional to allow generic suggestions
    actionLabel: string;
    action: { type: string; payload?: Record<string, unknown> | string }; // Changed to required and structured
}

export interface TranscriptEntry {
    speaker: 'user' | 'ai';
    text: string;
    sources?: { title: string; uri: string }[];
    contextLabel?: string;
}

export interface GenAIBlob {
    mimeType: string;
    data: string;
}

export interface KnowledgeBaseEntry {
    id: string;
    fileName: string;
    content: string;
    isGenerated?: boolean;
    category?: string;
    tags?: string[];
    corpusId?: string;
    htmlContent?: string;
    fileContent?: { data: string; mimeType: string };
    driveFileId?: string;
    driveViewLink?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface Corpus {
    id: string;
    displayName: string;
    chatHistory: ChatMessage[];
}

export interface FeedSource {
    id: string;
    pageUrl: string;
    feedUrl: string;
    title: string;
    lastItemGuid?: string;
}

export interface NotebookNote {
    id: string;
    createdAt: string;
    content: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'open_ended';

export interface CircularAnalysisResult {
    summary: string;
    events: { titolo: string; data: string; oraInizio?: string }[];
    deadlines: { title: string; date: string }[];
    notes?: { title: string; content: string };
}

export interface GeneratedQuiz {
    title: string;
    topic: string;
    difficulty: string;
    questions: { id: string; type: string; text: string; options?: string[]; correctAnswer: string }[];
}

export interface LessonAnalysisResult {
    engagementSuggestions: { title: string; description: string; activityType: string }[];
    inclusivityAdaptations: { targetGroup: string; suggestion: string }[];
}

// --- DTOs (inputs for AI assistant actions) ---

export interface LessonScheduleInput {
    contenuto: string;
    materia: string;
    classe: string;
    tipoLezione?: LezioneTipo;
    obiettivi?: string;
    adattamenti?: string;
    compiti?: string;
    slotKey?: string;
    externalLink?: string;
}

export interface EvaluationInput {
    studenteId: string;
    materia: string;
    data: string;
    tipo: ValutazioneTipo;
    voto: string;
    argomento?: string;
    note?: string;
}

export interface UdaCreateInput {
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
    externalLink?: string;
}
