export const getCircularAnalysisPrompt = (documentText: string, today: string): string => `
TASK: Analizza il testo di una circolare scolastica e estrai informazioni strutturate.
TESTO:
---
${documentText}
---
ISTRUZIONI:
1.  **summary**: Riassumi lo scopo in una frase.
2.  **events**: Trova eventi con data specifica. Estrai 'titolo', 'data' (formato ISO AAAA-MM-GG, assumendo oggi: ${today}), e 'oraInizio' (HH:MM).
3.  **deadlines**: Trova scadenze burocratiche o operative. Estrai 'title' e 'date' (AAAA-MM-GG).
4.  **notes**: Estrai il contenuto principale come nota informativa, con un 'title' e 'content'.

FORMATO OUTPUT: Restituisci ESCLUSIVAMENTE un oggetto JSON valido.
`;

export const getWebSearchPrompt = (query: string): string => `
TASK: Ricerca web sintetica.
QUERY: "${query}"

Fornisci una risposta chiara, fattuale e aggiornata. Se trovi dati statistici o normativi recenti, citali.
`;

export const getQuizPrompt = (config: {
    topic: string;
    numQuestions?: number;
    questionCount?: number;
    difficulty: 'facile' | 'medio' | 'difficile';
    type?: string;
    selectedTypes?: string;
}, corpusContent: string): string => `
TASK: Generare una Verifica Scritta.

**CONFIGURAZIONE:**
- Argomento: "${config.topic}"
- Difficoltà: ${config.difficulty}
- Domande: ${config.questionCount || config.numQuestions}
- Tipi ammessi: ${config.selectedTypes || config.type}

**FONTE (KB):**
${corpusContent.substring(0, 20000)}

**FORMATO OUTPUT:** JSON ESCLUSIVO
{
  "title": "Titolo Verifica",
  "topic": "${config.topic}",
  "difficulty": "${config.difficulty}",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "true_false" | "open_ended",
      "text": "Domanda...",
      "options": ["A", "B", "C", "D"], // Solo se multiple_choice
      "correctAnswer": "Soluzione o criteri di correzione"
    }
  ]
}
`;

export const getThemePrompt = (prompt: string): string => `
TASK: Generare Palette Colori Material Design 3.
INPUT: "${prompt}"

Crea 3 colori esadecimali armoniosi che rispecchino l'input (es. "Oceano" -> Blu/Teal).

**FORMATO OUTPUT:** JSON ESCLUSIVO
{
    "primary": "#HEX",
    "secondary": "#HEX",
    "tertiary": "#HEX",
    "name": "Nome creativo (es. Deep Ocean)"
}
`;

export const getAnswerFromCorpusPrompt = (corpus: string, q: string): string => `
TASK: Risposta a domanda basata su documenti.
DOMANDA: "${q}"
FONTI:
---
${corpus.substring(0, 15000)}
---

Rispondi in modo preciso citando le fonti se possibile. Se la risposta non è presente nei documenti, dillo chiaramente.
`;

export const getStudioOutputPrompt = (task: string, corpus: string): string => `
TASK: Elaborazione Studio Assistita.
ATTIVITÀ: ${task}
FONTI: ${corpus.substring(0, 10000)}

Esegui l'attività richiesta basandoti sulle fonti fornite.
`;

export const getEventExtractionPrompt = (text: string): string => `
TASK: Estrazione Eventi da Testo.
TESTO: ${text}

Estrai data, ora e titolo dell'evento.

**FORMATO OUTPUT:** JSON ESCLUSIVO
`;

export const getLessonEnrichPrompt = (lesson: any): string => `
TASK: Arricchisci il piano lezione con contesto didattico, pedagogico, inclusivo e suggerimenti aggiuntivi.
LEZIONE:
Titolo/Contenuto: ${lesson?.contenuto || ''}
Classe: ${lesson?.classe || ''}
Materia: ${lesson?.materia || ''}
Obiettivi: ${lesson?.obiettivi || ''}
Contesto: ${lesson?.contesto || ''}
Compiti: ${lesson?.compiti || ''}
Adattamenti attuali: ${lesson?.adattamenti || ''}

**OBIETTIVO:**
Genera un testo di arricchimento utile per il docente (es. spunti didattici, attività alternative, suggerimenti inclusivi, note di contesto, estensioni).

**FORMATO OUTPUT:** Testo markdown strutturato, professionale e pronto per essere aggiunto alla nota della lezione.
`;

export const getCurriculumParsingPrompt = (text: string): string => `
TASK: Parsing Curricolo Ministeriale.
TESTO: ${text.substring(0, 10000)}

Estrai competenze, abilità e conoscenze.

**FORMATO OUTPUT:** JSON ESCLUSIVO
`;

export const getRefineTextPrompt = (text: string, instructions: string): string => `
TASK: Perfezionamento Testo con AI.
ISTRUZIONI: ${instructions}
TESTO ORIGINALE:
${text}

Applica le istruzioni al testo mantenendo il significato originale ma migliorando la forma.
`;

export const getTemplateGenerationPrompt = (description: string, type: string): string => `
TASK: Generazione Template Documento Scolastico.
DESCRIZIONE: "${description}"
TIPO: ${type}

Crea una struttura di template professionale (HTML/CSS) per il tipo di documento richiesto.
Usa i seguenti placeholder se pertinenti:
- {{nome_studente}}, {{cognome_studente}}, {{classe}}, {{data}}, {{materia}}, {{nome_docente}}
- {{voti_tabella}}, {{competenze_tabella}}, {{obiettivi_lista}}, {{fasi_uda}}

**FORMATO OUTPUT:** JSON ESCLUSIVO
{
    "name": "Nome del template",
    "description": "Breve descrizione",
    "content": {
        "header": "HTML per l'intestazione",
        "footer": "HTML per il piè di pagina",
        "customCss": "CSS personalizzato"
    },
    "config": {
        "includeEvaluations": true,
        "includeCompetencyEvaluations": true,
        "customSections": ["Sezione 1", "Sezione 2"]
    }
}
`;

