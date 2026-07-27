# 01 — User Flows & Modello Mentale (Lead Strategist)

**Agente:** Lead Strategist  
**Data:** 2026-07-25  
**Input analizzati:** RESTRUCTURING_DECISION_PACKAGE.md, USABILITY_AUDIT.md, codebase structure, flussi impliciti nel progetto

---

## Modello Mentale Target

**Frase che il docente dovrebbe poter dire dopo la ristrutturazione:**

> «DocenteDoc AI è il mio **assistente personale intelligente** che mi segue durante tutta la giornata scolastica. Mi aiuta a gestire la classe, a preparare le lezioni e a capire come stanno andando gli studenti — tutto da un unico posto, in modo naturale e senza dover pensare a "dove vado".»

**Caratteristiche chiave del modello mentale desiderato:**
- **Unico assistente**, non una suite di tool
- **Contestuale**: sa sempre dove sono (aula, pianificazione, fine giornata)
- **Proattivo ma non invadente**
- **Riduce il carico cognitivo** invece di aggiungerne
- **AI come "collega silenzioso"** più che come destinazione separata

---

## Flussi Core (priorità)

Basati sull'analisi della codebase e sui casi d'uso tipici di un docente italiano:

| # | Flusso Core                          | Frequenza | Dolore Attuale                          | Priorità |
|---|--------------------------------------|---------|-----------------------------------------|----------|
| 1 | **Gestione quotidiana in classe**    | Giornaliera | Troppi posti per registro/presenze/valutazioni | **Alta** |
| 2 | **Preparazione lezione / UDA**       | Settimanale | Hub multipli (progettazione, lessons, uda, rubriche) | **Alta** |
| 3 | **Interazione con l'AI**             | Giornaliera | 7+ entry point diversi                  | **Critica** |
| 4 | **Monitoraggio studenti e classe**   | Settimanale | Analytics, competency, improvement, copilot sparsi | **Alta** |
| 5 | **Attività amministrative**          | Mensile   | Reportistica, consiglio di classe, orientamento | Media |
| 6 | **Inclusione e BES**                 | Settimanale | Didattica inclusiva isolata             | Media |
| 7 | **Fine giornata / riflessione**      | Giornaliera | Manca un momento di sintesi intelligente | Media |

---

## Principi Guida Utente

1. **Un solo posto per l'AI**  
   L'intelligenza artificiale deve essere percepita come una cosa sola, accessibile in modo naturale da qualsiasi contesto.

2. **Navigazione prevedibile**  
   Massimo 5-6 voci principali. Il docente non deve mai chiedersi "dove l'ho vista l'ultima volta?".

3. **L'AI segue me, non il contrario**  
   L'assistente deve adattarsi al momento della giornata e al contesto (mattina = registro, pomeriggio = progettazione, sera = analisi).

4. **Riduzione della densità**  
   La Home attuale è troppo ricca. Deve diventare un punto di arrivo leggero, non un hub di scoperta.

5. **Progressione chiara**  
   Il docente deve sempre capire "dove sono" e "cosa posso fare ora" (soprattutto per utenti esploratori vs esperti).

6. **AI come layer, non come destinazione**  
   Preferibilmente l'AI deve poter essere invocata contestualmente senza cambiare "schermata".

7. **Coerenza tra mobile e desktop**  
   Il modello mentale deve funzionare allo stesso modo su telefono (in classe) e computer (a casa).

---

## User Journey Map (sintetica) — Giorno Tipo

### Mattina (7:30 – 13:00) — "In aula"

**Momenti critici:**
- Arrivo → "Cosa devo fare oggi?"
- Inizio lezione → Apertura rapido registro / presenze
- Durante la lezione → Annotazioni veloci, valutazioni orali, AI per domande
- Fine lezione → Chiusura bozza registro

**Bisogno dominante:** Velocità + minimalismo cognitivo

### Pomeriggio (14:00 – 18:00) — "Pianificazione e preparazione"

**Momenti critici:**
- Preparazione lezioni successive
- Creazione / revisione UDA
- Generazione materiali con AI
- Programmazione settimanale

**Bisogno dominante:** Profondità + supporto creativo dell'AI

### Sera / Fine giornata (18:30 – 21:00) — "Riflessione"

**Momenti critici:**
- Analisi di come è andata la classe
- Verifica studenti a rischio
- Preparazione consiglio di classe / report
- Pianificazione del giorno dopo

**Bisogno dominante:** Visione d'insieme + insight dall'AI

### Momenti trasversali (sempre)
- Richiesta aiuto rapido all'AI ("spiegami...", "genera...", "analizza...")
- Ricezione di suggerimenti proattivi

---

## Conclusioni Strategiche (per gli altri agenti)

- Il **modello mentale** deve spostarsi da "app scolastica con AI" a **"Assistente Docente AI"**.
- L'**AI deve essere il filo conduttore** tra tutti i flussi, non una feature tra tante.
- La navigazione deve supportare i **3 macro-momenti** della giornata (In aula / Pianificazione / Riflessione).
- La Home deve diventare **più leggera** e orientata al momento del giorno.
- È necessario decidere se il "Copilot/Satellite" diventa **il** modo principale di interagire con l'AI o solo uno dei modi.

---

**Prossimo agente consigliato:** UX Architect (per tradurre questi flussi in una Information Architecture concreta).