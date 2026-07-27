// ============================================================================
// TEMPLATE DOMAIN — document templates, reports, and export content shapes
// ============================================================================

export interface DocumentTemplate {
    id: string;
    name: string;
    type: 'student_profile' | 'lesson_plan' | 'uda';
    description?: string;
    createdAt: string;
    updatedAt: string;
    // Configurazioni specifiche per tipo
    config: {
        // Per profili studente
        includeEvaluations?: boolean;
        includeCompetencyEvaluations?: boolean;
        customSections?: string[];
        // Per piani lezione
        includeObjectives?: boolean;
        includeMaterials?: boolean;
        customFields?: Record<string, string>;
        // Per UDA
        includePhases?: boolean;
        includeEvaluation?: boolean;
        customIntroduction?: string;
        customConclusion?: string;
    };
    // Contenuto predefinito/template
    content?: {
        header?: string;
        footer?: string;
        customCss?: string;
    };
}

export interface Report {
    id: string;
    nome: string;
    dataCreazione: string;
    contesto: { tipo: string; id: string; titolo: string };
    modelloUsato: { nome: string; tipo: string };
    file: { name: string; content: string; mimeType: string };
}

export interface VocalAssistantGuide {
    title: string;
    sections: { title: string; commands: string[] }[];
}

export interface BrochureContent {
    brochureTitle: string;
    introduction: string;
    useCases: { title: string; benefits: string[] }[];
    technicalGuarantees: { title: string; content: string };
    roadmap: { title: string; items: { title: string; description: string }[] };
    callToAction: string;
}

export interface FaqItem {
    q: string;
    a: string;
}

export interface EssayContent {
    title: string;
    content: string;
}

export interface TechnicalDocumentContent {
    title: string;
    specs: string[];
}
