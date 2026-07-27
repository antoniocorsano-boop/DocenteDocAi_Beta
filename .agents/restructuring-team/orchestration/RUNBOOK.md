# 📋 Restructuring Team — Runbook di Orchestrazione

## Fase 1: Preparazione (fatta)
- Team manifest creato
- Ruoli definiti
- Directory artefatti pronta

## Fase 2: Esecuzione Parallela (Agenti lavorano)

### Come attivare gli agenti

Puoi attivare gli agenti in due modi:

**A. Manuale (consigliato per ora)**
Chiedi a me (o a un altro agente) di impersonare un ruolo specifico usando il prompt dedicato.

**B. Sequenziale**
1. Strategist
2. UX Architect
3. Cognitive Guardian
4. MD3 Keeper
5. Implementation Planner
6. Synthesizer (ultimo)

### Prompt Template per attivare un agente

```
Agisci come [NOME RUOLO] del Restructuring Task Force di DocenteDoc AI.

Leggi tutti i file in:
- /home/user/docentedocai/.agents/restructuring-team/roles/[ruolo].md
- /home/user/docentedocai/RESTRUCTURING_DECISION_PACKAGE.md
- /home/user/docentedocai/USABILITY_AUDIT.md
- /home/user/docentedocai/CLAUDE.md (se rilevante)

Poi produci l'output richiesto nel file:
`/home/user/docentedocai/.agents/restructuring-team/artifacts/[nome-file].md`

Segui esattamente la struttura indicata nel ruolo.
```

### Ordine consigliato

```bash
# 1. Strategist
# 2. UX Architect
# 3. Cognitive Guardian (importante)
# 4. MD3 Keeper
# 5. Impl Planner
# 6. Synthesizer ← finale
```

## Fase 3: Revisione Incrociata (opzionale ma consigliata)

Dopo che ogni agente ha prodotto il suo file, puoi chiedere:
> "Leggi l'output di [ruolo1] e [ruolo2] e segnala conflitti o gap."

## Fase 4: Sintesi

Lancia il Synthesizer come ultimo passo.

## Output Finale

Il piano sarà in:
`/home/user/docentedocai/.agents/restructuring-team/artifacts/FINAL_RESTRUCTURING_PLAN.md`

Questo file sarà il deliverable principale da presentare.