

export const SYSTEM_MANUAL_ID = 'orariodoc-system-manual-v4.0-rc1';
export const SYSTEM_MANUAL_FILENAME = 'OrarioDocAI_Manuale_Operativo_v4.0.md';

export const SYSTEM_MANUAL_CONTENT = `# OrarioDoc AI v4.0 RC1: Manuale Operativo e Tecnico

**Tipologia Documento:** Guida Tecnica & Pedagogica
**Ultimo Aggiornamento:** Versione 4.0 Release Candidate
**Target:** Docenti, Animatori Digitali, DPO, Dirigenti.

---

## 1. Visione e Architettura del Sistema

### 1.1 Il Paradigma "Local-First" (Sovranità del Dato)
OrarioDoc AI rappresenta un cambio di paradigma rispetto ai tradizionali registri elettronici basati su cloud centralizzati (SaaS).
L'applicazione è costruita secondo l'architettura **Local-First**:
*   **Residenza del Dato:** Tutti i dati sensibili (anagrafica studenti, voti, note disciplinari, PEI/PDP) vengono crittografati e salvati **esclusivamente** nella memoria del dispositivo dell'utente (Browser IndexedDB & LocalStorage).
*   **Assenza di Backend Proprietario:** Non esiste un database centrale di "OrarioDoc" che aggrega i dati di migliaia di docenti. Questo elimina alla radice il rischio di *data breach* massivi o accessi non autorizzati da parte del fornitore del servizio.
*   **Operatività Offline:** L'applicazione è pienamente funzionale anche in assenza di connessione internet (ad eccezione delle funzioni generative AI), garantendo continuità didattica in ogni infrastruttura.

### 1.2 Cloud Personale (BYOC - Bring Your Own Cloud)
Per garantire la sicurezza del backup e la portabilità tra dispositivi senza compromettere la privacy, il sistema adotta il modello **BYOC**:
*   **Integrazione Google Drive:** L'app si autentica direttamente con l'account Google del docente tramite protocollo OAuth 2.0.
*   **Scope Ristretto (\`drive.file\`):** L'applicazione richiede e ottiene l'accesso **SOLO** ai file che essa stessa ha creato. Non ha tecnicamente la possibilità di leggere email, foto o altri documenti presenti nel Drive dell'utente.
*   **Backup Monolitico:** Il salvataggio genera un file \`OrarioDoc_Backup.json\` che funge da capsula del tempo, contenente l'intero stato dell'applicazione.

---

## 2. Centro Operativo: Il Cuore del Flusso di Lavoro

L'icona **Fulmine (⚡)** nella barra superiore apre il **Centro Operativo**, un hub decisionale che centralizza le funzioni in base al contesto e non alla tipologia di file.

### 2.1 Categorie di Processo
1.  **Quotidianità (Viola - Teaching):**
    *   Strumenti per la gestione dell'aula in tempo reale.
    *   *Esempio:* "Lezione Rapida" per supplenze, "Assistente Live" per comandi vocali.
2.  **Pianificazione (Teal - Strategy):**
    *   Strumenti per la progettazione a lungo termine.
    *   *Esempio:* "Wizard Annuale" per il Gantt delle UDA, "Studio AI" per la creazione materiali.
3.  **Sistema (Grigio - Config):**
    *   Manutenzione e setup.
    *   *Esempio:* Importazione studenti CSV, Configurazione orario, Gestione Backup.

### 2.2 Suggerimenti Proattivi (AI Agent)
Il sistema monitora costantemente lo stato dei dati (es. "Voti mancanti", "Scadenze PTOF vicine", "UDA non completate") e fa apparire un **badge di notifica** sul Fulmine. Cliccandolo, l'AI propone l'azione correttiva immediata (es. "Pianifica Verifica").

---

## 3. Gestione Didattica: I Processi Chiave

### 3.1 Progettazione (Dall'Idea al Documento)
Il modulo **Progettazione Hub** sostituisce la frammentazione di file Word sparsi.
*   **Knowledge Base (RAG):** Il docente carica i documenti di riferimento (PTOF, Linee Guida, Libri di testo). Questi file vengono indicizzati localmente.
*   **Wizard UDA:** L'AI analizza la Knowledge Base e propone una struttura per le Unità di Apprendimento (Titolo, Fasi, Competenze, Tempi).
*   **Validazione Verticale:** Il sistema incrocia l'UDA con il curricolo caricato per verificare la coerenza degli obiettivi.
*   **Output:** Esportazione in formato **DOCX nativo** (perfettamente compatibile con Word/Docs) pronto per il protocollo.

### 3.2 L'Aula (Live Teaching)
Durante la lezione, l'interfaccia si trasforma per ridurre le distrazioni ("Focus Mode").
*   **Registro Smart:** Gestione presenze e "Diario di Bordo" integrati.
*   **Assistente Vocale 2.0:** Utilizza il microfono per impartire comandi complessi ("Segna Rossi assente e metti una nota a tutta la classe per il comportamento"). L'AI trascrive, interpreta l'intento ed esegue l'azione nel database.
*   **Strumenti:** Timer, Estrazione Casuale, Badges di partecipazione (Gamification per studenti).

### 3.3 Valutazione (Oltre la Media Aritmetica)
OrarioDoc implementa la **Valutazione Unificata**:
*   Ogni prova può avere simultaneamente un **Voto Numerico** (per la media curricolare) e una valutazione dei **Livelli di Competenza** (A-D, per la certificazione delle competenze).
*   **Analytics Hub:** Non semplici tabelle, ma grafici Radar e Trend Lineari che permettono di visualizzare i progressi dello studente nel tempo e rispetto alla classe.

---

## 4. Intelligenza Artificiale e Studio AI

L'AI non è un semplice chatbot, ma un motore integrato nei processi.

### 4.1 Studio AI (Generazione Contenuti)
Un laboratorio creativo dove il docente può selezionare fonti dalla propria Knowledge Base e chiedere all'AI di:
*   Generare **Verifiche** (Scelta multipla, Aperta) con griglia di correzione.
*   Creare **Slide** o schemi per lezioni.
*   Produrre **Immagini** didattiche originali.
*   **Analisi Circolari:** Caricando un PDF di una circolare, l'AI estrae automaticamente le date, le scadenze e gli eventi, proponendo di aggiungerli al Calendario.

### 4.2 Didattica Inclusiva (AI Advisor)
Nel modulo PEI/PDP, l'AI agisce come consulente pedagogico:
*   Analizza l'andamento dello studente.
*   Suggerisce strategie compensative e dispensative specifiche (non generiche).
*   Aiuta a redigere le sezioni descrittive dei documenti ufficiali.

---

## 5. Portale Studente (Kiosk Mode)

Una funzionalità per la trasparenza e la condivisione in classe (es. alla LIM).
*   **Accesso Sicuro:** Modalità "Sola Lettura".
*   **Funzioni:** Gli studenti possono vedere il materiale didattico assegnato, il programma svolto e i compiti.
*   **Privacy:** In questa modalità, voti, note personali e dati sensibili sono oscurati.

---

## 6. Riferimenti Normativi e Sicurezza

*   **GDPR (Reg. UE 2016/679):** L'architettura rispetta i principi di *Privacy by Design* e *Minimizzazione dei dati*. Il Titolare del Trattamento rimane il docente (o la scuola, se adottato istituzionalmente), poiché il fornitore del software non ha accesso ai dati.
*   **Backup:** Si consiglia di attivare la sincronizzazione con Google Drive per evitare la perdita di dati in caso di smarrimento del dispositivo.
*   **Export:** I dati sono sempre esportabili in formati aperti (CSV, JSON, PDF, DOCX) garantendo la reversibilità e l'assenza di *vendor lock-in*.

---
*Progettato per supportare l'autonomia professionale del docente.*
`;
