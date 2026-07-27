import { 
    Uda, 
    Lezione, 
    Competenza, 
    PianoInclusione, 
    KnowledgeBaseEntry
} from '../../types';
import { JSON_OUTPUT_FORMAT_LESSON } from './shared';

export const getLessonSuggestionPrompt = (
    context: {
        classe: string; materia: string; uda?: Uda; existingLessonsInUda: Lezione[];
        topic?: string; knowledgeBase?: KnowledgeBaseEntry[]; pianiInclusione?: PianoInclusione[]; allCompetenze: Competenza[];
    }
): string => {
    const inclusionContext = (context.pianiInclusione && context.pianiInclusione.length > 0)
    ? `\n\n**SUPPORTO ALL'INCLUSIVITÀ:**
- **Piani di Inclusione Attivi:** ${context.pianiInclusione.length} studenti con BES/DSA.
- **Richiesta:** Nel campo "adattamenti", suggerisci 1-2 strategie specifiche (es. mappe, tempi aggiuntivi) basate su questi bisogni.`
    : '';

    if (context.uda) {
        const competencyNames = context.uda.competencyIds
            .map(id => context.allCompetenze.find(c => c.id === id)?.nome)
            .filter(Boolean);

        return `
TASK: Generare la prossima lezione logica per un'Unità di Apprendimento (UDA) in corso.

**DATI UDA:**
- **Titolo:** ${context.uda.title}
- **Prodotto Finale:** ${context.uda.finalProduct}
- **Competenze Target:** ${competencyNames.join(', ')}
- **Fasi Previste:**
${context.uda.phases.map(p => `  - ${p.title}: ${p.description}`).join('\n')}

**PROGRESSO ATTUALE (Lezioni già svolte/pianificate):**
${context.existingLessonsInUda.length > 0 ? context.existingLessonsInUda.map(l => `  - "${l.contenuto}"`).join('\n') : '  - Nessuna (Inizio UDA).'}

**INPUT SPECIFICO:** "${context.topic || 'Prosegui sequenza logica'}"
${inclusionContext}

**ISTRUZIONI:**
1. Analizza il progresso rispetto alle fasi dell'UDA.
2. Genera il contenuto della prossima lezione coerente.
3. Definisci obiettivi misurabili e tipo di lezione.

**FORMATO OUTPUT:** JSON
${JSON_OUTPUT_FORMAT_LESSON}
`;
    } else {
        const kbContext = (context.knowledgeBase && context.knowledgeBase.length > 0)
            ? `\n\n**CONTESTO KNOWLEDGE BASE (Usa se pertinente):**\n---\n${context.knowledgeBase.map(e => e.content).join('\n').substring(0, 5000)}\n---`
            : '';

        return `
TASK: Generare una lezione singola (Spot).
ARGOMENTO: "${context.topic || 'Argomento a piacere del programma'}"
${kbContext}
${inclusionContext}

Genera una struttura di lezione completa.

**FORMATO OUTPUT:** JSON
${JSON_OUTPUT_FORMAT_LESSON}
`;
    }
};

export const getLessonFromIdeaPrompt = (ideaText: string, kbContent?: string): string => `
TASK: Trasformare un appunto informale in un piano di lezione professionale.

**IDEA GREZZA:** "${ideaText}"

${kbContent ? `**CONTESTO DOCUMENTALE (KB):**\n${kbContent.substring(0, 5000)}\n` : ''}

**RICHIESTA:**
Espandi l'idea in una lezione strutturata pronta per l'aula. Cerca di essere creativo ma concreto.

**FORMATO OUTPUT:** JSON ESCLUSIVO
{
    "title": "Titolo Formale",
    "htmlContent": "HTML (senza tag html/body) con: <h2>Obiettivi</h2> (lista), <h2>Svolgimento</h2> (descrizione fasi), <h2>Materiali</h2>, <h2>Compiti</h2>."
}
`;

interface ClassPlanningData {
    situazionePartenza: string;
    studentiStats: string;
    inclusioneStats: string;
    udaList: string;
    kbContext: string;
    metodologie: string;
    materia: string;
}

export const getClassPlanningPrompt = (data: ClassPlanningData): string => `
TASK: Redigere il documento "Progettazione Disciplinare di Classe".

**DATI DI INPUT:**
- **Materia:** ${data.materia}
- **Analisi Classe:** ${data.situazionePartenza}
- **Statistiche:** ${data.studentiStats}
- **Inclusione:** ${data.inclusioneStats}
- **UDA Previste:** ${data.udaList}
- **Riferimenti (KB):** ${data.kbContext.substring(0, 10000)}
- **Metodologie:** ${data.metodologie}

**ISTRUZIONI:**
Genera un documento HTML strutturato (h1, h2, p, ul, table) pronto per la stampa/export.
Sezioni richieste:
1. Analisi Situazione di Partenza (usa linguaggio formale).
2. Obiettivi di Apprendimento (OSA) e Obiettivi Minimi.
3. Metodologie e Strumenti.
4. Criteri di Valutazione (griglie, livelli).
5. Scansione Temporale (Tabella UDA vs Periodi).
6. Strategie di Recupero/Potenziamento.

TONO: Istituzionale e professionale.
`;

export const getAnnualPlanPrompt = (kb: string, subj: string, cls: string): string => `
TASK: Generazione Piano Annuale UDA.
MATERIA: ${subj}
CLASSE: ${cls}
FONTI (KB): ${kb.substring(0, 10000)}

Genera una sequenza logica di 6-8 Unità di Apprendimento (UDA) per l'intero anno scolastico.

**FORMATO OUTPUT:** JSON ESCLUSIVO (Array di oggetti)
[
  {
    "id": "uda-1",
    "title": "Titolo UDA",
    "hours": 10,
    "topic": "Argomento principale",
    "description": "Breve descrizione"
  }
]
`;

export const getUdaValidationPrompt = (uda: Uda, kb: KnowledgeBaseEntry[]): string => `
TASK: Validazione Coerenza UDA con Curricolo Verticale.
UDA: ${uda.title}
CURRICOLO: ${JSON.stringify(kb).substring(0, 5000)}

Analizza se gli obiettivi e le competenze dell'UDA sono allineati con il curricolo della scuola.
`;

export const getLessonSequencePrompt = (uda: Uda[], classe: string, kb: string): string => `
TASK: Generazione Sequenza Lezioni Strutturata.
CLASSE: ${classe}
UDA: ${JSON.stringify(uda)}
FONTI: ${kb.substring(0, 5000)}

Genera un elenco di lezioni dettagliate per coprire le UDA fornite.

**FORMATO OUTPUT:** JSON ESCLUSIVO (Array)
`;

export const getAddContextToLessonPrompt = (lesson: Lezione): string => `
TASK: Arricchimento Lezione.
LEZIONE: ${JSON.stringify(lesson)}
`;

export const getInclusivityAdaptationsPrompt = (ctx: {
    lesson: Lezione;
    classe: string;
}, piani: PianoInclusione[]): string => `
TASK: Adattamenti Inclusivi per Lezione.
LEZIONE: ${JSON.stringify(ctx)}
PIANI: ${JSON.stringify(piani)}

Suggerisci adattamenti specifici per gli studenti con BES/DSA presenti in classe.
`;

export const getMethodologyStrategiesPrompt = (ctx: string): string => `
TASK: Suggerimento metodologie e strategie didattiche.
CONTESTO: ${ctx}

Suggerisci 3-4 metodologie attive (es. Flipped Classroom, Debate, Cooperative Learning) e strumenti digitali appropriati per il contesto fornito.
`;

