/* eslint-disable @typescript-eslint/no-unused-vars */
import { AiSettings, Lezione, Uda, Valutazione, ValutazioneCompetenza, Competenza, Studente, Livello, KnowledgeBaseEntry, AiSuggestion, PianoInclusione, CircularAnalysisResult, EventoCalendario, ChatMessage, GeneratedQuiz, LessonAnalysisResult, CurriculumSubject, TechnicalDocumentContent, EssayContent } from '../types';
import { getGoogleAIClient, callAiWithRetry } from './aiClient';
import * as Prompts from './aiPrompts';

const SYSTEM_PERSONA_TEACHER = `SEI UN ASSISTANTE DIDATTICO ESPERTO (Target: Scuola Italiana).
RUOLO: Pedagogista digitale, esperto in normative MIUR, didattica per competenze e inclusione (BES/DSA).
FORMATO: Rispetta rigorosamente i formati richiesti (JSON/Markdown).`;
// Utility function to ensure content passed to AI is always a string
const ensureString = (content: unknown): string => {
    if (typeof content === 'string') {
        return content;
    }
    if (content === null || content === undefined) {
        return '';
    }
    if (typeof content === 'object') {
        return JSON.stringify(content);
    }
    return String(content);
};

// Funzione generica per generazione contenuti AI (usata da NKA wizard)
export const generateContent = async (prompt: string, options: { temperature?: number; maxTokens?: number; stop?: string | undefined }): Promise<{ content: string }> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: ensureString(prompt),
            config: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? 1000,
                stopSequences: options.stop ? [options.stop] : undefined
            }
        });
        return { content: response.text || '' };
    });
};

export const buildSystemInstruction = (
    userContext?: { classContext?: string; subject?: string; schoolType?: string; teacherName?: string },
    systemInstructionOverride?: string
): string => {
    let persona = systemInstructionOverride || SYSTEM_PERSONA_TEACHER;
    if (userContext) {
        if (userContext.classContext) persona += `\nClasse Target: ${String(userContext.classContext)}`;
        if (userContext.subject) persona += `\nMateria: ${String(userContext.subject)}`;
    }
    return persona;
};

export const cleanAndParseJson = <T>(text: string): T => {
    let cleanedText = text.trim();
    const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
        cleanedText = match[1].trim();
    } else {
        const firstBrace = cleanedText.indexOf('{');
        const firstBracket = cleanedText.indexOf('[');
        let startIndex = -1;
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) startIndex = firstBrace;
        else if (firstBracket !== -1) startIndex = firstBracket;
        if (startIndex !== -1) {
            const lastBrace = cleanedText.lastIndexOf('}');
            const lastBracket = cleanedText.lastIndexOf(']');
            const endIndex = Math.max(lastBrace, lastBracket);
            if (endIndex > startIndex) cleanedText = cleanedText.substring(startIndex, endIndex + 1);
        }
    }
    try {
        return JSON.parse(cleanedText) as T;
    } catch (e) {
        throw new Error("Il formato della risposta AI non è valido. Riprova.");
    }
};

// --- CORE FUNCTIONS (FIXED & EXPORTED) ---

/**
 * Analizza un documento (es. circolare) per estrarre informazioni strutturate.
 * @param aiSettings Impostazioni AI (modello, ecc.)
 * @param source Oggetto contenente il testo del file
 * @returns Risultato dell'analisi strutturato
 */
export const analyzeCircularDocument = async (aiSettings: AiSettings, source: { fileContent?: string }): Promise<CircularAnalysisResult> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: Prompts.getCircularAnalysisPrompt(source.fileContent || '', new Date().toISOString()), // FIX: Ensure content is a string.
            config: { responseMimeType: 'application/json', systemInstruction: buildSystemInstruction() }
        });
        return cleanAndParseJson<CircularAnalysisResult>(response.text || '{}');
    });
};

/**
 * Esegue una ricerca web utilizzando Google Search Grounding.
 * @param aiSettings Impostazioni AI
 * @param query Stringa di ricerca
 * @returns Testo generato e fonti citate
 */
export const performWebSearch = async (aiSettings: AiSettings, query: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: String(query),
            config: { tools: [{ googleSearch: {} }] }
        });
        const sources: { title: string; uri: string }[] = [];
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: { web?: { uri: string; title: string } }) => {
                if (chunk.web?.uri && chunk.web?.title) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            });
        }
        return { text: response.text || 'No sources found.', sources };
    });
};

/**
 * Genera una proposta di lezione basata sul contesto didattico corrente.
 * @param aiSettings - Configurazione del modello AI da usare
 * @param context - Contesto: classe, materia, UDA di riferimento, lezioni esistenti e KB
 * @returns Oggetto `Lezione` parziale con titolo, obiettivi e attività suggeriti
 */
export const getLessonSuggestion = async (aiSettings: AiSettings, context: {
    classe: string; materia: string; uda?: Uda; existingLessonsInUda: Lezione[];
    topic?: string; knowledgeBase?: KnowledgeBaseEntry[]; pianiInclusione?: PianoInclusione[]; allCompetenze: Competenza[];
}): Promise<Partial<Lezione>> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: Prompts.getLessonSuggestionPrompt(context),
            config: { responseMimeType: 'application/json' }
        });
        try {
            return cleanAndParseJson(response.text || '{}');
        } catch {
            return { contenuto: "L'AI non ha fornito una risposta valida." };
        }
    });
};

export const analyzeLessonPedagogy = async (aiSettings: AiSettings, lesson: { title: string; description: string; }): Promise<LessonAnalysisResult> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(Prompts.getPedagogicalAnalysisPrompt(lesson)),
            config: { responseMimeType: "application/json", systemInstruction: buildSystemInstruction() }
        });
        return cleanAndParseJson<LessonAnalysisResult>(response.text || '{}');
    });
};

export const generateLessonFromIdea = async (aiSettings: AiSettings, ideaText: string, targetClass: string, kbContent?: string): Promise<{ title: string; htmlContent: string }> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: ensureString(Prompts.getLessonFromIdeaPrompt(ideaText, kbContent)),
            config: { responseMimeType: 'application/json', systemInstruction: buildSystemInstruction({ classContext: targetClass }) }
        });
        return cleanAndParseJson(response.text || '{}');
    });
};

export const generateSituazionePartenza = async (aiSettings: AiSettings, params: { classe: string; tags: string[]; notes?: string; }): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: ensureString(Prompts.getSituazionePartenzaPrompt(params)),
            config: { systemInstruction: buildSystemInstruction() }
        });
        return response.text || "";
    });
};

export const generateMethodologyStrategies = async (aiSettings: AiSettings, ctx: string): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: ensureString(Prompts.getMethodologyStrategiesPrompt(ctx)),
            config: { systemInstruction: buildSystemInstruction() }
        });
        return response.text || "";
    });
};

/**
 * Genera una proposta di piano annuale (elenco UDA) basata sulla Knowledge Base.
 * @param aiSettings - Configurazione del modello AI
 * @param kb - Contenuto testuale della Knowledge Base del docente
 * @param subj - Materia di insegnamento
 * @param cls - Classe di riferimento
 * @returns Array di `Uda` parziali con titoli, obiettivi e durate suggeriti
 */
export const suggestAnnualPlan = async (aiSettings: AiSettings, kb: string, subj: string, cls: string): Promise<Partial<Uda>[]> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: ensureString(Prompts.getAnnualPlanPrompt(kb, subj, cls)),
            config: { responseMimeType: "application/json", systemInstruction: buildSystemInstruction({ classContext: cls, subject: subj }) }
        });
        return cleanAndParseJson<Partial<Uda>[]>(response.text || '[]');
    });
};

export const generateClassPlanningDocument = async (aiSettings: AiSettings, data: {
    situazionePartenza: string;
    studentiStats: string;
    inclusioneStats: string;
    udaList: string;
    kbContext: string;
    metodologie: string;
    materia: string;
}): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: ensureString(Prompts.getClassPlanningPrompt(data)),
            config: { systemInstruction: buildSystemInstruction() }
        });
        return response.text || "";
    });
};

export const generateAnswerFromCorpus = async (aiSettings: AiSettings, corpus: string, q: string): Promise<ChatMessage> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: ensureString(Prompts.getAnswerFromCorpusPrompt(corpus, q)),
            config: { systemInstruction: buildSystemInstruction() }
        });
        return { role: 'model', text: r.text || "" };
    });
};

export const generateTechnicalDocumentContent = async (aiSettings: AiSettings): Promise<TechnicalDocumentContent | null> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: aiSettings?.model || "gemini-3-flash-preview",
            contents: ensureString(Prompts.getTechnicalDocumentContentPrompt()),
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJson<TechnicalDocumentContent>(r.text || '{}');
    });
};

export const generateAcademicEssayContent = async (aiSettings: AiSettings): Promise<EssayContent | null> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(Prompts.getAcademicEssayContentPrompt()),
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJson<EssayContent>(r.text || '{}');
    });
};

/**
 * Genera un giudizio periodico testuale per uno studente.
 * @param aiSettings - Configurazione del modello AI
 * @param s - Profilo dello studente
 * @param per - Periodo di valutazione (es. 'I quadrimestre')
 * @param evals - Valutazioni disciplinari dello studente nel periodo
 * @param cEvals - Valutazioni per competenza dello studente
 * @param comps - Elenco completo delle competenze di riferimento
 * @returns Stringa con il giudizio sintetico suggerito
 */
export const getPeriodicJudgmentSuggestion = async (aiSettings: AiSettings, s: Studente, per: string, evals: Valutazione[], cEvals: ValutazioneCompetenza[], comps: Competenza[]): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(Prompts.getPeriodicJudgmentSuggestionPrompt(s, per, evals, cEvals))
        });
        return r.text || "";
    });
};

/**
 * Genera un report didattico in formato Markdown per diversi contesti.
 * @param aiSettings - Configurazione del modello AI da usare
 * @param type - Tipo di report (es. `'class_summary'`, `'student_progress'`, `'uda_report'`)
 * @param data - Dati contestuali da includere nella generazione (classe, studenti, UDA, ecc.)
 * @returns Stringa Markdown con il contenuto del report generato
 */
export const generateMarkdownReport = async (aiSettings: AiSettings, type: string, data: Record<string, unknown>): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: aiSettings?.model || "gemini-3-flash-preview",
            contents: ensureString(Prompts.getMarkdownReportPrompt(type, data))
        });
        return r.text || "";
    });
};

export const validateUdaVerticalCurriculum = async (aiSettings: AiSettings, uda: Uda, kb: KnowledgeBaseEntry[]): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: ensureString(Prompts.getUdaValidationPrompt(uda, kb))
        });
        return r.text || "";
    });
};

export const generateLessonSequenceForClass = async (
    aiSettings: AiSettings,
    uda: Uda[],
    classe: string,
    kb: string
): Promise<Partial<Lezione>[]> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(Prompts.getLessonSequencePrompt(uda, classe, kb)),
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJson<Partial<Lezione>[]>(r.text || '[]');
    });
};

export const getPIPSuggestion = async (aiSettings: AiSettings, s: Studente, evals: Valutazione[], cEvals: ValutazioneCompetenza[], comps: Competenza[], sec: string): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(Prompts.getPIPSuggestionPrompt(s, evals, cEvals, comps, sec))
        });
        return r.text || "";
    });
};

export const generateCompetencyNote = async (aiSettings: AiSettings, s: Studente, c: Competenza, l: Livello): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: ensureString(Prompts.getCompetencyNotePrompt(s, c, l))
        });
        return r.text || "";
    });
};

export const getAIPedagogicalAdvice = async (aiSettings: AiSettings, data: {
    lesson: Lezione;
    students: Studente[];
    evaluations: Valutazione[];
}, type: string, comps: Competenza[]): Promise<Record<string, unknown>> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(Prompts.getAIPedagogicalAdvicePrompt(data, type)),
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJson<Record<string, unknown>>(r.text || '{}');
    });
};

export const generateFormattedDocument = async (aiSettings: AiSettings, corpus: string, prompt: string): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(prompt)
        });
        return r.text || "";
    });
};

export const generateQuiz = async (aiSettings: AiSettings, corpus: string, config: {
    topic: string;
    numQuestions: number;
    difficulty: 'facile' | 'medio' | 'difficile';
    type: 'scelta-multipla' | 'vero-falso' | 'domande-aperte';
}): Promise<GeneratedQuiz> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(Prompts.getQuizPrompt(config, corpus)),
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJson<GeneratedQuiz>(r.text || '{}');
    });
};

export const generateStudioOutput = async (aiSettings: AiSettings, corpus: string, task: string): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(Prompts.getStudioOutputPrompt(task, corpus))
        });
        return r.text || "";
    });
};

export const addContextToLesson = async (aiSettings: AiSettings, lesson: Lezione): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: ensureString(Prompts.getAddContextToLessonPrompt(lesson))
        });
        return r.text || "";
    });
};

export const generateInclusivityAdaptations = async (aiSettings: AiSettings, ctx: { lesson: Lezione; student?: Studente }, piani: PianoInclusione[]): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: ensureString(Prompts.getInclusivityAdaptationsPrompt({
                lesson: ctx.lesson,
                classe: ctx.student?.classe || ctx.lesson.classe
            }, piani))
        });
        return r.text || "";
    });
};

/**
 * Genera suggerimenti proattivi basati sullo stato attuale della classe.
 * @param aiSettings Impostazioni AI
 * @param state Stato contenente studenti, voti e UDA
 * @returns Array di suggerimenti azionabili
 */
export const getProactiveSuggestions = async (aiSettings: AiSettings, state: {
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvaluations: ValutazioneCompetenza[];
    udas: Uda[];
}): Promise<AiSuggestion[]> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const studentContext = state.students.map(s => `${s.cognome} ${s.nome} (${s.classe})`);
        const r = await ai.models.generateContent({
            model: aiSettings?.model || "gemini-3-flash-preview",
            contents: ensureString(Prompts.getProactiveSuggestionsPrompt(studentContext, state.students.length, state.evaluations, state.competencyEvaluations, state.udas)),
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJson<AiSuggestion[]>(r.text || '[]');
    });
};

export const generateThemeFromPrompt = async (aiSettings: AiSettings, p: string): Promise<Record<string, unknown>> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: aiSettings?.model || "gemini-3-flash-preview",
            contents: ensureString(Prompts.getThemePrompt(p)),
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJson<Record<string, unknown>>(r.text || '{}');
    });
};

export const generateImageFromPrompt = async (aiSettings: AiSettings, p: string): Promise<{ data: string; mimeType: string }> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: String(p) }] }
        });
        if (r.candidates?.[0]?.content?.parts) {
            for (const part of r.candidates[0].content.parts) {
                if (part.inlineData) return { data: part.inlineData.data || '', mimeType: part.inlineData.mimeType || 'image/png' };
            }
        }
        throw new Error("Immagine non generata");
    });
};

/**
 * Gestisce una conversazione chat con il modello, mantenendo il contesto.
 * @param aiSettings Impostazioni AI
 * @param messages Cronologia messaggi
 * @param context Contesto opzionale (classe, materia)
 * @returns Risposta del modello
 */
export const chatWithAi = async (aiSettings: AiSettings, messages: ChatMessage[], context?: Record<string, unknown>): Promise<ChatMessage> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const lastMessage = messages[messages.length - 1];
        const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        const response = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: lastMessage.text ?? '' }] }],
            config: {
                systemInstruction: buildSystemInstruction(context),
                // history: history // Gemini SDK handles history differently depending on version, but we can pass it in contents if needed
            }
        });

        return { role: 'model', text: response.text || "" };
    });
};

export const extractEventFromText = async (aiSettings: AiSettings, t: string): Promise<Partial<EventoCalendario>> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: ensureString(Prompts.getEventExtractionPrompt(t)),
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJson<Partial<EventoCalendario>>(r.text || '{}');
    });
};

export const refactorProgrammazione = async (aiSettings: AiSettings, t: string): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(t)
        });
        return r.text || "";
    });
};

export const analyzeImage = async (aiSettings: AiSettings, img: string, p: string): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        if (!img.includes(',')) throw new Error("Invalid image data URL provided for analysis.");
        const base64Data = img.split(',')[1];
        const mimeTypeMatch = img.match(/^data:(.*?);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

        const r = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ inlineData: { data: base64Data, mimeType: mimeType } }, { text: ensureString(p) }] }
        });
        return r.text || "";
    });
};

export const parseCurriculumFromText = async (aiSettings: AiSettings, t: string, s: string, g: string): Promise<CurriculumSubject> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: ensureString(Prompts.getCurriculumParsingPrompt(t)),
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJson<CurriculumSubject>(r.text || '{}');
    });
};

export const refineTextWithAi = async (aiSettings: AiSettings, t: string, i: string): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: ensureString(Prompts.getRefineTextPrompt(t, i))
        });
        return r.text || "";
    });
};

export const generateDocumentTable = async (aiSettings: AiSettings, d: string): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const r = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: ensureString(Prompts.getDocumentTablePrompt(d))
        });
        return r.text || "";
    });
};

export const discoverAndCreateFeed = async (url: string): Promise<never> => { throw new Error("RSS Disabilitato."); };
export const fetchAndParseRssFeed = async (url: string): Promise<never> => { throw new Error("RSS Disabilitato."); };

export const generateClassCouncilNarrativeReport = async (aiSettings: AiSettings, data: {
    classe: string;
    periodo: string;
    stats: string;
    criticalities: string[];
    strengths: string[];
}): Promise<string> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: ensureString(Prompts.getClassCouncilNarrativeReportPrompt(data)),
            config: {
                systemInstruction: "Sei un esperto segretario di un consiglio di classe della scuola italiana, esperto in redazione di verbali e analisi pedagogiche."
            }
        });
        return response.text || "";
    });
};

export const generateTemplateWithAi = async (aiSettings: AiSettings, description: string, type: string): Promise<Record<string, unknown>> => {
    return callAiWithRetry(async () => {
        const ai = await getGoogleAIClient();
        const response = await ai.models.generateContent({
            model: aiSettings?.model || 'gemini-3-flash-preview',
            contents: ensureString(Prompts.getTemplateGenerationPrompt(description, type)),
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJson(response.text || '{}');
    });
};

