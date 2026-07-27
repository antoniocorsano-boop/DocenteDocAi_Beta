export const getTechnicalDocumentContentPrompt = (): string => `
TASK: Generazione schema tecnico per manuale utente.
Genera un oggetto JSON che descriva le funzionalità principali di un'applicazione per docenti.
`;

export const getAcademicEssayContentPrompt = (): string => `
TASK: Generazione saggio accademico su innovazione didattica.
Genera un oggetto JSON con titolo, abstract e 3 paragrafi principali.
`;

export const getMarkdownReportPrompt = (type: string, data: Record<string, unknown>): string => `
TASK: Generazione Report Professionale in Markdown.
TIPO: ${type}
DATI: ${JSON.stringify(data)}

Crea un report ben strutturato con titoli, tabelle e liste.
`;

export const getDocumentTablePrompt = (description: string): string => `
TASK: Generazione Tabella HTML.
DESCRIZIONE: ${description}

Genera una tabella HTML ben formattata.
`;

