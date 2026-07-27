# Post-Fase 4 Soak Folder

This folder contains everything needed to monitor the soak period (7–14 days) after the full central prompt rollout.

## Quick Start

1. Read `SOAK_QUICK_START.md`
2. Use the live panel (see below)
3. Record snapshots using `daily-snapshot.sh` or manually

## Key Files

| File                              | Purpose |
|-----------------------------------|---------|
| `SOAK_QUICK_START.md`             | Fast instructions for daily monitoring |
| `SOAK_LOG_2026-07-27.md`          | Daily / periodic log (start here) |
| `SOAK_LOG_TEMPLATE.md`            | Template for new daily logs |
| `daily-snapshot.sh`               | One-command snapshot of current state |
| `SOAK_AUDIT_DAY0_2026-07-27.md`   | Full baseline audit at start of soak |
| `SOAK_STEP_PANEL_INTEGRATION.md`  | Record of when the live panel was added |

## Live Monitoring Tools

- **Best**: Open `AIDevToolsPanel` → "Post-Fase 4 Soak Metrics" (when AI Beta is enabled)
- **Console**: `AIBrain.getUsageStats()`
- **Script**: `npx tsx scripts/ai-usage-audit.ts`

## Current State (as of soak start)

- All Phase 4 invariants exactly preserved
- Live monitoring panel integrated
- Ready for real usage data

**Soak start date:** 2026-07-27
