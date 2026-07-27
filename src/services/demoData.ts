import { KnowledgeBaseEntry, Studente, Uda, Lezione, Slot, Valutazione, ValutazioneCompetenza, EventoCalendario, Rubrica, PianoInclusione } from '../types'; // FIX: Updated import path to types
import { COMPENSATORY_MEASURES } from '../constants/demoData';

// --- STUDENTS (Classe 3A - Eterogenea) ---
const students: Studente[] = [
    { id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '3A', dataNascita: '2010-05-12' },
    { id: 's2', nome: 'Giulia', cognome: 'Bianchi', classe: '3A', dataNascita: '2010-08-23' },
    { id: 's3', nome: 'Luca', cognome: 'Verdi', classe: '3A', dataNascita: '2010-01-15' },
    { id: 's4', nome: 'Sofia', cognome: 'Neri', classe: '3A', dataNascita: '2010-11-02' }, // Eccellente
    { id: 's5', nome: 'Alessandro', cognome: 'Gialli', classe: '3A', dataNascita: '2010-03-30' }, // BES
    { id: 's6', nome: 'Martina', cognome: 'Blu', classe: '3A', dataNascita: '2010-07-19' },
    { id: 's7', nome: 'Francesco', cognome: 'Arancio', classe: '3A', dataNascita: '2010-09-10' }, // DSA
    { id: 's8', nome: 'Chiara', cognome: 'Viola', classe: '3A', dataNascita: '2010-12-05' },
];

// --- UDA (Programmazione Interdisciplinare) ---
const uda: Uda[] = [
    {
        id: 'uda-1',
        title: 'Il Risorgimento Italiano',
        classe: '3A',
        materia: 'Storia',
        introduction: 'Un percorso attraverso le tappe fondamentali dell\'unità d\'Italia, dai moti del \'20 alla presa di Roma.',
        finalProduct: 'Podcast storico a gruppi',
        competencyIds: ['comp-key-6', 'comp-dig-2'], // Cittadinanza, Digitale
        phases: [
            { id: 'ph1', title: 'Il contesto europeo', description: 'La Restaurazione e i primi moti', activities: 'Lezione partecipata con mappe', duration: '3' },
            { id: 'ph2', title: 'I Protagonisti', description: 'Cavour, Garibaldi, Mazzini: confronto politico', activities: 'Debate in classe', duration: '4' },
            { id: 'ph3', title: 'Le Guerre d\'Indipendenza', description: 'Analisi delle campagne militari e diplomatiche', activities: 'Timeline interattiva', duration: '5' }
        ],
        evaluation: 'Verifica orale e valutazione prodotto multimediale',
        tools: 'Libro di testo, Documentari Rai Storia, Canva',
        startDate: '2023-10-01',
        endDate: '2023-11-30',
        startPos: 0,
        width: 200,
        color: 'var(--md-sys-color-primary-container)',
        borderColor: 'var(--md-sys-color-primary)',
        textColor: 'var(--md-sys-color-on-primary-container)'
    },
    {
        id: 'uda-2',
        title: 'Energia e Sostenibilità',
        classe: '3A',
        materia: 'Tecnologia',
        introduction: 'Analisi delle fonti rinnovabili e non rinnovabili, con focus sull\'Agenda 2030.',
        finalProduct: 'Modellino di casa ecosostenibile',
        competencyIds: ['comp-key-3', 'comp-civ-2'], // STEM, Sviluppo Sostenibile
        phases: [
            { id: 'ph2-1', title: 'Fonti Rinnovabili', description: 'Solare, Eolico, Idroelettrico', activities: 'Schede tecniche e video', duration: '4' },
            { id: 'ph2-2', title: 'Progettazione Green', description: 'Principi di bioedilizia', activities: 'Disegno tecnico (CAD o manuale)', duration: '6' }
        ],
        evaluation: 'Valutazione tavole tecniche e interrogazione',
        tools: 'Kit disegno, Software CAD, Schede tecniche',
        startDate: '2023-10-15',
        endDate: '2023-12-15',
        startPos: 0,
        width: 200,
        color: 'var(--md-sys-color-secondary-container)',
        borderColor: 'var(--md-sys-color-secondary)',
        textColor: 'var(--md-sys-color-on-secondary-container)'
    },
    {
        id: 'uda-3',
        title: 'Il Continente Asiatico',
        classe: '3A',
        materia: 'Geografia',
        introduction: 'Studio fisico, politico ed economico dell\'Asia.',
        finalProduct: 'Brochure turistica di un paese asiatico',
        competencyIds: ['comp-key-8', 'comp-dig-3'], // Consapevolezza culturale, Creazione contenuti
        phases: [
            { id: 'ph3-1', title: 'Aspetti Fisici', description: 'Orografia e idrografia', activities: 'Lettura carte tematiche', duration: '3' },
            { id: 'ph3-2', title: 'Le Tigri Asiatiche', description: 'Economia e sviluppo', activities: 'Analisi dati statistici', duration: '3' }
        ],
        evaluation: 'Test scritto e valutazione brochure',
        tools: 'Atlante, Google Earth',
        startDate: '2023-11-01',
        endDate: '2023-12-20',
        startPos: 0,
        width: 200,
        color: 'var(--md-sys-color-tertiary-container)',
        borderColor: 'var(--md-sys-color-tertiary)',
        textColor: 'var(--md-sys-color-on-tertiary-container)'
    }
];

// --- LESSONS (Archivio Didattico) ---
const lessons: Record<string, Lezione> = {
    // STORIA
    'les-s1': { id: 'les-s1', classe: '3A', materia: 'Storia', contenuto: 'Restaurazione e Congresso di Vienna', svolta: true, unitaDiApprendimento: 'Il Risorgimento Italiano', tipoLezione: 'Teoria', nota: 'Classe attenta, approfondire questione confini.' },
    'les-s2': { id: 'les-s2', classe: '3A', materia: 'Storia', contenuto: 'I Moti del 1820-21 e 1830', svolta: true, unitaDiApprendimento: 'Il Risorgimento Italiano', tipoLezione: 'Teoria' },
    'les-s3': { id: 'les-s3', classe: '3A', materia: 'Storia', contenuto: 'Il 1848 in Europa e in Italia', svolta: true, unitaDiApprendimento: 'Il Risorgimento Italiano', tipoLezione: 'Teoria' },
    'les-s4': { id: 'les-s4', classe: '3A', materia: 'Storia', contenuto: 'Verifica Sommativa: Moti e 1848', svolta: true, tipoLezione: 'Verifica', obiettivi: 'Comprendere strategia diplomatica' },
    'les-s5': { id: 'les-s5', classe: '3A', materia: 'Storia', contenuto: 'Cavour e la diplomazia piemontese', svolta: false, unitaDiApprendimento: 'Il Risorgimento Italiano', tipoLezione: 'Teoria', obiettivi: 'Comprendere strategia diplomatica' },

    // GEOGRAFIA
    'les-g1': { id: 'les-g1', classe: '3A', materia: 'Geografia', contenuto: 'Asia: Inquadramento fisico', svolta: true, unitaDiApprendimento: 'Il Continente Asiatico', tipoLezione: 'Teoria' },
    'les-g2': { id: 'les-g2', classe: '3A', materia: 'Geografia', contenuto: 'Climi e biomi dell\'Asia', svolta: false, unitaDiApprendimento: 'Il Continente Asiatico', tipoLezione: 'Teoria' },
    'les-g3': { id: 'les-g3', classe: '3A', materia: 'Geografia', contenuto: 'Laboratorio: Lettura carte tematiche', svolta: false, unitaDiApprendimento: 'Il Continente Asiatico', tipoLezione: 'Laboratorio', obiettivi: 'Saper leggere carte fisiche e politiche' },

    // TECNOLOGIA
    'les-t1': { id: 'les-t1', classe: '3A', materia: 'Tecnologia', contenuto: 'Introduzione all\'Energia', svolta: true, unitaDiApprendimento: 'Energia e Sostenibilità', tipoLezione: 'Teoria' },
    'les-t2': { id: 'les-t2', classe: '3A', materia: 'Tecnologia', contenuto: 'Disegno: Proiezioni Ortogonali Solidi', svolta: true, tipoLezione: 'Disegno', compiti: 'Completare tavola n.3' },
    'les-t3': { id: 'les-t3', classe: '3A', materia: 'Tecnologia', contenuto: 'Energia Solare e Fotovoltaico', svolta: false, unitaDiApprendimento: 'Energia e Sostenibilità', tipoLezione: 'Teoria' },
    'les-t4': { id: 'les-t4', classe: '3A', materia: 'Tecnologia', contenuto: 'Laboratorio: Costruzione circuito semplice', svolta: false, tipoLezione: 'Laboratorio' },

    // ED CIVICA
    'les-c1': { id: 'les-c1', classe: '3A', materia: 'Ed. Civica', contenuto: 'La Costituzione: Principi Fondamentali', svolta: false, tipoLezione: 'Teoria', obiettivi: 'Analisi art. 1-12' }
};

// --- SLOTS (Orario Settimanale) ---
const slots: Record<string, Slot> = {
    // Lunedì
    'Lunedì-08:00': { giorno: 'Lunedì', ora: '08:00', classe: '3A', materia: 'Storia', lezioneId: 'les-s5' },
    'Lunedì-09:00': { giorno: 'Lunedì', ora: '09:00', classe: '3A', materia: 'Geografia', lezioneId: 'les-g2' },
    'Lunedì-11:00': { giorno: 'Lunedì', ora: '11:00', classe: '3A', materia: 'Tecnologia' }, // Slot vuoto (da pianificare)

    // Martedì
    'Martedì-09:00': { giorno: 'Martedì', ora: '09:00', classe: '3A', materia: 'Tecnologia', lezioneId: 'les-t3' },
    'Martedì-10:00': { giorno: 'Martedì', ora: '10:00', classe: '3A', materia: 'Ed. Civica', lezioneId: 'les-c1' },

    // Mercoledì
    'Mercoledì-08:00': { giorno: 'Mercoledì', ora: '08:00', classe: '3A', materia: 'Storia' },
    'Mercoledì-10:00': { giorno: 'Mercoledì', ora: '10:00', classe: '3A', materia: 'Tecnologia' },

    // Giovedì
    'Giovedì-09:00': { giorno: 'Giovedì', ora: '09:00', classe: '3A', materia: 'Geografia', lezioneId: 'les-g3' },
    'Giovedì-11:00': { giorno: 'Giovedì', ora: '11:00', classe: '3A', materia: 'Storia' },

    // Venerdì
    'Venerdì-08:00': { giorno: 'Venerdì', ora: '08:00', classe: '3A', materia: 'Tecnologia', lezioneId: 'les-t4' },
    'Venerdì-09:00': { giorno: 'Venerdì', ora: '09:00', classe: '3A', materia: 'Tecnologia' }
};

// --- EVALUATIONS (Storico Voti) ---
// Date recenti ma passate per simulare storico
const evaluations: Valutazione[] = [
    // Verifica Storia (Scritto) - 15 Ott
    { id: 'ev-1', studenteId: 's1', materia: 'Storia', data: '2023-10-15', tipo: 'Verifica', voto: '8', argomento: 'Moti del 48' },
    { id: 'ev-2', studenteId: 's2', materia: 'Storia', data: '2023-10-15', tipo: 'Verifica', voto: '7', argomento: 'Moti del 48' },
    { id: 'ev-3', studenteId: 's3', materia: 'Storia', data: '2023-10-15', tipo: 'Verifica', voto: '6', argomento: 'Moti del 48' },
    { id: 'ev-4', studenteId: 's4', materia: 'Storia', data: '2023-10-15', tipo: 'Verifica', voto: '9.5', argomento: 'Moti del 48' },
    { id: 'ev-5', studenteId: 's5', materia: 'Storia', data: '2023-10-15', tipo: 'Verifica', voto: '5', argomento: 'Moti del 48', note: 'Difficoltà esposizione scritta' },

    // Interrogazioni Geografia - 20 Ott
    { id: 'ev-6', studenteId: 's1', materia: 'Geografia', data: '2023-10-20', tipo: 'Orale', voto: '8.5', argomento: 'Asia Fisica' },
    { id: 'ev-7', studenteId: 's6', materia: 'Geografia', data: '2023-10-20', tipo: 'Orale', voto: '7', argomento: 'Asia Fisica' },

    // Tavole Tecnologia - 25 Ott
    { id: 'ev-8', studenteId: 's2', materia: 'Tecnologia', data: '2023-10-25', tipo: 'Pratico', voto: '9', argomento: 'Tavola 2: Assonometria' },
    { id: 'ev-9', studenteId: 's5', materia: 'Tecnologia', data: '2023-10-25', tipo: 'Pratico', voto: '6.5', argomento: 'Tavola 2: Assonometria', note: 'Tratto da migliorare' },
    { id: 'ev-10', studenteId: 's7', materia: 'Tecnologia', data: '2023-10-25', tipo: 'Pratico', voto: '6', argomento: 'Tavola 2: Assonometria' },
];

// --- COMPETENCY EVALUATIONS ---
const competencyEvaluations: ValutazioneCompetenza[] = [
    { id: 'cev-1', studenteId: 's1', competenzaId: 'comp-key-6', livelloId: 'ck6-b', materia: 'Storia', data: '2023-10-15', provaId: 'ev-1' },
    { id: 'cev-2', studenteId: 's4', competenzaId: 'comp-key-6', livelloId: 'ck6-a', materia: 'Storia', data: '2023-10-15', provaId: 'ev-4' },
    { id: 'cev-3', studenteId: 's5', competenzaId: 'comp-key-6', livelloId: 'ck6-d', materia: 'Storia', data: '2023-10-15', provaId: 'ev-5' },
    { id: 'cev-4', studenteId: 's2', competenzaId: 'comp-key-3', livelloId: 'ck3-a', materia: 'Tecnologia', data: '2023-10-25', provaId: 'ev-8' }
];

// --- EVENTS ---
const events: EventoCalendario[] = [
    { id: 'evt-1', titolo: 'Consiglio di Classe 3A', data: '2023-11-15', tipo: 'consiglio', oraInizio: '15:00', oraFine: '17:00', descrizione: 'Andamento didattico disciplinare' },
    { id: 'evt-2', titolo: 'Scadenza PTOF', data: '2023-10-30', tipo: 'scadenza' },
    { id: 'evt-3', titolo: 'Colloqui Genitori', data: '2023-12-05', tipo: 'impegno', oraInizio: '16:00' },
    { id: 'evt-4', titolo: 'Corso Formazione AI', data: '2023-11-20', tipo: 'formazione', oraInizio: '14:30' }
];

// --- RUBRICHE ---
const rubriche: Rubrica[] = [
    {
        id: 'rub-1',
        titolo: 'Esposizione Orale',
        criteri: [
            {
                competenzaId: 'comp-key-1',
                indicatori: [
                    { livelloId: 'ck1-a', descrizione: 'Esposizione fluida, lessico specifico ricco e appropriato. Argomentazione solida.' },
                    { livelloId: 'ck1-b', descrizione: 'Esposizione chiara, lessico corretto. Buona argomentazione.' },
                    { livelloId: 'ck1-c', descrizione: 'Esposizione essenziale, qualche incertezza lessicale.' },
                    { livelloId: 'ck1-d', descrizione: 'Esposizione frammentaria, lessico povero. Necessita guida.' }
                ]
            }
        ]
    },
    {
        id: 'rub-2',
        titolo: 'Elaborato Grafico (Tecnologia)',
        criteri: [
            {
                competenzaId: 'comp-key-3',
                indicatori: [
                    { livelloId: 'ck3-a', descrizione: 'Tavola completa, precisa, tratto pulito e conforme norme UNI.' },
                    { livelloId: 'ck3-c', descrizione: 'Tavola completa ma con imprecisioni nel tratto o nella quotatura.' }
                ]
            }
        ]
    }
];

// --- PIANI INCLUSIONE ---
const pianiInclusione: Record<string, PianoInclusione> = {
    's5': {
        id: 's5',
        puntiDiForza: 'Buona capacità logica, interesse per le attività pratiche e laboratoriali.',
        areeDiIntervento: 'Difficoltà nella produzione scritta estesa e nell\'organizzazione autonoma dello studio.',
        misureCompensative: `${COMPENSATORY_MEASURES.CONCEPT_MAPS}, ${COMPENSATORY_MEASURES.COMPUTER_USE}, ${COMPENSATORY_MEASURES.EXTRA_TIME_30}.`,
        misureDispensative: 'Lettura ad alta voce in classe, copiatura dalla lavagna, presa appunti.',
        criteriValutazionePersonalizzati: 'Valutazione focalizzata sui contenuti più che sulla forma ortografica. Prove orali a compensazione.'
    },
    's7': {
        id: 's7',
        puntiDiForza: 'Creatività, partecipazione orale.',
        areeDiIntervento: 'Discalculia lieve, difficoltà memorizzazione date.',
        misureCompensative: 'Tavola pitagorica, calcolatrice, linea del tempo.',
        misureDispensative: 'Memorizzazione formule complesse.',
        criteriValutazionePersonalizzati: 'Privilegiare il ragionamento rispetto al calcolo puro.'
    }
};

// --- KNOWLEDGE BASE ---
const knowledgeBase: KnowledgeBaseEntry[] = [
    {
        id: "kb-prog-1",
        fileName: "Programmazione_Storia_3A.pdf",
        content: "PROGRAMMAZIONE DISCIPLINARE STORIA CLASSE 3A\n\nOBIETTIVI:\n- Conoscere gli eventi fondamentali del XIX e XX secolo.\n- Saper analizzare le fonti storiche.\n\nCONTENUTI:\n1. Il Risorgimento Italiano.\n2. L'Imperialismo.\n3. La Prima Guerra Mondiale.\n\nMETODOLOGIA:\nLezione frontale, Cooperative Learning, Flipped Classroom.",
        category: "programmazione",
        isGenerated: false
    },
    {
        id: "kb-tech-design",
        fileName: "Architettura_Design_System_M3.md",
        content: `# Documento Tecnico: Architettura del Design System di OrarioDoc AI

**Versione:** 3.5 (M3 Expressive + Theme Studio)
**Riferimento:** Design System & Theming Engine

## 1. Introduzione
L'interfaccia utente di OrarioDoc AI è basata su un motore proprietario leggero che implementa i principi del **Material Design 3 (M3) Expressive**.

## 2. Architettura Modulare CSS
Lo stile è suddiviso in 5 livelli logici:
1.  **\`theme.css\` (Fondamenta):** Definisce i Token primitivi (Colori, Tipografia, Spaziature).
2.  **\`layout.css\` (Struttura):** Griglia app, header e sidebar.
3.  **\`components.css\` (Atomi):** Bottoni M3, Input "Filled", Card, Dialoghi.
4.  **\`modules.css\` (Organismi):** Widget complessi (Timeline Gantt, Matrice Orario, Analytics).
5.  **\`logo.css\` (Identità):** Logo vettoriale e animazioni "Big Bang".

## 3. Theme Studio AI
Il sistema utilizza un motore generativo per creare temi personalizzati.
- L'utente inserisce un prompt (es. "Tramonto Viola").
- L'AI restituisce i codici esadecimali (Primary, Secondary, Tertiary).
- Il motore (\`utils.ts\`) calcola le palette tonali e "tinta" le superfici neutre per armonia.`,
        category: "normativa",
        isGenerated: true
    },
    {
        id: "kb-identity",
        fileName: "OrarioDoc_Brand_Identity.md",
        content: `# Brand Identity: OrarioDoc AI (Final)

## Filosofia del Design: "Geometric Touch"
Il logo definitivo di OrarioDoc AI fonde la stabilità istituzionale con l'innovazione digitale e l'interazione.

## 1. Il Simbolo "D" Geometrico
Il simbolo sostituisce la prima lettera. È un'icona costruita con tre livelli semantici e cromatici:
- **L'Asta (Anchor):** Un rettangolo solido e neutro a sinistra.
- **Il Corpo (Pill):** Una forma morbida centrale del colore Primario.
- **L'Anello (Focus Ring):** Un contorno concentrico esterno che simula il focus.

## 2. La Formula degli Esponenti
Il design esprime una formula di potenziamento:
$$ D^{\\diamond} + Doc^ {AI} $$

*   **Gemma ($\\diamond$):** Simboleggia l'intuizione (in alto a destra).
*   **AI:** Simboleggia l'intelligenza che completa il Docente.

## 3. L'Esperienza "Big Bang"
Toccando il logo, si scatena un'animazione a tutto schermo (Caos -> Implosione -> Ordine).

---
*OrarioDoc AI v3.5*`,
        category: "normativa",
        isGenerated: true
    },
    {
        id: "kb-student-portal",
        fileName: "Analisi_Blog_Classe.md",
        content: `# Analisi Tecnica: Blog Disciplinare & Homework Drop-off

## 1. Filosofia: "La Cattedra Digitale"
Il modulo studente non è un registro parallelo, ma l'equivalente digitale della classe fisica.
*   **Il Blog:** Come la lavagna o il diario di classe, mostra a tutti cosa è stato fatto.
*   **Il Drop-off:** Come consegnare il quaderno sulla cattedra.

## 2. Accesso "Gatekeeper" (Zero-Password)
1.  **Login:** Lo studente inserisce *Nome*, *Cognome* e *Data di Nascita*.
2.  **Match:** Il sistema locale verifica l'anagrafica.
3.  **Entrata:** Si apre il **Blog della Classe**.

## 3. UX Docente: L'Inbox e la Valutazione
Il docente non va a cercare i compiti nei profili, ma li trova in una "Posta in arrivo".
1.  **Inbox:** Lista "Elaborati da Valutare".
2.  **Valutazione Rapida:** Griglia laterale con Voto e Competenze.
3.  **Feedback:** Il voto viene salvato nel DB locale.
`,
        category: "programmazione",
        isGenerated: true
    },
    {
        id: "kb-tech-bridge",
        fileName: "Progetto_Estensione_Chrome_Bridge.md",
        content: `
# Progetto Tecnico: OrarioDoc Bridge (Estensione Chrome)

Questa guida descrive come creare l'estensione **OrarioDoc Bridge** per automatizzare il trasferimento dati da OrarioDoc AI al registro elettronico (Argo/Didup/Axios).

## 1. Struttura Cartelle
Crea una cartella \`orariodoc-bridge\` sul tuo computer e inserisci i file del manifest e i JS.

## 2. Installazione
1. Apri Chrome e vai su \`chrome://extensions\`.
2. Attiva la "Modalità sviluppatore" (in alto a destra).
3. Clicca "Carica estensione non pacchettizzata".
4. Seleziona la cartella \`orariodoc-bridge\`.

## 3. Utilizzo
1. In OrarioDoc, vai su **Aula** -> **Copia per Registro**.
2. Copia il codice JSON.
3. Vai sul registro elettronico, apri l'estensione e clicca "Compila".
`,
        category: "normativa",
        isGenerated: true
    }
];

export const DEMO_DATA = {
    students,
    uda,
    lessons,
    slots,
    evaluations,
    competencyEvaluations,
    eventi: events,
    rubriche,
    pianiInclusione,
    knowledgeBase
};

