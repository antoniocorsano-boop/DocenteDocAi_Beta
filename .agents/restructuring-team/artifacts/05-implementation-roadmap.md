# 05 — Implementation Roadmap (Implementation Planner)

**Agente:** Implementation Planner  
**Data:** 2026-07-25

---

## Fasi Proposte

| Fase | Nome                          | Obiettivo Principale                          | Durata Stimata | Rischio |
|------|-------------------------------|-----------------------------------------------|----------------|---------|
| 0    | Consolidamento AI             | Ridurre entry point AI a 2                    | 1-2 sprint     | Medio   |
| 1    | Nuova Navigazione Core        | 5 voci + Rail + Drawer secondario             | 2 sprint       | Medio   |
| 2    | Integrazione AI Contestuale   | "Chiedi all'AI" in ogni macro-area            | 1 sprint       | Basso   |
| 3    | Consolidamento Contenuti      | Riorganizzare viste sotto le 5 aree           | 2 sprint       | Medio   |
| 4    | Pulizia e Ottimizzazione      | Rimozione codice morto + test                 | 1 sprint       | Basso   |

---

## Breakdown per Fase

### Fase 0 — Consolidamento AI (Critica)

**Task:**
- Rendere la vista `copilot` → `assistente`
- Spostare `SmartChat` + `OrbitDock` nella nuova vista "Assistente"
- Deprecare Home inline chat
- Consolidare OperationsCenter in azioni guidate dentro Assistente
- Mantenere SatelliteCopilot come unico FAB proattivo

**Deliverable:**
- Vista "Assistente" funzionante con P44.6 completo
- Solo 2 modi per accedere all'AI

**Dipendenze:** Nessuna

### Fase 1 — Nuova Navigazione Core

**Task:**
- Creare `AppNavigationRail.tsx` (desktop)
- Estendere `BottomNav` a 5 voci (Oggi, Aula, Pianificazione, Analisi, Assistente)
- Trasformare `SecondaryNavDrawer` in menu secondario
- Aggiornare `useNavigationEngine` e `ViewManager` per le nuove macro-view
- Implementare mapping delle viste esistenti

**Deliverable:**
- Navigazione unificata a 5 voci su mobile e desktop

**Dipendenze:** Fase 0 (per la voce Assistente)

### Fase 2 — Integrazione AI Contestuale

**Task:**
- Aggiungere pulsante "Chiedi all'AI" in ogni macro-area
- Passare contesto (`view`, `selectedClass`, `currentUda`, ecc.) a `useSmartChat`
- Mantenere invarianti UIBlock

**Deliverable:**
- AI contestuale funzionante da qualsiasi vista

### Fase 3 — Consolidamento Contenuti

**Task:**
- Spostare `lessons`, `uda`, `rubriche` sotto Pianificazione (usando `progettazione-hub` come base)
- Spostare analytics, competency, improvement sotto Analisi
- Aggiornare breadcrumb e VIEW_PARENT
- Aggiornare prefetch

### Fase 4 — Pulizia

- Rimuovere viste duplicate
- Aggiornare test E2E
- Audit MD3 finale
- Documentazione aggiornata

---

## Dipendenze Critiche

- Fase 0 → Fase 1 (la voce "Assistente" deve esistere)
- Fase 1 → Fase 2 (serve la nuova navigazione per contestualità)
- `useSmartChat.ts` e `MessageBlockRenderer` → **non toccare** durante nessuna fase

---

## Rischi e Mitigazioni

| Rischio                        | Fase | Mitigazione |
|--------------------------------|------|-------------|
| Rottura gerarchia UIBlock      | 0-2  | Non modificare `MessageBlockRenderer` e `useSmartChat` |
| Regressione navigazione mobile  | 1    | Test E2E estesi + snapshot |
| Perdita di contesto AI         | 2    | Usare viewContext + parametri espliciti |
| Violazione MD3                 | Tutte| Lint + audit dopo ogni PR |
| Resistenza utenti power user   | 3    | Mantenere drawer secondario come fallback |

---

## Criteri di Successo

**Per Fase 0:**
- Solo 2 entry point AI principali
- Tutte le feature cognitive P44.6 funzionanti nella nuova vista Assistente

**Per Fase 1:**
- Navigazione con 5 voci su mobile e desktop
- Nessun utente deve più usare il drawer per le azioni comuni

**Per Fase 2:**
- Da qualsiasi vista si può chiedere all'AI con contesto corretto

**Complessivi:**
- Usabilità Nielsen ≥ 8.0/10 su Consistency
- 0 violazioni MD3
- Tutti i test cognitivi (P44.6) passano

---

## Timeline Suggerita (realistica)

- **Sprint 1-2**: Fase 0 + inizio Fase 1
- **Sprint 3**: Completamento Fase 1 + Fase 2
- **Sprint 4-5**: Fase 3
- **Sprint 6**: Fase 4 + stabilizzazione

**Totale stimato:** 5-6 sprint (circa 2-3 mesi con team di 3-4 dev)

---

**Prossimo agente:** Synthesizer (per il piano finale integrato).