# SOAK PHASE — MASTER INDEX

**Started:** 2026-07-27  
**Status:** Active & Fully Instrumented

## Quick Links (Start Here)

- **Start monitoring today** → `START_MONITORING_TODAY.md`
- **Current status** → `SOAK_STATUS.md`
- **Kickoff summary** → `SOAK_KICKOFF_SUMMARY.md`
- **Live panel** (UI) → Open AIDevToolsPanel → "Post-Fase 4 Soak Metrics"

## Documentation

### Root Level
- `SOAK_START_2026-07-27.md` — Official start record
- `SOAK_MONITORING_GUIDE.md` — Full monitoring guide
- `SOAK_READINESS_CHECKLIST.md` — Pre/during/post checklist
- `SOAK_READY.md` — Short readiness confirmation
- `SOAK_INSTRUMENTATION_COMPLETE.md` — What was built

### docs/ai-soak/
- `README.md` — Folder overview
- `SOAK_QUICK_START.md` — Fast daily instructions
- `SOAK_DAILY_ROUTINE.md` — Recommended routine
- `SOAK_EXIT_CRITERIA.md` — When to end the soak
- `SOAK_METRICS_INTERPRETATION.md` — How to read the numbers
- `SOAK_LOG_2026-07-27.md` — Main log (update this)
- `SOAK_LOG_TEMPLATE.md` + `SOAK_DAILY_REPORT_TEMPLATE.md`
- `SOAK_AUDIT_DAY0_2026-07-27.md` — Baseline audit
- `daily-snapshot.sh` — One-command snapshot

## Tools

- Live panel (best)
- `AIBrain.getUsageStats()` (console)
- `npx tsx scripts/ai-usage-audit.ts`
- `./docs/ai-soak/daily-snapshot.sh`

## Current Verified State

- Post-Fase 4 blocks: 27
- Central path files: 31
- ContextualAskAI: 65
- Legacy aiService in UI: 0
- TSC: exactly 3 pre-existing
- Monitoring: fully ready

**All Phase 4 invariants exactly preserved.**

Start using the tools and fill the log.
