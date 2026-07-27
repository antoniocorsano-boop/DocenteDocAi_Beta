# 03 — Cognitive Integration & AI Architecture (Cognitive Guardian)

**Agente:** Cognitive Guardian  
**Data:** 2026-07-25  
**Input:** 01-user-flows.md + 02-navigation-model.md + CLAUDE.md + COGNITIVE_ARCHITECTURE_P44.6.md + useSmartChat.ts + EmotionalEngine

---

## Invarianti P44.6 da Proteggere

Questi **non sono negoziabili** in nessun piano di ristrutturazione:

### Gerarchia UIBlock (assolutamente rigida)
```
Chat (testo principale)
  → PlanCard (orbit_plan)          ← SEMPRE a index=1
  → DecisionCard                   ← solo se condizioni
  → Orbit (suggerimenti)           ← silenzioso se DecisionCard o WorkSession presenti
```

### Regole del Merge Engine
1. `guidance === 'lead'` → override immediato di sicurezza (depth=light, uiDensity=low)
2. Gerarchia fissa: **Emotion > Style > Speed**
3. `smoothState` e `smoothStyle` non possono mai essere bypassati
4. `adaptBlocks` **non elimina** contenuto — usa solo `hidden: true` + reveal
5. Hard limits cognitivi:
   - Explain: max **2** items
   - Confidence: max **3** factors
   - Orbit suggestions: max **3**

### Componenti Core da Non Toccare
- `useSmartChat.ts` (pipeline 10-step)
- `EmotionalEngine.ts`
- `CognitiveStyleEngine.ts`
- `SystemPromptBuilder.ts`
- `MessageBlockRenderer.tsx`
- `OrbitDock.tsx`
- `useChatPrefsStore.ts` (v3)

---

## Posizionamento dell'AI nella Nuova Architettura

### Modello Raccomandato: **"AI come Layer + Destinazione Dedicata"**

**Struttura proposta:**

| Livello | Nome | Descrizione | Come si attiva |
|---------|------|-------------|----------------|
| **Layer** | SatelliteCopilot + FAB | Proattività globale + contesto | Sempre visibile |
| **Layer contestuale** | "Chiedi all'AI" | AI pre-caricata con contesto della vista corrente | Pulsante in ogni macro-area |
| **Destinazione** | Vista **Assistente** | Esperienza AI completa (UIBlocks, Orbit, Decision Cards) | Voce di navigazione principale |

### Regole di integrazione

- **La vista "Assistente"** deve ospitare il `SmartChat` + `OrbitDock` + `MessageBlockRenderer`.
- **Ogni macro-area** (Oggi / Aula / Pianificazione / Analisi) deve poter passare contesto al layer AI senza cambiare vista.
- **OrbitDock** e **DecisionCard** devono continuare a rispettare la gerarchia anche quando l'utente è in altre viste.
- **IntakeExpansion** (keyword detection) deve continuare a funzionare ovunque.

**Non si deve**:
- Spostare `orbit_plan` da index=1
- Rendere `DecisionCard` sempre visibile
- Spezzare il learning loop (recordModeUsage, revealClick, feedback)

---

## Entry Point AI da Consolidare

| Entry Point Attuale              | Azione Raccomandata                  | Motivazione |
|----------------------------------|--------------------------------------|-----------|
| Home inline chat                 | **Rimuovere** o ridurre a Quick Prompt | Troppo superficiale, duplica l'AI |
| FAB Home / DailyBriefing         | Consolidare nel Satellite | Ridondante |
| `OperationsCenter` (bolt)        | **Deprecare** o trasformare in "Azioni guidate" dentro Assistente | È un altro hub AI |
| Vista `copilot` (vecchia)        | **Fondere** dentro "Assistente" | Duplicato |
| `AssistantModal` / LiveAssistant | Mantenere solo come modalità vocale contestuale (da Aula) | Utile in classe |
| `OrbitDock` + `OrbitChatFAB`     | **Mantenere e rafforzare** | Parte core di P44.6 |
| `SmartChat.tsx`                  | **Mantenere** come cuore | Non toccare |

**Risultato finale desiderato:** Da **7+** entry point → **2 modi principali**:
1. FAB/Satellite (proattivo + contestuale)
2. Vista "Assistente" (esperienza completa)

---

## Strategia di Proattività

### Mantenere e potenziare

- **FloatingSatelliteCopilot** → Diventa il **punto di contatto proattivo principale** in tutte le macro-aree.
- **useNextAction** + **JourneyProgress** → Devono continuare a guidare i suggerimenti.
- **GuidedExecution** + **MolecularActionTree** → Ottimi per flussi complessi (es. creazione UDA).
- **Orbit suggestions** → Devono apparire in modo contestuale anche dentro le viste "Aula" e "Pianificazione".

### Raccomandazione
Il SatelliteCopilot dovrebbe:
- Essere **sempre visibile** (come ora)
- Aprire un overlay che mostra:
  - Next Action
  - Azioni rapide contestuali
  - Accesso rapido alla vista "Assistente"

---

## Rischi Cognitivi

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Rottura della gerarchia UIBlock | Media | Alto | Non toccare `MessageBlockRenderer` e `useSmartChat` |
| Perdita di proattività | Bassa | Alto | Mantenere Satellite + nextAction engine |
| Frammentazione dell'AI | Alta (se non si consolida) | Critico | Ridurre a 2 entry point |
| Incoerenza tra "Assistente" e viste contestuali | Media | Medio | Passare contesto in modo esplicito (useSmartChat context) |
| Violazione hard limits (Explain/Confidence) | Bassa | Medio | Non modificare ExplainEngine / ConfidenceEngine |

---

## Raccomandazioni Finali al Team

1. **La vista "Assistente"** deve essere trattata come una destinazione di primo livello (non un "extra").
2. **Il FAB/Satellite** deve rimanere il meccanismo di proattività globale.
3. **Nessuna vista** deve bypassare il sistema di UIBlock quando invoca l'AI.
4. Il piano di navigazione proposto dallo UX Architect è **compatibile** con P44.6 **a patto che**:
   - La vista "Assistente" ospiti il core cognitivo completo.
   - Le altre aree usino l'AI come layer contestuale (non come sostituto).

**Verdetto del Cognitive Guardian:**  
La proposta di navigazione a 5 voci + AI come layer + destinazione dedicata è **approvata**, purché si rispettino rigorosamente gli invarianti sopra elencati.

---

**Prossimo agente:** MD3 Keeper (per allineare la nuova navigazione al Design System).