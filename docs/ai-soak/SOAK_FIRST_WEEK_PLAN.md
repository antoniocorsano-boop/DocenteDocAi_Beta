# SOAK — First Week Plan (2026-07-27 → ~2026-08-03)

## Daily (recommended)

- Open the live **Post-Fase 4 Soak Metrics** panel (AI Beta mode)
- Spend 30 seconds noting the main numbers
- If you see anything unusual, note it

## Every 2–3 days

- Run `./docs/ai-soak/daily-snapshot.sh` or the audit script
- Append a row to the log

## End of Week 1 (around 2026-08-03)

- Fill a full checkpoint:
  - Total central calls
  - Top 5 tasks
  - Fallback rate trend
  - Any observations or issues
- Decide whether to extend soak or move toward deprecation

## Key Documents to Use

- `SOAK_QUICK_START.md`
- `SOAK_DAILY_ROUTINE.md`
- `SOAK_LOG_2026-07-27.md` (main log)
- `SOAK_EXIT_CRITERIA.md`

## Success Criteria by End of Week 1

- Clear growth in central calls
- Multiple tasks actively used
- Fallback rate stable and low
- No new TSC errors
- No user-reported regressions

**Let's collect good data!**
