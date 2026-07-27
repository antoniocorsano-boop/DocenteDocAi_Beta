# SOAK PHASE STARTED — Post-Fase 4

**Start Date:** 2026-07-27  
**Duration:** 7–14 giorni (raccomandato)  
**Stato prima del soak:** Post-Fase 4 + Cleanup + Metrics **COMPLETATI**

---

## Obiettivo del Soak

Verificare in condizioni reali che il percorso centrale (`AIBrain.buildPrompt` + `AIBrain.generateWithCentralPrompt`) sia:
- Stabile
- Adottato
- Privo di regressioni
- Pronto per la futura deprecation dei metodi legacy

---

## Stato al momento dell'avvio del Soak

| Metrica                              | Valore | Note |
|--------------------------------------|--------|------|
| AIBrain direct imports               | 61     | — |
| Post-Fase 4 visible blocks           | 27     | Esatti |
| File che usano `generateWithCentralPrompt` | 30 | — |
| buildPrompt + generateWithCentralPrompt calls | 129+ | — |
| ContextualAskAI                      | 65     | Invariante |
| Legacy aiService in UI               | 0      | Pulito |
| Duplicati metodi delegati (10 chiave)| 0      | Pulito |
| TSC errors                           | 3      | Solo pre-esistenti (AssistantModal) |
| Metriche attive                      | Sì     | `getUsageStats()` + `getStats()` |

**Ultimo audit statico:** `AUDIT_POST_FASE4_2026-07-27.md` → **PASS**

---

## Come monitorare durante il Soak

### 1. Pannello Dev UI (metodo consigliato)

1. Attiva la modalità **AI Beta / Experimental** (Impostazioni → Avanzate).
2. Apri il pannello **AIDevToolsPanel** (solitamente nella sezione Copilot / Dev Tools).
3. Scorri fino alla sezione **"Post-Fase 4 Soak Metrics"**.

Il pannello `AISoakMetricsPanel` mostra in tempo reale:
- Total Central Calls
- `buildPrompt` / `generateWithCentralPrompt`
- Fallback rate (con avviso visivo se > 8%)
- Top task breakdown
- Auto-refresh ogni 30 secondi

File: `src/ai/devtools/AISoakMetricsPanel.tsx`  
Integrato in: `src/components/copilot/AIDevToolsPanel.tsx`

### 2. Metriche in console (metodo rapido)

```ts
import { AIBrain } from '@/ai/brain/AIBrain';

// Uso rapido
console.log(AIBrain.getUsageStats());

// O versione estesa
const stats = AIBrain.getUsageStats();
console.table(stats.taskBreakdown);
console.log('Total central calls:', stats.totalCentralCalls);
console.log('Fallback rate:', ((stats.fallbackUsed / (stats.totalCentralCalls || 1)) * 100).toFixed(1) + '%');
```

### 3. Audit script (da eseguire periodicamente)

```bash
# Dal root del progetto
npx tsx scripts/ai-usage-audit.ts
```

O versione statica (sempre sicura):

```bash
node -e '
console.log("ContextualAskAI:", require("child_process").execSync("grep -r ContextualAskAI src --include=*.tsx | wc -l").toString().trim());
console.log("Post-Fase 4 blocks:", require("child_process").execSync("grep -r \"AIBrain (Post-Fase 4)\" src --include=\"*.ts\" --include=\"*.tsx\" | wc -l").toString().trim());
console.log("Central path files:", require("child_process").execSync("grep -rl generateWithCentralPrompt src --include=\"*.ts\" --include=\"*.tsx\" | wc -l").toString().trim());
'
```

### 3. Verifica TSC (obbligatoria dopo ogni modifica)

```bash
NODE_OPTIONS="--max-old-space-size=4096" ./node_modules/.bin/tsc --noEmit
```

---

## Criteri di successo del Soak

- Nessun nuovo errore TSC o runtime legato ad AIBrain
- Almeno 4-5 task principali con > 15-20 chiamate ciascuno
- Fallback rate < 8%
- Tutti gli invarianti Phase 4 rimangono stabili
- Nessuna regressione segnalata dagli utenti

---

## Log del Soak (da compilare)

| Data       | Total Calls | Top Tasks                     | Fallback % | Note / Osservazioni                  | Eseguito da |
|------------|-------------|-------------------------------|------------|--------------------------------------|-------------|
| 2026-07-27 | —           | —                             | —          | Inizio soak                          | —           |
|            |             |                               |            |                                      |             |
|            |             |                               |            |                                      |             |
|            |             |                               |            |                                      |             |

---

## File di riferimento

- `SOAK_READINESS_CHECKLIST.md`
- `AUDIT_POST_FASE4_2026-07-27.md`
- `RESOCONTO_METRICS_BATCH.md`
- `RESOCONTO_POST_FASE4_FINAL.md`
- `scripts/ai-usage-audit.ts`
- `AI_MIGRATION_PLAN.md`

---

**Soak Phase ufficialmente avviata il 2026-07-27.**

Prossima fase prevista: **Deprecation Readiness** (dopo 7-14 giorni di soak stabile).