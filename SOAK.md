# SOAK — Post-Fase 4 (Central AI Prompt System)

**Started:** 2026-07-27  
**Status:** Active & Fully Instrumented

## Quick Status (verified 2026-07-27)

- Post-Fase 4 visible blocks: 27
- Files using central prompt path: 31
- ContextualAskAI: 65
- Legacy aiService in UI: 0
- Live monitoring panel: Present

## Start Monitoring (30 seconds)

**Best method:**
1. Enable **AI Beta** / Experimental mode
2. Open **AIDevToolsPanel**
3. Scroll to **"Post-Fase 4 Soak Metrics"**

**Console (instant):**
```ts
import { AIBrain } from '@/ai/brain/AIBrain';
console.log(AIBrain.getUsageStats());
```

## Key Files

- **Main log:** `docs/ai-soak/SOAK_LOG_2026-07-27.md`
- **Dashboard:** `SOAK_DASHBOARD.md`
- **Quick start:** `SOAK_QUICK_START.md` or `SOAK_EASY_START.md`
- **Cheat sheet:** `docs/ai-soak/SOAK_CHEAT_SHEET.md`
- **Success criteria:** `docs/ai-soak/SOAK_SUCCESS_DEFINITION.md`

**All Phase 4 invariants are exactly preserved.**

---

**Repo Cleanup Note (2026-07-27)**  
Root documentation was cleaned up on this date.  
36+ redundant SOAK status snapshots were moved to `archive/2026-07-27-soak-iterations/`.  
See `CLEANUP_REPORT_2026-07-27.md` for full details.
