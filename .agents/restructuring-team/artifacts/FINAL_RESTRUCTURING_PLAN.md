# 📘 DocenteDoc AI — Piano Finale di Ristrutturazione

**Team:** Restructuring Task Force  
**Data:** 2026-07-25  
**Stato:** Proposta Integrata  
**Versione:** 1.0

---

## 1. Visione e Principi

### Visione
Trasformare DocenteDoc AI da **una collezione di sistemi** in **un unico assistente intelligente** che segue il docente durante tutta la giornata scolastica.

### Principi Guida (sintesi del team)

| Principio | Fonte | Descrizione |
|-----------|-------|-------------|
| **Un solo AI** | Strategist + Cognitive | Massimo 2 modi per accedere all'intelligenza artificiale |
| **Navigazione prevedibile** | UX Architect | 5 macro-aree chiare |
| **AI come layer + destinazione** | Cognitive Guardian | Contesto ovunque + esperienza completa dedicata |
| **MD3 rigoroso** | MD3 Keeper | Nessuna deroga |
| **Protezione P44.6** | Cognitive Guardian | Invarianti non violabili |
| **Fattibilità phased** | Impl Planner | 5-6 sprint con milestone chiare |

---

## 2. Modello Mentale Target

**Frase che il docente dovrebbe dire:**

> «DocenteDoc AI è il mio assistente personale intelligente che mi segue durante tutta la giornata. Mi aiuta a gestire la classe, preparare le lezioni e capire come stanno gli studenti — tutto da un unico posto.»

**Tre macro-momenti della giornata:**
- **Mattina (Aula)** → Velocità e minimalismo
- **Pomeriggio (Pianificazione)** → Profondità e creatività
- **Sera (Analisi)** → Visione d'insieme e insight

---

## 3. Nuova Architettura di Navigazione

### Top-Level (5 voci)

| Voce          | Icona          | Scopo                              | Mobile     | Desktop    |
|---------------|----------------|------------------------------------|------------|------------|
| **Oggi**      | home           | Dashboard contestuale + quick AI   | BottomNav  | Rail       |
| **Aula**      | groups         | Registro, presenze, valutazioni    | BottomNav  | Rail       |
| **Pianificazione** | design_services | Lezioni, UDA, materiali         | BottomNav  | Rail       |
| **Analisi**   | analytics      | Competenze, insight, report        | BottomNav  | Rail       |
| **Assistente**| auto_awesome   | AI completa (P44.6)                | BottomNav  | Rail       |

### Cambiamenti chiave
- **Drawer** diventa secondario (solo "Altro")
- **Home** diventa "Oggi" (più leggera e contestuale)
- **AI** ha voce dedicata + è invocabile contestualmente

### Information Architecture (sintesi)
```
Oggi → Dashboard contestuale
Aula → Classi + Registro + Valutazioni
Pianificazione → Lezioni + UDA + Materiali + Rubriche
Analisi → Dashboard Competenze + Report + Improvement
Assistente → SmartChat + Orbit + UIBlocks (core P44.6)
```

---

## 4. Integrazione dell'AI (P44.6)

### Modello approvato
**"Layer + Destinazione Dedicata"**

- **FAB / SatelliteCopilot** → Proattività globale (sempre visibile)
- **Pulsante "Chiedi all'AI"** → In ogni macro-area (con contesto)
- **Vista "Assistente"** → Esperienza completa (UIBlocks, Orbit, Decision Cards)

### Invarianti non violabili (protetti)
- Gerarchia: `Chat > PlanCard (index=1) > DecisionCard > Orbit`
- Merge Engine: Emotion > Style > Speed
- Hard limits: Explain ≤2, Confidence ≤3, Orbit ≤3
- `useSmartChat.ts`, `EmotionalEngine`, `MessageBlockRenderer`, `OrbitDock` → **non toccare**

### Entry point AI consolidati
- Da **7+** → **2 modi principali**
- Home inline chat → Rimossa / ridotta
- OperationsCenter → Deprecato o integrato
- Vecchia vista `copilot` → Fusa in "Assistente"

---

## 5. Design System e Vincoli

### Componenti MD3 da estendere
- `M3Surface`
- `M3Typography`
- Bottom Navigation (estendere a 5 voci)
- FAB + material-symbols

### Regole ferree
- Zero `<div>` generici per container visivi
- Solo token `--md-sys-*`
- Navigation Rail su desktop (estensione del pattern attuale)
- Coerenza mobile/desktop tramite stessi token

**Verdetto MD3 Keeper:** Approvato con raccomandazione di **estensione**, non riscrittura.

---

## 6. Roadmap di Implementazione

| Fase | Nome                        | Obiettivo                          | Sprint | Rischio |
|------|-----------------------------|------------------------------------|--------|---------|
| 0    | Consolidamento AI           | 2 entry point + vista Assistente   | 1-2    | Medio   |
| 1    | Nuova Navigazione           | 5 voci + Rail + Drawer secondario  | 2      | Medio   |
| 2    | AI Contestuale              | "Chiedi all'AI" in ogni area       | 1      | Basso   |
| 3    | Consolidamento Contenuti    | Riorganizzazione viste             | 2      | Medio   |
| 4    | Pulizia                     | Rimozione duplicati + test         | 1      | Basso   |

**Totale:** 5-6 sprint (~2-3 mesi)

### Dipendenze critiche
- Fase 0 → Fase 1
- `useSmartChat` e `MessageBlockRenderer` **intoccabili**

---

## 7. Rischi e Mitigazioni

| Rischio                        | Mitigazione |
|--------------------------------|-------------|
| Rottura gerarchia P44.6        | Non toccare i file core cognitivi |
| Regressione UX mobile          | Test E2E estesi + snapshot |
| Violazione MD3                 | Lint + audit dopo ogni milestone |
| Resistenza utenti              | Mantenere drawer come fallback |

---

## 8. Criteri di Successo

- **Usabilità**: Nielsen Consistency ≥ 8.0/10
- **AI**: Solo 2 modi per accedere all'intelligenza artificiale
- **Navigazione**: 5 voci principali su mobile e desktop
- **Tecnico**: 0 violazioni MD3 + tutti i test P44.6 passanti
- **Percezione utente**: Il docente percepisce un **unico assistente**

---

## 9. Prossimi Passi

1. **Approvazione** del piano da parte del team / stakeholder
2. **Fase 0** — Inizio immediato del Consolidamento AI (massima priorità)
3. Creazione di un branch `restructure/2026` con feature flag
4. Definizione di un piccolo gruppo di beta tester (docenti)
5. Aggiornamento della documentazione (`CLAUDE.md`, `ARCHITECTURE.md`)

---

## Firma del Team

- **Lead Strategist**: Modello mentale e flussi core — ✅
- **UX Architect**: Navigazione a 5 voci — ✅
- **Cognitive Guardian**: Protezione P44.6 — ✅
- **MD3 Keeper**: Compliance design system — ✅
- **Implementation Planner**: Roadmap fattibile — ✅
- **Synthesizer**: Piano integrato — ✅

---

**Questo è il piano ufficiale di ristrutturazione.**

Pronto per revisione e implementazione.