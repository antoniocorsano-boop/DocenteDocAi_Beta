import { 
    Studente, 
    Valutazione, 
    ValutazioneCompetenza, 
    Competenza, 
    Livello,
    PianoInclusione,
    Lezione,
    Uda
} from '../../types';

export const getProactiveSuggestionsPrompt = (
        studentContext: string[],
        studentsLength: number,
        evaluations: Valutazione[],
        competencyEvals: ValutazioneCompetenza[],
        uda: Uda[]
): string => `
TASK: Analisi Dati Classe e Suggerimenti Proattivi.

**DATI:**
- Studenti (${studentsLength}): ${JSON.stringify(studentContext)}
- Voti Recenti: ${JSON.stringify(evaluations)}
- Competenze: ${JSON.stringify(competencyEvals)}
- UDA Attive: ${JSON.stringify(uda)}

**OBIETTIVO:**
Identifica 3-4 azioni prioritarie per il docente.
Esempi:
- Studente con calo voti -> Suggerisci 'VIEW_STUDENT'.
- UDA ferma da tempo -> Suggerisci 'VIEW_UDA'.
- Classe con media bassa -> Suggerisci 'ANALYZE_CLASS'.
- Pochi voti registrati -> Suggerisci 'PLAN_LESSON'.

**FORMATO OUTPUT:** JSON ESCLUSIVO (Array)
[
    {
        "icon": "icona_m3 (es. warning, trending_up)",
        "title": "Titolo breve",
        "description": "Motivazione del suggerimento.",
        "action": {
            "type": "VIEW_STUDENT" | "PLAN_LESSON" | "ANALYZE_CLASS" | "VIEW_UDA",
            "payload": { "studentId": "...", "class": "..." }
        }
    }
]
`;

export const getClassAnalysisPrompt = (selectedClass: string, dataSummary: {
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvals: ValutazioneCompetenza[];
    lessons: Lezione[];
}): string => `
TASK: Report Consiglio di Classe (Analisi Dati).

**DATI CLASSE ${selectedClass}:**
${JSON.stringify(dataSummary, null, 2)}

**RICHIESTA:**
Analizza i dati e produci un testo per il verbale.

**FORMATO OUTPUT:** JSON ESCLUSIVO
{
  "sintesiGenerale": "Paragrafo discorsivo su andamento e clima.",
  "puntiDiForza": ["List item 1", "List item 2"],
  "areeDiMiglioramento": ["List item 1", "List item 2"],
  "casiParticolari": ["Osservazione anonima su trend (es. gruppo eccellente, casi in calo)"]
}
`;

export const getPeriodicJudgmentSuggestionPrompt = (
    s: Studente, 
    per: string, 
    evals: Valutazione[], 
    cEvals: ValutazioneCompetenza[]
): string => `
TASK: Scrittura Giudizio Sintetico Periodico.
STUDENTE: ${s.cognome} ${s.nome}
PERIODO: ${per}
VALUTAZIONI: ${JSON.stringify(evals)}
COMPETENZE: ${JSON.stringify(cEvals)}

Scrivi un giudizio globale, equilibrato e propositivo che tenga conto del rendimento e del processo di apprendimento.
`;

export const getPIPSuggestionPrompt = (
    s: Studente, 
    evals: Valutazione[], 
    cEvals: ValutazioneCompetenza[],
    comps: Competenza[],
    sec: string
): string => {
    const isMateria = sec.startsWith('obj-');
    const materiaName = isMateria ? sec.replace('obj-', '') : '';

    return `
TASK: Suggerimento per Piano di Inclusione (PEI/PDP).
STUDENTE: ${s.cognome} ${s.nome}
SEZIONE: ${isMateria ? `Obiettivi per la materia: ${materiaName}` : sec}
DATI VALUTAZIONI: ${JSON.stringify(evals)}
DATI COMPETENZE: ${JSON.stringify(cEvals)}

${isMateria 
    ? `Suggerisci obiettivi minimi o differenziati per la materia ${materiaName}, basandoti sul profilo dello studente e sulle sue valutazioni.`
    : `Suggerisci contenuti per la sezione "${sec}" del piano di inclusione.`}

Fornisci un testo professionale, pedagogico e sintetico.
`;
};

export const getCompetencyNotePrompt = (s: Studente, c: Competenza, l: Livello): string => `
TASK: Generazione Nota per Valutazione Competenza.
STUDENTE: ${s.cognome} ${s.nome}
COMPETENZA: ${c.nome}
LIVELLO: ${l.nome}

Scrivi una breve nota che giustifichi l'assegnazione del livello ${l.nome} per la competenza ${c.nome}.
`;

export const getAIPedagogicalAdvicePrompt = (data: {
    lesson: Lezione;
    students: Studente[];
    evaluations: Valutazione[];
}, type: string): string => `
TASK: Consulenza Pedagogica Personalizzata.
TIPO: ${type}
DATI: ${JSON.stringify(data)}

Fornisci consigli pratici per il ${type} (recupero o potenziamento).

**FORMATO OUTPUT:** JSON ESCLUSIVO
{
  "suggerimenti": [
    { "titolo": "...", "descrizione": "..." }
  ]
}
`;

export const getClassCouncilNarrativeReportPrompt = (data: {
    classe: string;
    periodo: string;
    stats: string;
    criticalities: string[];
    strengths: string[];
}): string => `
TASK: Report Narrativo per Consiglio di Classe.
DATI: ${JSON.stringify(data)}

Genera un testo formale per il verbale del consiglio di classe.
`;

export const getSituazionePartenzaPrompt = (params: {
    classe: string;
    materia?: string;
    students?: Studente[];
    evaluations?: Valutazione[];
    competencyEvals?: ValutazioneCompetenza[];
    pianiInclusione?: PianoInclusione[];
    tags: string[];
    notes?: string;
}): string => `
TASK: Analisi situazione di partenza per la classe ${params.classe}.
TAGS: ${params.tags.join(', ')}
NOTE: ${params.notes || 'Nessuna nota aggiuntiva.'}

Genera un testo professionale e pedagogico che descriva il profilo della classe basandosi sui tag forniti.
`;

export const getPedagogicalAnalysisPrompt = (lesson: { title: string; description: string; }): string => `
TASK: Analisi Pedagogica e Inclusiva di un piano lezione.

**LEZIONE DA ANALIZZARE:**
- Titolo: "${lesson.title}"
- Contenuto: "${lesson.description}"

**RICHIESTA:**
Fornisci un output strutturato su due assi:
1. **Engagement (Coinvolgimento):** 3 strategie concrete per rendere la lezione attiva (es. ganci, gamification).
2. **Universal Design for Learning (UDL):** 3 adattamenti per supportare diversi stili di apprendimento (visivo, uditivo, cinestetico).

**FORMATO OUTPUT:** JSON ESCLUSIVO
{
    "engagementSuggestions": [
        { "title": "...", "description": "...", "activityType": "..." }
    ],
    "inclusivityAdaptations": [
        { "targetGroup": "...", "suggestion": "..." }
    ]
}
`;

