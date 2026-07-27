# 🚀 Fase 0 — Consolidamento AI (Kickoff)

**Priorità:** CRITICA  
**Obiettivo:** Ridurre da 7+ entry point AI a **2 modi principali**  
**Durata target:** 1-2 sprint

---

## Obiettivo Finale di Fase 0

- **Solo 2 modi** per accedere all'AI:
  1. **FAB / SatelliteCopilot** (proattivo + contestuale)
  2. **Vista "Assistente"** (esperienza completa P44.6)

- Tutte le altre chat/AI devono essere deprecate, ridotte o fuse.

---

## Task Breakdown - Fase 0

### 0.1 Preparazione
- [ ] Creare la nuova vista `Assistente` (rinominare o creare `src/components/views/AssistantView.tsx`)
- [ ] Aggiornare `viewRegistry.ts`:
  - Aggiungere `'assistente': { ... }`
  - Mappare `copilot` come alias legacy (per backward compat)
- [ ] Aggiornare `VIEW_LABELS` e `VIEW_PARENT`

### 0.2 Consolidamento Core AI
- [ ] Spostare / estendere `SmartChat` + `OrbitDock` nella nuova vista Assistente
- [ ] Assicurarsi che `MessageBlockRenderer` e UIBlock pipeline funzionino correttamente
- [ ] Mantenere tutti gli invarianti P44.6 (verifica con test)

### 0.3 Pulizia Entry Point

| Entry Point | Azione | Note |
|-------------|--------|------|
| Home inline chat | Rimuovere o ridurre drasticamente | Sostituire con link a "Assistente" |
| `OperationsCenter` (icona bolt) | Deprecare o trasformare | Spostare azioni AI guidate dentro Assistente |
| Vecchia `CopilotView` | Fondere | Reindirizzare a nuova vista Assistente |
| `AssistantModal` / Live | Mantenere come modalità contestuale | Solo da Aula |
| `OrbitChatFAB` | Mantenere e rafforzare | Parte del FAB proattivo |

### 0.4 Integrazione con Nuova Navigazione (preview)
- Aggiungere voce "Assistente" nel BottomNav (temporaneamente)
- Creare pulsante "Chiedi all'AI" placeholder nelle altre aree (sarà completato in Fase 2)

### 0.5 Verifica
- [ ] Tutti i test cognitivi passano
- [ ] Nessuna regressione MD3
- [ ] E2E smoke test su flusso AI

---

## File da Modificare (Fase 0)

**Alta priorità:**
- `src/components/viewRegistry.ts`
- `src/components/views/AssistantView.tsx` (nuovo)
- `src/components/Home.tsx` (rimuovi/riduci chat inline)
- `src/components/OperationsCenter.tsx` (deprecate AI parts)

**Core AI (non modificare logica):**
- `src/hooks/useSmartChat.ts`
- `src/components/chat/MessageBlockRenderer.tsx`
- `src/components/orbit/OrbitDock.tsx`

---

## Criteri di Successo Fase 0

1. Da qualunque parte dell'app, l'utente ha **massimo 2 modi** chiari per parlare con l'AI.
2. La vista "Assistente" contiene il sistema cognitivo completo (P44.6).
3. Il FAB SatelliteCopilot rimane l'unico meccanismo proattivo.
4. Zero violazioni agli invarianti elencati nel documento 03-cognitive-integration.md.

---

**Prossima azione consigliata:**  
Iniziare con la creazione della vista `Assistente` e l'aggiornamento del registry.

Vuoi che proceda con l'implementazione concreta di Fase 0 (creazione file, modifiche, ecc.)?