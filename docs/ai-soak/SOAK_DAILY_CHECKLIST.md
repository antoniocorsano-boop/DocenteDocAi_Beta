# SOAK DAILY CHECKLIST (2-3 minutes)

## Quick Actions
- [ ] Open AI Beta mode
- [ ] Go to AIDevToolsPanel → "Post-Fase 4 Soak Metrics"
- [ ] Note these 4 numbers:
  - Total Central Calls: ____
  - Fallback rate: ____%
  - Top task: ________________ (count: ____)
  - Number of active tasks: ____

## Optional (every 2-3 days)
- [ ] Run: `npx tsx scripts/ai-usage-audit.ts`
- [ ] Run: `./docs/ai-soak/daily-snapshot.sh`
- [ ] Append 1 line to `SOAK_LOG_2026-07-27.md`

## Red Flags to Watch
- Fallback rate > 10%
- Total calls not growing for several days
- New errors in console or TSC

## Green Signs
- Calls increasing
- Multiple tasks used
- Low fallback

**Record in the log. That's it.**
