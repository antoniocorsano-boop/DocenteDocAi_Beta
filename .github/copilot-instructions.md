# Copilot Instructions — DocenteDoc AI

## Contesto del Progetto

Questa è un'app React con Material Design 3 (MD3). Ogni modifica UI deve rispettare integralmente il contratto MD3 Governance & Compliance riportato di seguito.

## Regole di Comportamento per Copilot/Claude

- Prima di ogni modifica UI, verifica la conformità MD3 del file target.
- Ogni fix deve essere atomico: una violazione alla volta, un file alla volta.
- Non introdurre mai dipendenze di stile non tracciate a token MD3.
- Dopo ogni modifica, elenca esplicitamente le violazioni corrette e quelle ancora aperte.
- Aggiorna `MD3_AUDIT.md` dopo ogni sessione di lavoro.
- Se una correzione richiede un'eccezione al contratto, segnalala esplicitamente e non procedere senza approvazione.

---

## MD3 Governance & Compliance Contract

### 1. Scope e Autorità

- Material Design 3 (MD3) è l'unica fonte normativa per la progettazione visiva, semantica e accessibile dell'app DocenteDoc AI.
- Il presente documento è vincolante per ogni sviluppo, revisione, refactor e automazione.
- Ogni violazione è da considerarsi bug bloccante e deve essere corretta senza eccezioni.

### 2. Principi Non Negoziabili

- È obbligatoria la separazione tra logica applicativa e semantica visiva.
- L'uso di token MD3 non costituisce conformità se la struttura o il significato non sono MD3.
- È vietato ogni layout basato su `<div>` generici per scopi visivi o semantici.
- È vietato ogni override locale di stile non documentato e non tracciato.

### 3. Regole sui Container Visivi

- È obbligatorio l'uso esclusivo di `M3Surface`, `AppLayout` o wrapper MD3 per ogni container visivo.
- È vietato l'uso di `<div>` per shell, card, banner, layout, surface o contenitori di stato.
- Padding, background ed elevation devono essere gestiti solo tramite componenti MD3 e relativi token.
- Ogni eccezione (es. FAB, overlay) deve essere esplicitamente documentata e approvata.

### 4. Tipografia e Gerarchia

- È obbligatorio l'uso di `M3Typography` per ogni testo significativo.
- È vietato l'uso di `fontSize`, `fontWeight` o proprietà tipografiche inline su testo semantico.
- La gerarchia tipografica deve riflettere i livelli MD3 senza eccezioni.

### 5. Spacing, Layout e Responsive

- È obbligatorio l'uso esclusivo di token MD3 per ogni spacing, margin, padding, gap.
- È vietato ogni spacing arbitrario, hardcoded o non tracciato a token MD3.
- La gestione responsive è consentita solo tramite layout MD3 o utilità centralizzate approvate.
- È vietato l'uso di breakpoint, media query o logica responsive "ad hoc".

### 6. Elevation, Z-Index e Surface

- L'elevation è consentita solo se semanticamente necessaria secondo MD3.
- È vietato l'uso di `box-shadow` manuali o custom elevation.
- Z-Index ed elevation devono essere centralizzati e gestiti tramite provider MD3.

### 7. Componenti Interattivi e Accessibilità

- Button, IconButton, FAB e ogni componente interattivo devono essere MD3 o wrapper MD3.
- Ogni elemento interattivo deve avere `aria-label` esplicito e univoco.
- L'ordine di focus, tab order e navigazione da tastiera devono essere garantiti.
- Le icone decorative devono essere `aria-hidden`; le icone interattive devono essere accessibili.

### 8. Errori, Loader e Stati Transitori

- È obbligatorio l'uso di componenti MD3 dedicati per errori, loader, warning, info e stati transitori.
- È vietato ogni fallback visivo basato su `<div>` stilizzati o container generici.

### 9. Eccezioni Consentite

- Sono consentite solo le eccezioni esplicitamente elencate e documentate in questo documento.
- Ogni eccezione deve essere motivata, tracciata e approvata dal Design System Architect.

### 10. Processo di Verifica

- Ogni modifica deve essere verificata tramite checklist di conformità MD3.
- Ogni violazione comporta il rifiuto automatico in code review.
- L'assenza di violazioni automatiche non implica conformità se la semantica MD3 non è rispettata.

### 11. Dichiarazione Finale di Compliance

- "MD3 Gold Compliant" significa aderenza totale, strutturale e semantica a tutte le regole di questo documento.
- La responsabilità della compliance è condivisa da tutto il team di sviluppo, revisione e governance.

---

## Orbit / SmartChat / UIBlock Layer System — P44.6

### Gerarchia dei layer (NON NEGOZIABILE)

```
Chat > PlanCard > DecisionCard > Orbit
```

| Layer        | Componente principale   | Regola di attivazione                                                 |
| ------------ | ----------------------- | --------------------------------------------------------------------- |
| Chat         | `SmartChat.tsx`         | risposta principale; FAB mobile sempre visibile                       |
| PlanCard     | `orbit_plan` UIBlock    | visualizzata se `confidence ≥ 0.65`; sempre a `index=1` in UIBlock[]  |
| DecisionCard | `decision_card` UIBlock | solo se `!planPresent \|\| score<0.7 \|\| shouldShow`                 |
| Orbit        | `OrbitDock.tsx`         | nudge soft; silenzioso se PlanCard/DecisionCard nei 3 ultimi messaggi |

### Regole di generazione UIBlock[]

1. **Intake expansion** — se input breve (< 20 char) contiene keyword `['carica','documento','upload','allega','file','programma','programmazione']`, espandi il testo con `"— analizza e prepara un piano di lavoro"` prima di `buildPlan()`.
2. **PlanCard** — inserisci `orbit_plan` a `index=1` se `plan.confidence ≥ 0.65` e `!unify`. Non spostarlo.
3. **DecisionCard** — appare solo se almeno una condizione vera: `!planPresent`, `confidence.score < 0.7`, `explain.shouldShow`. Non renderla "sempre presente".
4. **Orbit labels** — sempre in forma di domanda soft ("Vuoi creare una verifica?" — MAI imperativo "Crea una verifica").
5. **OrbitDock silenzioso** — se nei 3 ultimi messaggi assistant esiste un blocco `decision_card` o `work_session`, il nudge non appare.

### Hard limits cognitivi (non aggirare senza sprint dedicato)

- `ExplainEngine.ts` → `items.slice(0, 2)` — max 2 item spiegazione
- `ConfidenceEngine.ts` → `MAX_FACTORS = 3` — max 3 fattori confidence
- `OrbitSuggestionEngine.ts` → max 3 suggerimenti per turno
- `OrbitDock.tsx` → `MOBILE_PB = '30vh'` — altezza massima drawer mobile

### Ordine assembly UIBlock[]

```
index 0 → text           (risposta assistant)
index 1 → orbit_plan     (se planPresent && !unify)
index n → explain        (se shouldShow)
index n → confidence     (sempre)
index n → work_session   (se WorkSessionEngine attivo)
index n → decision_card  (solo se condizionale vera)
index n → actions        (CTA contestuali)
```

### File chiave — layer UIBlock

| File                                             | Ruolo                                                           |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `src/hooks/useSmartChat.ts`                      | Pipeline 10-step: assembla UIBlock[] per ogni turno             |
| `src/modules/orchestration/ExplainEngine.ts`     | Genera blocco explain (max 2 item)                              |
| `src/modules/orchestration/ConfidenceEngine.ts`  | Genera blocco confidence (max 3 fattori)                        |
| `src/modules/orchestration/WorkSessionEngine.ts` | Genera blocco work_session unificato                            |
| `src/modules/orbit/OrbitSuggestionEngine.ts`     | ≤3 suggerimenti in forma domanda soft                           |
| `src/components/chat/MessageBlockRenderer.tsx`   | Renderizza PlanCardBlock / DecisionCardBlock / WorkSessionBlock |
| `src/components/orbit/OrbitDock.tsx`             | Drawer suggerimenti con guard hasDecisionCard                   |
