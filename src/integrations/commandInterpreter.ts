/**
 * Command Interpreter
 *
 * Parses Italian natural-language text (from chat or voice) into a typed
 * ParsedIntent that can be mapped to system actions.
 *
 * Design: pure functions, no side-effects, no store reads.
 * The caller is responsible for dispatching the resulting action.
 *
 * Supports Italian and common shorthand used by teachers.
 *
 * Extended pipeline (image support):
 *   Use `parseExtendedInput()` to handle both text and image inputs.
 *   Image inputs are routed to the Document AI pipeline (documentAI/index.ts).
 *   Text inputs continue through the existing parseIntent() path.
 */

import type { IntentAction, ParsedIntent } from '../types/integration.types';
import type { ExtendedInput } from '../services/documentAI/types';

// ─── Intent patterns ──────────────────────────────────────────────────────────

interface IntentPattern {
    action: IntentAction;
    patterns: RegExp[];
    /** Extract named params from the matched text */
    extract?: (text: string) => Record<string, string>;
}

/**
 * Ordered list: first match wins.
 * Patterns use case-insensitive, unicode-aware matching.
 */
const INTENT_PATTERNS: IntentPattern[] = [
    {
        action: 'create_class',
        patterns: [
            /crea\s+(una\s+)?classe\s+(\w+)/i,
            /nuova\s+classe\s+(\w+)/i,
            /aggiungi\s+(una\s+)?classe\s+(\w+)/i,
            /classe\s+(\w+)\s+(nuova|crea|aggiungi)/i,
        ],
        extract: (text) => {
            const m = text.match(/classe\s+(\w+)/i);
            return { className: m ? m[1].toUpperCase() : '' };
        },
    },
    {
        action: 'add_student',
        patterns: [
            /aggiungi\s+(lo\s+studente|la\s+studentessa|alunno|alunna|studente|studentessa)\s+(.+)/i,
            /nuovo\s+(alunno|alunna|studente|studentessa)\s+(.+)/i,
            /inserisci\s+(studente|alunno)\s+(.+)/i,
        ],
        extract: (text) => {
            const m = text.match(/(?:studente|studentessa|alunno|alunna)\s+(.+?)(?:\s+in\s+classe\s+(\w+))?$/i);
            return { studentName: m?.[1]?.trim() ?? '', className: m?.[2]?.toUpperCase() ?? '' };
        },
    },
    {
        action: 'import_students',
        patterns: [
            /importa\s+(gli\s+)?(studenti|alunni)/i,
            /carica\s+lista\s+(studenti|alunni|classe)/i,
            /ti\s+mando\s+un\s+file/i,
            /upload\s+(csv|excel|file)/i,
            /importa\s+da\s+classroom/i,
        ],
        extract: (text) => {
            const m = text.match(/classe\s+(\w+)/i);
            return { className: m?.[1]?.toUpperCase() ?? '' };
        },
    },
    {
        action: 'classroom_import',
        patterns: [
            /importa\s+da\s+(google\s+)?classroom/i,
            /collega\s+(classroom|classi)/i,
            /sincronizza\s+classroom/i,
            /prendi\s+(le\s+)?classi\s+da\s+classroom/i,
        ],
        extract: () => ({}),
    },
    {
        action: 'drive_sync',
        patterns: [
            /salva\s+(su|in)\s+(google\s+)?drive/i,
            /backup\s+(su\s+)?(google\s+)?drive/i,
            /sincronizza\s+(google\s+)?drive/i,
            /sincronizza\s+tutto/i,
        ],
        extract: () => ({}),
    },
    {
        action: 'create_uda',
        patterns: [
            /crea\s+(una\s+)?uda/i,
            /nuova\s+uda/i,
            /pianifica\s+(un'?\s*)?unit[àa]/i,
            /nuova\s+unit[àa]\s+didattica/i,
        ],
        extract: (text) => {
            const m = text.match(/uda\s+(?:su\s+|di\s+)?(.+)/i);
            return { subject: m?.[1]?.trim() ?? '' };
        },
    },
    {
        action: 'schedule_event',
        patterns: [
            /segna\s+(un\s+|una\s+)?(\w+)\s+(per|il|del?|alle?)/i,
            /programma\s+(evento|riunione|consiglio|verifica)/i,
            /aggiungi\s+(evento|impegno|riunione)/i,
            /ricordami\s+(?:di\s+)?(.+)/i,
        ],
        extract: (text) => {
            const dateMatch = text.match(/\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?/);
            const titleMatch = text.match(/(?:segna|programma|aggiungi)\s+(.+?)(?:\s+per|\s+il|\s+del?|\s+$)/i);
            return {
                title: titleMatch?.[1]?.trim() ?? '',
                date: dateMatch?.[0] ?? '',
            };
        },
    },
    {
        action: 'mark_attendance',
        patterns: [
            /registra\s+(le\s+)?presenze/i,
            /segna\s+(presente|assente)/i,
            /appello\s+(classe|per)/i,
            /(\w+)\s+[eè]\s+(presente|assente)/i,
        ],
        extract: (text) => {
            const classMatch = text.match(/classe\s+(\w+)/i);
            const studentMatch = text.match(/(\w+\s+\w+)\s+[eè]\s+(presente|assente)/i);
            return {
                className: classMatch?.[1]?.toUpperCase() ?? '',
                studentName: studentMatch?.[1] ?? '',
                status: studentMatch?.[2]?.toLowerCase() ?? '',
            };
        },
    },
    {
        action: 'add_evaluation',
        patterns: [
            /aggiungi\s+(valutazione|voto)\s+(.+)/i,
            /vota\s+(.+)/i,
            /inserisci\s+voto\s+(.+)/i,
        ],
        extract: (text) => {
            const gradeMatch = text.match(/(\d+(?:[,.]\d+)?)/);
            const nameMatch = text.match(/(?:voto|valutazione)\s+(.+?)(?:\s+\d|$)/i);
            return {
                studentName: nameMatch?.[1]?.trim() ?? '',
                grade: gradeMatch?.[1] ?? '',
            };
        },
    },
    {
        action: 'show_students',
        patterns: [
            /mostra\s+(gli\s+)?(studenti|alunni)/i,
            /lista\s+(studenti|alunni|classe)/i,
            /quanti\s+(studenti|alunni)/i,
            /chi\s+c'[eè]\s+in\s+classe/i,
        ],
        extract: (text) => {
            const m = text.match(/classe\s+(\w+)/i);
            return { className: m?.[1]?.toUpperCase() ?? '' };
        },
    },
    {
        action: 'show_class',
        patterns: [
            /apri\s+classe\s+(\w+)/i,
            /vai\s+(a|alla|in)\s+classe\s+(\w+)/i,
            /mostra\s+classe\s+(\w+)/i,
        ],
        extract: (text) => {
            const m = text.match(/classe\s+(\w+)/i);
            return { className: m?.[1]?.toUpperCase() ?? '' };
        },
    },
    {
        action: 'generate_content',
        patterns: [
            /genera\s+(una?\s+)?(lezione|compito|verifica|quiz|piano)/i,
            /scrivi\s+(una?\s+)?(lezione|interrogazione|verifica)/i,
            /crea\s+(una?\s+)?(verifica|quiz)/i,
        ],
        extract: (text) => {
            const m = text.match(/(?:genera|scrivi|crea)\s+(?:una?\s+)?(.+)/i);
            return { topic: m?.[1]?.trim() ?? '' };
        },
    },
    {
        action: 'show_next_step',
        patterns: [
            /cosa\s+devo\s+fare/i,
            /da\s+dove\s+comincio/i,
            /prossimo\s+passo/i,
            /che\s+faccio/i,
            /aiutami/i,
            /dammi\s+un\s+(consiglio|suggerimento)/i,
            /cosa\s+posso\s+fare/i,
            /inizia\s+qui/i,
            /guida\s+introduttiva/i,
        ],
        extract: () => ({}),
    },
];

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Parse a natural-language command (Italian) into a typed intent.
 * Returns a ParsedIntent with action='unknown' and confidence=0 if no match.
 */
export function parseIntent(
    text: string,
    source: ParsedIntent['source'] = 'app'
): ParsedIntent {
    const normalised = text.trim();

    for (const pattern of INTENT_PATTERNS) {
        for (const regex of pattern.patterns) {
            if (regex.test(normalised)) {
                return {
                    action: pattern.action,
                    params: pattern.extract?.(normalised) ?? {},
                    confidence: 0.85,
                    rawText: normalised,
                    source,
                };
            }
        }
    }

    return {
        action: 'unknown',
        params: {},
        confidence: 0,
        rawText: normalised,
        source,
    };
}

/**
 * Build a human-readable confirmation message for a parsed intent.
 * Used to respond to chat users before executing the action.
 */
export function buildConfirmationMessage(intent: ParsedIntent): string {
    const p = intent.params;
    switch (intent.action) {
        case 'create_class':
            return p.className
                ? `Creo la classe ${p.className}. Confermi?`
                : 'Vuoi creare una nuova classe? Dimmi il nome (es. "2B").';
        case 'add_student':
            return p.studentName
                ? `Aggiungo ${p.studentName}${p.className ? ` alla classe ${p.className}` : ''}. Confermi?`
                : 'Chi vuoi aggiungere? Dimmi nome e cognome.';
        case 'import_students':
            return 'Manda il file CSV o Excel con la lista studenti e li importo subito.';
        case 'classroom_import':
            return 'Importo le classi da Google Classroom. Un momento...';
        case 'drive_sync':
            return 'Avvio il backup su Google Drive. Un momento...';
        case 'create_uda':
            return p.subject
                ? `Creo una nuova UDA su "${p.subject}". Vuoi procedere?`
                : "Su quale argomento vuoi creare l'UDA?";
        case 'schedule_event':
            return p.date
                ? `Segno l'evento "${p.title}" per il ${p.date}. Confermi?`
                : "Quando vuoi programmare l'evento? Dimmi data e descrizione.";
        case 'mark_attendance':
            return p.className
                ? `Registro le presenze per la classe ${p.className}.`
                : 'Per quale classe vuoi registrare le presenze?';
        case 'add_evaluation':
            return p.studentName && p.grade
                ? `Aggiungo voto ${p.grade} a ${p.studentName}. Confermi?`
                : 'Chi vuoi valutare e con quale voto?';
        case 'show_students':
            return p.className
                ? `Ecco la lista della classe ${p.className}.`
                : 'Di quale classe vuoi vedere la lista?';
        case 'show_class':
            return p.className ? `Apro la classe ${p.className}.` : 'Quale classe?';
        case 'generate_content':
            return p.topic
                ? `Genero contenuto su "${p.topic}". Un momento...`
                : 'Su quale argomento vuoi generare contenuto?';
        case 'show_next_step':
            return (
                '💡 Per vedere il tuo prossimo passo personalizzato, apri l\'app DocenteDoc AI e guarda il pulsante assistente in basso a destra.\n\n' +
                'Qui via chat posso aiutarti con: crea classe, importa studenti, backup Drive, crea UDA.'
            );
        default:
            return 'Non ho capito. Prova con: "crea classe 2B", "importa studenti", "backup Drive".';
    }
}

/**
 * Returns a list of suggested quick-reply texts based on the last intent.
 * Shown as chips in the chat interface.
 */
export function getSuggestions(intent: ParsedIntent): string[] {
    switch (intent.action) {
        case 'create_class':
            return ['Aggiungi studenti', 'Crea UDA', 'Torna indietro'];
        case 'import_students':
            return ['Importa da Classroom', 'Carica file CSV', 'Annulla'];
        case 'classroom_import':
            return ['Connetti Classroom', 'Annulla'];
        case 'show_next_step':
            return ['Crea classe', 'Importa studenti', 'Crea UDA', 'Backup Drive'];
        case 'unknown':
            return ['Crea classe', 'Importa studenti', 'Backup Drive', 'Crea UDA'];
        default:
            return ['Altro', 'Annulla'];
    }
}

// ─── Extended input normalisation ────────────────────────────────────────────

/**
 * Normalise any ExtendedInput into a canonical form ready for routing.
 *
 * For text inputs: runs parseIntent() and returns a ParsedIntent.
 * For image inputs: signals the caller to run the Document AI pipeline.
 *
 * Returns:
 *   { kind: 'intent',  intent: ParsedIntent  }   — text path: route via actionRouter
 *   { kind: 'image',   input: image ExtendedInput } — image path: route via processImageInput()
 *
 * Usage in webhook handlers:
 *   const norm = normaliseInput(extendedInput);
 *   if (norm.kind === 'intent') await routeIntent(norm.intent);
 *   else { const docIntent = await processImageInput(norm.input); ... }
 */
export function normaliseInput(input: ExtendedInput):
  | { kind: 'intent'; intent: ParsedIntent }
  | { kind: 'image'; input: Extract<ExtendedInput, { type: 'image' }> }
{
    if (input.type === 'text') {
        return { kind: 'intent', intent: parseIntent(input.content, input.source) };
    }
    return { kind: 'image', input };
}
