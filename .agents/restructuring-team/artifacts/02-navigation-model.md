# 02 — Navigation Model & Information Architecture (UX Architect)

**Agente:** UX Architect  
**Data:** 2026-07-25  
**Input:** 01-user-flows.md + RESTRUCTURING_DECISION_PACKAGE.md + USABILITY_AUDIT.md + viewRegistry.ts + SecondaryNavDrawer.tsx + BottomNav

---

## Proposta di Navigazione Principale

### Top-Level Navigation (5 voci)

| Posizione | Voce Principale     | Icona             | Scopo principale                     | Mobile | Desktop |
|-----------|---------------------|-------------------|--------------------------------------|--------|---------|
| 1         | **Oggi**            | home              | Dashboard contestuale + AI rapida    | Bottom | Rail    |
| 2         | **Aula**            | groups            | Gestione classe, registro, presenze  | Bottom | Rail    |
| 3         | **Pianificazione**  | design_services   | Lezioni, UDA, materiali              | Bottom | Rail    |
| 4         | **Analisi**         | analytics         | Insight, studenti, report            | Bottom | Rail    |
| 5         | **Assistente**      | auto_awesome      | AI centrale (Copilot + Orbit)        | Bottom | Rail    |

**Rationale:**
- Allineata ai 3 macro-momenti della giornata identificati dallo Strategist.
- Riduce da ~30+ voci a **5 macro-aree**.
- L'**AI ha una voce dedicata** ma può essere invocata contestualmente ovunque.

---

## Information Architecture

### Struttura Gerarchica

```
DocenteDoc AI
├── Oggi (Home evoluta)
│   ├── Dashboard contestuale (mattina/pomeriggio/sera)
│   ├── Quick AI
│   └── Prossimi passi / Suggerimenti
│
├── Aula
│   ├── Classi (Class Selection → Class Dashboard)
│   ├── Registro (bozze + finalizzati)
│   ├── Valutazioni rapide
│   └── Presenze / Note
│
├── Pianificazione
│   ├── Lezioni (ex lessons + UdaPlanner)
│   ├── UDA (consolidato)
│   ├── Materiali & Knowledge Base
│   └── Rubriche & Curriculum
│
├── Analisi
│   ├── Dashboard Competenze
│   ├── Analisi Classe
│   ├── Studenti a Rischio / Improvement
│   └── Reportistica
│
└── Assistente (AI Layer)
    ├── Chat principale (P44.6)
    ├── Proattività (Satellite + Nudges)
    ├── Azioni guidate
    └── Orbit / Decision Cards
```

### Gerarchia secondaria (collassabile)

- Tutte le viste attuali verranno **mappate** sotto queste 5 macro-aree.
- Il `SecondaryNavDrawer` diventerà un **menu secondario** (solo per power user o impostazioni avanzate).

---

## AI Integration Model

**Raccomandazione forte:** **"AI come Layer + Destinazione dedicata"**

### Regole di integrazione

1. **Voce "Assistente"** = accesso diretto all'esperienza AI completa (SmartChat + Orbit + UIBlocks).
2. **FAB / SatelliteCopilot** rimane sempre visibile (proattività).
3. **Ogni macro-area** ha un pulsante contestuale "Chiedi all'AI" che apre il layer AI **pre-caricato** con contesto della vista.
4. Home inline chat viene **rimossa** o ridotta a "Quick prompt".

**Vantaggi:**
- Rispetta l'architettura P44.6.
- Riduce la frammentazione (da 7+ a 2 modi principali).
- Mantiene la proattività.

---

## Mobile / Desktop Strategy

| Piattaforma | Navigazione Principale       | AI Accesso                     | Note |
|-------------|------------------------------|--------------------------------|------|
| **Mobile**  | Bottom Navigation (5 voci)   | FAB Satellite + Assistente tab | Ottimizzato per uso in classe |
| **Desktop** | Navigation Rail persistente (5 voci) | Sidebar AI o pannello espandibile | Più spazio per insight |
| **Entrambi**| Drawer secondario (opzionale) | Sempre disponibile via FAB    | Per impostazioni avanzate |

**Cambiamento chiave:**
- Il drawer attuale (30+ voci) diventa **secondario** e si apre solo da un menu "Altro".
- La logica di `BottomNav` viene estesa al desktop come Rail.

---

## Viste da Consolidare / Eliminare / Riorganizzare

### Da Consolidare sotto **Pianificazione**

| Vista attuale          | Nuova collocazione     | Azione |
|------------------------|------------------------|--------|
| `lessons`              | Pianificazione         | Mantieni |
| `uda`                  | Pianificazione         | Mantieni |
| `rubriche`             | Pianificazione         | Mantieni |
| `didattica-inclusiva`  | Pianificazione         | Mantieni |
| `knowledge-base`       | Pianificazione         | Mantieni |
| `studio`               | Pianificazione         | Rinomina in "Materiali AI" |
| `curriculum-manager`   | Pianificazione         | Mantieni |
| `competency-levels`    | Pianificazione         | Sposta in Analisi |

### Da Consolidare sotto **Aula**

| Vista attuale               | Nuova collocazione |
|-----------------------------|--------------------|
| `aula` + `aula-session`     | Aula               |
| `register`                  | Aula               |
| `evaluations`               | Aula               |
| `studenti`                  | Aula               |

### Da Consolidare sotto **Analisi**

| Vista attuale                    | Nuova collocazione |
|----------------------------------|--------------------|
| `analytics`                      | Analisi            |
| `class-competency-dashboard`     | Analisi            |
| `improvement-guide`              | Analisi            |
| `consiglio-di-classe`            | Analisi            |
| `reportistica`                   | Analisi            |

### Da de-enfatizzare o rimuovere dal menu principale

- `live-assistant` → Accessibile solo da Aula o via AI
- `copilot` (vecchia) → Fusa dentro "Assistente"
- `teacher-dashboard`, `workspace` → Valutare se mantenere come viste specializzate

### Viste Speciali (non nel menu principale)

- `student-workspace` / `student-dashboard` → Rimangono separate (modalità studente)
- `aula-session` → Flusso interno ad "Aula"

---

## Riepilogo Cambiamenti

| Aspetto                    | Prima                          | Dopo (Proposta)             |
|---------------------------|--------------------------------|-----------------------------|
| Voci navigazione principale | 5 + drawer enorme (30+)        | 5 voci pulite               |
| Entry point AI            | 7+                             | 2 (Assistente + FAB)        |
| Home                      | Hub densissimo                 | Dashboard contestuale       |
| Drawer                      | Primario                       | Secondario                  |
| Mobile/Desktop coerenza   | Scarsa                         | Alta (Rail + Bottom)        |

---

**Prossimo agente consigliato:** Cognitive Guardian (per validare l'integrazione AI con P44.6).