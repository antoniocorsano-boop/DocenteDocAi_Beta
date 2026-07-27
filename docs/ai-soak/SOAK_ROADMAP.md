# SOAK ROADMAP

## Phase 1: Soak (Now — 7-14 days)
- Daily monitoring using the panel and scripts
- Regular updates to `SOAK_LOG_2026-07-27.md`
- Weekly health checks

## Phase 2: Evaluation (after ~10 days)
- Review adoption numbers
- Check fallback rate trend
- Decide:
  - Extend soak
  - Move to Deprecation Phase

## Phase 3: Deprecation (future)
- Create `DEPRECATION_PLAN.md`
- Add `@deprecated` JSDoc to legacy delegation methods
- Gradually remove duplicate methods inside AIBrain
- Full migration to `generateWithCentralPrompt`

## Success Criteria for Moving Forward
- Strong adoption (200+ central calls, multiple tasks)
- Fallback rate consistently < 8%
- No new regressions
- All Phase 4 invariants still held

Current date: 2026-07-27
