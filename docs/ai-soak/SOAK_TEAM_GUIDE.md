# SOAK TEAM PARTICIPATION GUIDE

## How You Can Help

### 1. Daily (very easy)
- Turn on **AI Beta** mode
- Open **AIDevToolsPanel**
- Look at the "Post-Fase 4 Soak Metrics" panel (30 seconds)
- Note the main numbers somewhere (or just remember them)

### 2. Every few days
- Run one of these:
  - Console: `AIBrain.getUsageStats()`
  - Terminal: `npx tsx scripts/ai-usage-audit.ts`
- Add 1 line to `docs/ai-soak/SOAK_LOG_2026-07-27.md`

### 3. Weekly
- Fill a short Weekly Review using the template

## What to Look For

**Good signs:**
- Total calls going up
- Several different tasks being used
- Low fallback rate (< 8%)

**Report if you see:**
- Sudden drop in usage
- Very high fallback rate
- Any broken AI feature after the changes

## Quick Links

- Live panel instructions: `SOAK_QUICK_START.md`
- Cheat sheet: `SOAK_CHEAT_SHEET.md`
- Main log: `SOAK_LOG_2026-07-27.md`
- Success definition: `SOAK_SUCCESS_DEFINITION.md`

Thank you for helping validate the new central AI system!
