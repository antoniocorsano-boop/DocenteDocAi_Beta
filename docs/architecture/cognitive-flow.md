# Architettura Flusso Cognitivo — Copilot Evolutivo

## Principio Fondante

```
Evento → Insight → Suggestione → Azione → Apprendimento → Evoluzione
```

---

## Diagramma High-Level

```
[USER ACTION]
     ↓
[EventEmitter / Hook]
     ↓
[CognitionBus]                          src/cognition/CognitionBus.ts
     ↓
┌──────────────────────────────┐
│        COGNITION LAYER       │
├──────────────────────────────┤
│ - eventMap.ts                │        src/cognition/eventMap.ts
│ - WorkflowPatternDetector    │        src/cognition/WorkflowPatternDetector.ts
│ - UsageTracker               │        src/cognition/UsageTracker.ts
│ - CapabilityEngine           │        src/cognition/CapabilityEngine.ts
└──────────────────────────────┘
     ↓
[INSIGHT GENERATION]
     ↓
┌──────────────────────────────┐
│      SUGGESTION LAYER        │
├──────────────────────────────┤
│ - SuggestionEngine           │        src/cognition/SuggestionEngine.ts
│ - CopilotPredictions         │        src/copilot/CopilotPredictions.ts
│ - ArtisticConsilium          │        src/services/ArtisticConsilium.ts
└──────────────────────────────┘
     ↓
[SUGGESTIONS ARRAY (max 3)]
     ↓
┌──────────────────────────────┐
│           UI LAYER           │
├──────────────────────────────┤
│ - CopilotActionsBar          │        src/components/copilot/CopilotActionsBar.tsx
│ - CopilotDocentePanel        │        src/components/CopilotDocentePanel.tsx
│ - ArtisticConsiliumPanel     │        src/components/copilot/ArtisticConsiliumPanel.tsx
│ - JourneyProgressPanel       │        src/components/journey/JourneyProgressPanel.tsx
└──────────────────────────────┘
     ↓
[USER ACTION (CTA)]
     ↓
[CognitionBus.emit()]
     ↓
(LOOP CONTINUA)
```

---

## Dettaglio Flusso

### 1. Evento Utente

Esempi di eventi:

- `class.first_student_added`
- `workspace.configured`
- `book.account.linked`
- `uda.created`
- `artistic.suggestions.generated`

Trigger nel codice:

```ts
cognitionBus.emit("workspace.configured", payload);
```

Il catalogo completo degli eventi è in `src/cognition/eventMap.ts`.

---

### 2. Cognition Layer

#### WorkflowPatternDetector (`src/cognition/WorkflowPatternDetector.ts`)

Rileva sequenze comportamentali su buffer temporale (3h).  
Esempio:

```
session.started → workspace.configured → onboardingWorkflow
```

#### CapabilityEngine (`src/cognition/CapabilityEngine.ts`)

Calcola il livello del docente e la progressione nel journey:

| Livello numerico | JourneyLevel |
| ---------------- | ------------ |
| 1                | esploratore  |
| 2                | praticante   |
| 3–4              | maestro      |

Funzioni chiave: `toJourneyLevel(capabilityLevel)`, `computeJourneyProgress(model)`.

#### UsageTracker (`src/cognition/UsageTracker.ts`)

Ascolta eventi dal bus e aggiorna il profilo di utilizzo (`usageProfile`) nello store:

- `featuresDiscovered`
- `bookServicesLinked`
- `workspaceConfigured`
- +1 `featuresDiscovered` su `artistic.suggestions.generated`

---

### 3. Insight

Output tipico dal CapabilityEngine / WorkflowPatternDetector:

```ts
{
  type: 'workflow_detected',
  pattern: 'onboardingWorkflow',
  confidence: 0.8,
}
```

---

### 4. Suggestion Layer

#### SuggestionEngine (`src/cognition/SuggestionEngine.ts`)

Aggrega suggerimenti da:

- **CATALOGUE** statico filtrato per livello, punteggio AI, cooldown, personalMode
- **ArtisticConsilium** (async, solo praticante/maestro)

Funzioni esposte:

- `generateNextActions(ctx: SuggestionContext)` → sincrono, max 3 dal catalogo
- `generateArtisticNextActions(ctx: SuggestionContext)` → asincrono, chiama il pipeline AI artistico

#### CopilotPredictions (`src/copilot/CopilotPredictions.ts`)

Suggerimenti operativi (quick-actions) mostrati nella `CopilotActionsBar`.  
Shape: `{ id, label, description?, actionKey, actionPayload?, priority }`.

#### ArtisticConsilium (`src/services/ArtisticConsilium.ts`)

Pipeline creativa/educativa: genera attività artistiche contestuali tramite AI.

- `generateArtisticSuggestions(context: ArtisticContext)` → async, chiama Gemini/Anthropic
- `getQuickArtisticHint(udaTitle?)` → sincrono, hint rapido per la CopilotActionsBar
- `initArtisticConsilium(onHint)` → idempotente, registra 5 handler sul CognitionBus

---

### 5. Output Suggerimenti

```ts
// Formato CopilotPredictions (chip bar / hint)
{
  id: 'artistic.quick.1234',
  label: 'Attività artistiche creative',
  actionKey: 'artistic.open',
  actionPayload: {},
  priority: 2,
}

// Formato teacherModel (nextActions / journey)
{
  id: 'sug-artistic.ai.a1',
  type: 'feature',
  message: 'Mosaico storico (60 min) — Crea un mosaico visivo…',
  targetView: 'copilot',
  icon: 'palette',
}
```

---

### 6. UI Layer

| Componente               | Ruolo                                            |
| ------------------------ | ------------------------------------------------ |
| `CopilotActionsBar`      | Chip rapide con `actionKey` → navigazione/azione |
| `CopilotDocentePanel`    | 14 tab specializzati (incluso "Artistico")       |
| `ArtisticConsiliumPanel` | Generazione guidata attività creative            |
| `JourneyProgressPanel`   | Progressione livello + `nextActions`             |

---

### 7. Azione Utente → Chiude il Loop

Quando l'utente esegue un'azione (es. crea una UDA):

```ts
cognitionBus.emit("uda.created", { udaId: "u-42" });
```

→ WorkflowPatternDetector registra il pattern  
→ UsageTracker aggiorna il profilo  
→ CapabilityEngine rivaluta il livello  
→ SuggestionEngine genera nuovi suggerimenti  
→ UI si aggiorna (tramite `useJourneyProgress`)

---

## Integrazione ArtisticConsilium

```
Evento rilevato (uda.created / planning.wizard.completed / …)
     ↓
initArtisticConsilium → onHint callback
     ↓
CopilotActionsBar mostra hint
     ↓
Utente apre tab "Artistico"
     ↓
useJourneyProgress: generateArtisticNextActions(ctx)
     ↓
ArtisticConsilium.generateArtisticSuggestions(context)   [AI pipeline]
     ↓
Results → ArtisticConsiliumPanel (cards con materiali, durata, tipo)
     ↓
cognitionBus.emit('artistic.suggestions.generated', { count, subject, gradeLevel })
     ↓
UsageTracker: featuresDiscovered + 1
```

---

## Adattività UX

| Livello                  | JourneyLevel | Comportamento UI                          |
| ------------------------ | ------------ | ----------------------------------------- |
| 1 — Base                 | esploratore  | Suggerimenti guidati + discovery card     |
| 2 — Operativo            | praticante   | Workflow suggeriti + nextActions visibili |
| 3-4 — Avanzato/Sistemico | maestro      | Automazioni + orchestrazione              |

Il `Home.tsx` mostra contenuti differenti per livello:

- `esploratore` → banner discovery "AI Artistica Educativa"
- `praticante` → sezione "Suggerimenti contestuali" (nextActions)
- `maestro` → sezione "Automazioni suggerite" (nextActions)

---

## Regole Fondamentali

1. **Mai più di 3 suggerimenti** (`[...static, ...artistic].slice(0, 3)`)
2. **Ogni suggerimento deve avere `actionKey`** (per tracciabilità e navigazione)
3. **Nessuna azione automatica invisibile** (ogni azione richiede conferma utente)
4. **Sempre tracciamento eventi** (ogni interazione passa per CognitionBus)
5. **Progressione esplicita e percepibile** (JourneyProgressPanel sempre visibile)

---

## Hook di Connessione

```
useJourneyProgress()                    src/hooks/useJourneyProgress.ts
   ├─ useTeacherModelStore (capabilityLevel, model)
   ├─ useAIMaturitaStore (interactionMode, globalScore)
   ├─ generateNextActions(ctx)          sync → catalogo statico
   └─ generateArtisticNextActions(ctx)  async → AI pipeline
         └─ merged → nextActions (max 3)
```

---

## Architettura v3 — Consolidamento (Marzo 2026)

### Overview Aggiornato

```
[USER ACTION]
     ↓
[EventEmitter / Hook]
     ↓
[CognitionBus]  ──────────────► [EventLogger]          src/cognition/EventLogger.ts
     │                               │ (sessionStorage ring buffer, max 500 eventi)
     │                               │ replay, countEvents, hasEventOccurred
     ↓
┌──────────────────────────────────────────────────┐
│               COGNITION LAYER                    │
├──────────────────────────────────────────────────┤
│ - eventMap.ts                                    │
│ - WorkflowPatternDetector                        │
│ - UsageTracker                                   │
│ - CapabilityEngine                               │
└──────────────────────────────────────────────────┘
     ↓
[INSIGHT GENERATION]
     ↓
┌──────────────────────────────────────────────────┐
│           GOVERNANCE LAYER  ← NEW                │
├──────────────────────────────────────────────────┤
│ - DecisionContract (contratto normativo)         │   src/cognition/decisionContract.ts
│   MAX_SUGGESTIONS=3, COOLDOWN_MS=6h              │
│   ARTISTIC_MIN_CAPABILITY_LEVEL=2                │
│   IGNORED_THRESHOLD=3                            │
│   validateSuggestion() / applyContract()         │
└──────────────────────────────────────────────────┘
     ↓
┌──────────────────────────────────────────────────┐
│             SUGGESTION LAYER                     │
├──────────────────────────────────────────────────┤
│ - SuggestionEngine (catalogo + filtri v3)        │   src/cognition/SuggestionEngine.ts
│   • completedActions dedup                       │
│   • per-actionKey cooldown (suggestionCooldown)  │
│   • preferenze docente (acceptsArtisticSugg.)    │
│   • sorting deterministico (priority → recency)  │
│   • FALLBACK_SUGGESTION (fail-safe)              │
│ - ArtisticConsilium                              │   src/services/ArtisticConsilium.ts
│   (gate: capabilityLevel≥2 + activeContext)      │
└──────────────────────────────────────────────────┘
     ↓
[applyContract() — validazione finale]
     ↓
[SUGGESTIONS ARRAY (max 3)]
     ↓
[UI LAYER]
     ↓
[USER DECISION: Accept / Ignore]
     ↓
┌──────────────────────────────────────────────────┐
│              FEEDBACK LOOP  ← NEW                │
├──────────────────────────────────────────────────┤
│ store.acceptSuggestion(actionKey)                │   useTeacherModelStore
│   → completedActions.push(actionKey)             │
│   → sugestionCooldown[actionKey] rimosso         │
│   → ignoredSuggestions[actionKey] = 0            │
│                                                  │
│ store.ignoreSuggestion(actionKey)                │
│   → ignoredSuggestions[actionKey]++              │
│   → suggestionCooldown[actionKey] = Date.now()   │
│   → if count ≥ IGNORED_THRESHOLD:                │
│       dismissedHints.push(actionKey)             │
└──────────────────────────────────────────────────┘
     ↓
[TeacherModel aggiornato → nuovo ciclo]
```

---

### Nuovi Campi su `TeacherModel` (v3)

| Campo                | Tipo                     | Scopo                                            |
| -------------------- | ------------------------ | ------------------------------------------------ |
| `completedActions`   | `string[]`               | Azioni già completate — escluse dai suggerimenti |
| `ignoredSuggestions` | `Record<string, number>` | Contatore ignore per actionKey                   |
| `preferences`        | `TeacherPreferences`     | Verbosità preferita, flag artistico              |
| `suggestionCooldown` | `Record<string, number>` | Timestamp cooldown per actionKey                 |

```ts
interface TeacherPreferences {
  suggestionVerbosity: "concise" | "detailed";
  acceptsArtisticSuggestions: boolean;
  preferredReminderTime?: "morning" | "evening";
}
```

---

### DecisionContract — Contratto Normativo

Centralizza tutte le regole di governance in un'unica fonte normativa:

```ts
export const DecisionContract = {
  MAX_SUGGESTIONS: 3,
  COOLDOWN_MS: 6 * 60 * 60 * 1000, // 6 ore
  ARTISTIC_MIN_CAPABILITY_LEVEL: 2,
  IGNORED_THRESHOLD: 3,
  FALLBACK_PRIORITY: -1,

  rules: {
    mustHaveActionKey: true,
    requireTraceability: true,
    allowedSources: ["copilot", "pattern", "artistic"] as SuggestionSource[],
  },
} as const;
```

Ogni `CopilotSuggestion` che viola `mustHaveActionKey` o `requireTraceability`
viene silenziosamente scartata in produzione e segnalata con `console.warn` in DEV.

---

### EventLogger — Tracciabilità Sessione

Wrapper strutturato intorno a `CognitionBus`, con replay capability:

```ts
// Shape di ogni evento registrato
interface LoggedEvent {
  event: string;
  timestamp: number;
  source?: string;
  payload?: unknown;
  sessionId: string;
}
```

Funzioni esposte:

- `logEvent(type, payload?, source?)` — registra nel ring buffer (max 500)
- `getSessionLog()` — tutti gli eventi della sessione corrente
- `replayCurrentSession()` — ripete tutti gli eventi sul bus (utile per debug/test)
- `hasEventOccurred(type)` — booleano, usato nella logica di gate
- `getLastEvent(type)` — ultimo evento di un tipo specifico

Storage: `sessionStorage` (`dcai-event-log`), azzerato a ogni ricarica pagina.  
L'ID di sessione è generato una volta per ciclo di vita della pagina.

---

### Nuovi Gate su `generateArtisticNextActions`

Per ottenere suggerimenti artistici, **tutti e 3 i gate** devono essere soddisfatti:

| Gate                         | Condizione                                              |
| ---------------------------- | ------------------------------------------------------- |
| 1. Livello minimo            | `model.capabilityLevel >= 2` (praticante o maestro)     |
| 2. Contesto didattico attivo | `ctx.hasActiveDidacticContext === true`                 |
| 3. Preferenze docente        | `model.preferences.acceptsArtisticSuggestions === true` |

Se qualsiasi gate fallisce, la funzione ritorna `[]` senza chiamare il servizio AI.

---

### Fail-Safe Statico

Se `generateNextActions()` non produce alcun risultato (catalogo vuoto dopo filtri),
viene iniettato automaticamente `FALLBACK_SUGGESTION`:

```ts
const FALLBACK_SUGGESTION: CopilotSuggestion = {
  id: "sug-fallback",
  type: "workflow",
  message: "Crea la tua prima UDA per iniziare",
  targetView: "planning",
  icon: "add_circle",
  actionKey: "planning.create_uda",
  reason: "Nessuna unità didattica trovata. Cominciamo da qui.",
  priority: DecisionContract.FALLBACK_PRIORITY,
  source: "copilot",
};
```

Questo garantisce che l'UI non presenti mai un pannello vuoto.

---

### Migration v2 → v3

Lo store Zustand (`useTeacherModelStore`) è stato portato alla versione 3.
La migration è applicata automaticamente all'avvio se lo stato serializzato è alla versione 2:

```ts
// Applicata automaticamente da Zustand persist onRehydrateStorage
if (persisted.version === 2) {
  persisted.state.completedActions ??= [];
  persisted.state.ignoredSuggestions ??= {};
  persisted.state.preferences ??= {
    suggestionVerbosity: "concise",
    acceptsArtisticSuggestions: true,
  };
  persisted.state.suggestionCooldown ??= {};
}
```

---

### Estensioni Future (aggiornate)

- **Segreteria intelligente** — auto-task orchestration per adempimenti burocratici
- **Sistema psico-cognitivo** — modellazione di affaticamento e motivazione del docente
- **Sistema scientifico** — analisi longitudinale dei dati di apprendimento
- **Meta-layer etico e culturale** — bias detection, inclusività, pluralismo pedagogico
- **Preferenze temporali** — `preferredReminderTime` in `TeacherPreferences` (morning / evening)
- **EventLogger persistito** — migrazione da `sessionStorage` a `localStorage` con retention configurable

---

## Motto del Sistema

```
Non imponere.
Suggerire.
Accompagnare.
Elevare.
```
