# SOAK DAILY ROUTINE (Recommended)

## Every day (or every other day)

1. **Open the live panel**
   - Turn on AI Beta mode
   - Go to AIDevToolsPanel
   - Look at "Post-Fase 4 Soak Metrics"
   - Note the main numbers (total calls, top 3 tasks, fallback %)

2. **Quick mental check**
   - Are numbers increasing?
   - Is fallback rate < 8%?
   - Any new tasks appearing?

3. **If you have time (every 2-3 days)**
   ```bash
   npx tsx scripts/ai-usage-audit.ts
   ```
   or run `./docs/ai-soak/daily-snapshot.sh`

4. **Record in the log**
   - Append a row to `docs/ai-soak/SOAK_LOG_2026-07-27.md` (or create a new daily file)

## Weekly

- Run full TSC check
- Review top 5 tasks
- Check if any new files started using the central path

## Red flags (stop and investigate)

- Sudden drop in central calls
- Fallback rate > 10%
- New TSC errors
- Reports of broken AI features

## Green flags (soak is going well)

- Steady growth in total calls
- Multiple tasks with good volume
- Low fallback rate
- No new errors

**Goal after 7-14 days:** Enough real usage data to confidently move to deprecation phase.
