# Teacher Cognitive Model (TCM)

**Documento architetturale ufficiale — DocenteDoc AI**
**Data:** 16 Marzo 2026 | **Versione:** 1.0 | **Stato:** Approvato — pronto per implementazione

---

## 1. Overview

Il **Teacher Cognitive Model (TCM)** è il sistema interno che permette a DocenteDoc AI di costruire un **modello dinamico del docente** mentre utilizza la piattaforma.

Il modello viene aggiornato osservando:

- azioni dell'utente (lezioni create, valutazioni, UDA)
- pattern di workflow ricorrenti
- interazioni con l'AI e il Copilot
- utilizzo delle funzionalità della piattaforma

Il TCM serve a:

- **adattare progressivamente l'interfaccia** (Home adattiva in 3 fasi)
- **guidare il Copilot** verso suggerimenti contestuali e personalizzati
- **promuovere livelli di utilizzo più avanzati** senza gating delle funzionalità
- **suggerire automazioni** quando l'utente è pronto a riceverle

**Principio fondamentale:** il TCM è _additivo e non bloccante_. Nessuna funzionalità viene mai nascosta o limitata. Il sistema accompagna, non condiziona.

---

## 2. Architettura

### 2.1 Diagramma del flusso

```
App Events (user actions) ──► CognitionBus (mitt)
                                     │
                               UsageTracker
                                     │
                               TeacherModel (store persistente)
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                       │
     CapabilityEngine      WorkflowPatternDetector   SuggestionEngine
              │                      │                       │
         JourneyLevel          WorkflowPatterns       CopilotSuggestion[]
              │                                             │
      UserLevelBadge                              JourneyProgressPanel
      LevelUpCelebration                          CopilotActionsBar
      HomeVariant                                 FeatureHintChip
```

### 2.2 Collocazione nei moduli

```
src/
├── cognition/                  ← TCM core (nuovo modulo)
│   ├── CognitionBus.ts         ← EventBus interno (mitt singleton)
│   ├── eventMap.ts             ← Mappa completa eventi (fonte di verità)
│   ├── UsageTracker.ts         ← Aggiorna UsageProfile e CopilotProfile
│   ├── WorkflowPatternDetector.ts ← Riconosce sequenze intra-sessione
│   ├── CapabilityEngine.ts     ← Calcola CapabilityLevel (funzione pura)
│   ├── SuggestionEngine.ts     ← Genera max 3 suggerimenti evolutivi
│   ├── TeacherModel.ts         ← Helpers: createEmpty, mergeFromAnalytics
│   └── index.ts                ← Barrel export
├── types/
│   └── teacherModel.types.ts   ← Tutti i tipi TypeScript del TCM
├── stores/
│   └── useTeacherModelStore.ts ← Zustand persistito (localStorage)
├── hooks/
│   ├── useJourneyProgress.ts   ← Read-only: calcola level + nextActions
│   └── useCognitionBusEmitter.ts ← Bridge analyticsEvents → CognitionBus
└── components/
    └── journey/                ← UI layer del TCM
        ├── UserLevelBadge.tsx
        ├── JourneyProgressPanel.tsx
        ├── FeatureHintChip.tsx
        ├── LevelUpCelebration.tsx
        └── index.ts
```

### 2.3 Relazione con l'Event Bus globale (Roadmap STEP 2)

Il `CognitionBus` è **isolato** dal futuro Event Bus globale (roadmap v2 STEP 2). Non è un sostituto né un'anticipazione: è il cervello del TCM. Quando il STEP 2 sarà implementato, `CognitionBus` diventerà un subscriber del bus globale con un semplice adattatore. Nessun refactoring necessario.

---

## 3. Tipi TypeScript — Contratto vincolante

```typescript
// ── Livelli di capacità ────────────────────────────────────────────────────

/** Scala interna (non esposta all'utente) */
export type CapabilityLevel = 1 | 2 | 3 | 4;

/** Livelli UX visibili all'utente */
export type JourneyLevel = "esploratore" | "praticante" | "maestro";

/** Mappa: L1 → esploratore | L2-3 → praticante | L4 → maestro */
export const CAPABILITY_TO_JOURNEY: Record<CapabilityLevel, JourneyLevel> = {
  1: "esploratore",
  2: "praticante",
  3: "praticante",
  4: "maestro",
};

// ── Sotto-profili ──────────────────────────────────────────────────────────

/** Contatori di utilizzo delle funzionalità principali */
export interface UsageProfile {
  lessonsCreated: number;
  assessmentsGenerated: number;
  materialsUploaded: number;
  analyticsViews: number;
  copilotRequests: number;
  udaCreated: number;
  exportsGenerated: number;
  driveConnected: boolean;
}

/**
 * Preferenze pedagogiche implicite — derivate dall'analisi del contenuto creato.
 * Non richiede input esplicito dall'utente.
 */
export interface PedagogicalProfile {
  assessmentPreference: "quiz" | "open" | "collaborative" | "mixed";
  feedbackStyle: "brief" | "detailed";
  averageDifficultyLevel: 1 | 2 | 3;
}

/** Sequenza di azioni ricorrente rilevata intra-sessione */
export interface WorkflowPattern {
  patternId: string;
  sequence: string[]; // event names dal CognitionBus
  occurrences: number;
  lastDetected: number; // Unix timestamp ms
}

/** Misura qualitativa dell'uso del Copilot */
export interface CopilotInteractionProfile {
  suggestionsAccepted: number;
  suggestionsRejected: number;
  manualPrompts: number;
  automationEnabled: boolean;
}

// ── Suggestion output ──────────────────────────────────────────────────────

export type SuggestionType =
  | "automation"
  | "feature"
  | "workflow"
  | "mode_upgrade";

export interface CopilotSuggestion {
  id: string;
  type: SuggestionType;
  message: string;
  description?: string;
  targetView?: string; // View da aprire al click
  icon: string; // Material Symbols icon name
  requiredLevel?: JourneyLevel;
  lastShownAt?: number; // Timestamp ms — per cooldown
}

// ── Modello radice ─────────────────────────────────────────────────────────

export interface TeacherModel {
  usageProfile: UsageProfile;
  pedagogicalProfile: PedagogicalProfile;
  workflowPatterns: WorkflowPattern[];
  copilotInteractionProfile: CopilotInteractionProfile;
  capabilityLevel: CapabilityLevel;
  /**
   * Confidenza del sistema sulla classificazione (0.0 – 1.0).
   * Sotto 0.3 il sistema NON promuove al livello superiore (dati insufficienti).
   * Calcolato da CapabilityEngine come rapporto soglie soddisfatte / totale.
   */
  confidenceScore: number;
  /** true quando CapabilityLevel è appena salito e LevelUpCelebration non è ancora apparsa */
  levelUpPending: boolean;
  /** IDs degli hint dismissati dall'utente (FeatureHintChip) */
  dismissedHints: string[];
  /** Timestamp ms dell'ultimo aggiornamento del modello */
  lastUpdated: number;
}
```

---

## 4. Regole di evoluzione del CapabilityLevel

### 4.1 Soglie di promozione

| Da      | A                        | Requisiti (tutti AND)                                                                                        |
| ------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| L1 → L2 | esploratore → praticante | `lessonsCreated ≥ 5` **AND** `assessmentsGenerated ≥ 3` **AND** `copilotRequests ≥ 3`                        |
| L2 → L3 | praticante (sub-livello) | `analyticsViews ≥ 5` **AND** `udaCreated ≥ 2` **AND** `copilotRequests ≥ 10` **AND** `driveConnected = true` |
| L3 → L4 | praticante → maestro     | `copilotRequests ≥ 20` **AND** `suggestionsAccepted ≥ 10` **AND** `automationEnabled = true`                 |

### 4.2 Confidence Score e guardrail anti-promozione prematura

Il `CapabilityEngine` calcola il `confidenceScore` come: `(soglie_soddisfatte / soglie_totale_livello_corrente)`.

**Regola di guardrail:** la promozione al livello superiore avviene solo se `confidenceScore ≥ 0.3`. Questo evita che un utente che ha appena completato le soglie minime venga promosso con dati ancora troppo pochi per distinguere utilizzo genuino da utilizzo accidentale.

### 4.3 Irreversibilità

Il livello può solo salire, mai scendere. I contatori dell'`UsageProfile` sono solo incrementali.

---

## 5. SuggestionEngine — Regole di comportamento

### 5.1 Limiti e cooldown

- **Massimo 3 suggerimenti attivi contemporaneamente**
- **Cooldown per tipo:** un suggerimento dello stesso `SuggestionType` non viene riproposto entro **24 ore** (basato su `lastShownAt`)
- **Ordinamento per priorità:** automation > workflow > feature > mode_upgrade

### 5.2 Bridge InteractionMode

Il SuggestionEngine controlla `interactionMode` dall'`useAIMaturitaStore`:

| Livello UX | InteractionMode attuale  | Suggerimento generato                                           |
| ---------- | ------------------------ | --------------------------------------------------------------- |
| praticante | classica                 | "Prova la modalità Semi-Osmotica per suggerimenti più avanzati" |
| maestro    | classica o semi-osmotica | "Attiva la modalità Osmotica per il massimo del supporto AI"    |

**Importante:** il SuggestionEngine non cambia mai `interactionMode` autonomamente. Genera solo il suggerimento; l'utente decide.

### 5.3 Bridge AI Maturity Score

Se `aiMaturitaGlobalScore ≥ 40` (da `useAIMaturitaStore`), i suggerimenti di tipo `feature` relativi al Copilot Panel ricevono priority boost (+1 posizione).

### 5.4 Output dell'engine

```typescript
// Esempio output SuggestionEngine
const suggestions: CopilotSuggestion[] = [
  {
    id: "sugg-auto-assessment",
    type: "automation",
    message: "Genera automaticamente la verifica per questa lezione?",
    targetView: "studio",
    icon: "auto_fix_high",
  },
  {
    id: "sugg-analytics",
    type: "feature",
    message: "Prova l'analisi degli studenti nella dashboard",
    targetView: "analytics",
    icon: "analytics",
  },
  {
    id: "sugg-mode-upgrade",
    type: "mode_upgrade",
    message: "Attiva la modalità Semi-Osmotica per suggerimenti contestuali",
    targetView: "settings",
    icon: "upgrade",
  },
];
```

---

## 6. WorkflowPatternDetector

### 6.1 Pattern predefiniti da riconoscere

| Pattern ID           | Sequenza eventi                                | Descrizione          |
| -------------------- | ---------------------------------------------- | -------------------- |
| `lessonWorkflow`     | `lesson.created` → `assessment.generated`      | Lezione + verifica   |
| `planningWorkflow`   | `uda.created` → `planning.wizard.completed`    | UDA + wizard         |
| `assessmentWorkflow` | `assessment.generated` → `evaluation.added`    | Verifica + voti      |
| `analysisWorkflow`   | `analytics.viewed` → `copilot.manual_prompt`   | Analisi + AI query   |
| `driveWorkflow`      | `drive.backup.saved` → `drive.backup.restored` | Ciclo backup/restore |

### 6.2 Finestra temporale e algoritmo

- Finestra: **3 ore dalla prima azione della sequenza**
- Buffer: max **10 eventi** più recenti per sessione
- Riconoscimento: se tutti gli eventi del pattern appaiono nel buffer nell'ordine corretto entro la finestra → `occurrences++`, `lastDetected = Date.now()`

---

## 7. Event Map (fonte di verità)

La Event Map completa è in `src/cognition/eventMap.ts`. Ogni evento ha: `name`, `source`, `payload`, `type` (`userAction | systemAction | copilotInteraction`), `frequency` (`rare | occasional | frequent`), `patterns[]`.

### 7.1 Riepilogo per dominio

| Dominio           | Chiave eventi                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Lezioni/Registro  | `lesson.created`, `lesson.updated`, `lesson.deleted`, `attendance.recorded`                                                                  |
| Valutazioni       | `assessment.generated`, `evaluation.added`, `evaluation.bulk_added`, `rubric.created`                                                        |
| UDA/Progettazione | `uda.created`, `uda.updated`, `planning.wizard.completed`, `annual.plan.created`                                                             |
| Studenti          | `student.added`, `student.profile.updated`, `student.risk.changed`                                                                           |
| Knowledge Base    | `kb.document.uploaded`, `kb.document.queried`                                                                                                |
| AI/Copilot        | `copilot.suggestion.accepted`, `copilot.suggestion.rejected`, `copilot.manual_prompt`, `copilot.automation.enabled`, `ai.pipeline.completed` |
| Drive             | `drive.connected`, `drive.backup.saved`, `drive.backup.restored`                                                                             |
| Navigazione       | `navigation.view_changed`                                                                                                                    |
| Export            | `export.generated`                                                                                                                           |
| Sistema           | `app.session.started`, `onboarding.completed`                                                                                                |

---

## 8. Home Adattiva — Varianti per livello

L'interfaccia `Home.tsx` legge `JourneyLevel` da `useJourneyProgress` e mostra sezioni contestuali. Le sezioni delle fasi avanzate **aggiungono** contenuto; non rimuovono mai accesso a sezioni precedenti.

| Variante    | JourneyLevel | Sezioni Home                                                                    |
| ----------- | ------------ | ------------------------------------------------------------------------------- |
| `discovery` | esploratore  | Azioni temporali + JourneyProgressPanel + Doc burocratici                       |
| `building`  | praticante   | + "Insight di oggi" (2 AI snapshots) + FeatureHintChip su Analisi/Studio AI     |
| `mastery`   | maestro      | + "Automazioni suggerite" (da SuggestionEngine) + Link rapidi CopilotActionsBar |

---

## 9. Persistenza e migration path

### 9.1 Storage

```
localStorage key: docentedoc-tcm-v1
```

Il modello è serializzato via Zustand `persist`. La chiave include `-v1` per supportare future migrazioni di schema senza perdita di dati.

### 9.2 Migration path per utenti esistenti

Al primo mount, `useTeacherModelStore` chiama `mergeUsageFromAnalytics(emptyModel, analyticsMetrics)`. Questa funzione legge `analyticsMetrics.featuresUsage` e `analyticsMetrics.aiInteractionsCount` (già presenti in `useSystemStore`) e popola i contatori del `UsageProfile`. Gli utenti già attivi non ripartono da L1.

```typescript
// Mapping da AnalyticsMetrics → UsageProfile
function mergeUsageFromAnalytics(
  model: TeacherModel,
  metrics: AnalyticsMetrics,
): TeacherModel {
  return {
    ...model,
    usageProfile: {
      ...model.usageProfile,
      copilotRequests: metrics.aiInteractionsCount,
      assessmentsGenerated: metrics.featuresUsage["assessment_generated"] ?? 0,
      lessonsCreated: metrics.featuresUsage["lesson_created"] ?? 0,
      analyticsViews: metrics.featuresUsage["analytics_viewed"] ?? 0,
      udaCreated: metrics.featuresUsage["uda_created"] ?? 0,
      exportsGenerated: metrics.exportBatchesCount,
    },
  };
}
```

### 9.3 Note future

La persistenza potrà essere estesa a un backend per supportare:

- sincronizzazione multi-dispositivo
- analisi aggregate (anonimizzate) a livello istituzionale
- personalizzazione cross-sessione

Questo richiederà un accordo GDPR separato e un piano DPA — fuori scope per v1.

---

## 10. Regole UX non negoziabili

1. **Nessun gating** — ogni funzionalità è sempre accessibile, indipendentemente dal livello
2. **Max 3 suggerimenti attivi** — per evitare sovraccarico cognitivo
3. **Cooldown 24h** — stesso `SuggestionType` non viene riproposto entro 24 ore
4. **LevelUpCelebration una sola volta** — `markLevelUpSeen()` viene chiamato alla chiusura; non riappare mai per lo stesso level-up
5. **Hint dismissibili** — ogni `FeatureHintChip` ha una X per chiuderlo; la dismissione è permanente (persiste in `dismissedHints`)
6. **InteractionMode mai auto-cambia** — il TCM può solo suggerire il cambio; la decisione è sempre dell'utente
7. **GDPR** — nessun dato del modello viene inviato a server; tutto è client-side localStorage

---

## 11. Dipendenze tecniche

| Dipendenza                          | Uso                  | Note                                                             |
| ----------------------------------- | -------------------- | ---------------------------------------------------------------- |
| `mitt` (^3.0.0)                     | CognitionBus         | 2kb, zero dipendenze transitive. Da aggiungere a `package.json`. |
| `zustand` (già presente)            | useTeacherModelStore | Nessuna modifica necessaria                                      |
| `AnalyticsMetrics` (già presente)   | migration path       | Tipo da `src/types/analytics.types.ts`                           |
| `useAIMaturitaStore` (già presente) | bridge AI Maturity   | Store già persistito, no modifche                                |

---

## 12. Piano di implementazione

> Per il dettaglio completo e la sequenza di step, vedere `/memories/session/plan.md` e il documento di sessione correlato.

### Overview fasi

| Fase | Contenuto                                              | Dipendenze          |
| ---- | ------------------------------------------------------ | ------------------- |
| 0    | Docs ufficiali (questo file + eventMap.ts)             | —                   |
| 1    | Core Cognition Module (`src/cognition/`)               | Fase 0              |
| 2    | Store + Hook di calcolo                                | Fase 1              |
| 3    | UI Components (`src/components/journey/`)              | Fase 2              |
| 4    | Adaptive Home Dashboard                                | Fase 2 + 3          |
| 5    | Integrazione nel core (useAppEngine, Header, pannelli) | Tutte le precedenti |

### File da creare (18 totali)

- `docs/architecture/teacher-cognitive-model.md` ← questo file ✅
- `src/types/teacherModel.types.ts`
- `src/cognition/` (7 file)
- `src/stores/useTeacherModelStore.ts`
- `src/hooks/useJourneyProgress.ts`, `useCognitionBusEmitter.ts`
- `src/components/journey/` (5 file)

### File da modificare (9 totali)

- `src/types/index.ts`, `src/hooks/useAppEngine.ts`, `src/components/Home.tsx`, `src/components/Header.tsx`
- `src/components/copilot/CopilotActionsBar.tsx`, `PlanningAssistantPanel.tsx`, `CommunicationHelperPanel.tsx`
- `src/components/copilot/maturita/CopilotMaturitaPanel.tsx`
- `src/components/settings/` (pannello Drive — da localizzare)

---

## 13. Checklist di verifica pre-merge

- [ ] `npm install mitt --legacy-peer-deps` — dipendenza aggiunta
- [ ] `npx tsc -b --noEmit` — 0 errori TypeScript
- [ ] `npm run test:unit` — nessun test esistente rotto (tutto additive)
- [ ] Migration test: aprire app con dati esistenti → TCM non parte da L1
- [ ] Promotion test: completare soglie L1→L2 → `LevelUpCelebration` appare una volta sola
- [ ] Cooldown test: stesso `SuggestionType` non riappare entro 24h
- [ ] `npm run md3:audit` — conformità MD3 su `src/components/journey/`

---

_Documento ufficiale del progetto DocenteDoc AI — Teacher Cognitive Model v1.0_
_Non modificare senza aggiornare anche `src/cognition/CapabilityEngine.ts` (soglie) e `src/cognition/eventMap.ts` (eventi)._
