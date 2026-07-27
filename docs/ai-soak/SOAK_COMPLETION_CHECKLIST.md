# SOAK COMPLETION CHECKLIST

Use this when the soak period (7-14 days) ends.

## Pre-Completion (last 2-3 days of soak)

- [ ] Collect final metrics using the live panel or `AIBrain.getUsageStats()`
- [ ] Run full audit: `npx tsx scripts/ai-usage-audit.ts`
- [ ] Fill the latest row in `SOAK_LOG_2026-07-27.md`
- [ ] Run full TSC check
- [ ] Check that all Phase 4 invariants are still exactly the same

## Completion Review

- [ ] Fill `SOAK_RETROSPECTIVE_TEMPLATE.md`
- [ ] Compare start vs end numbers (use `SOAK_METRICS_HISTORY.md`)
- [ ] Confirm success criteria from `SOAK_SUCCESS_DEFINITION.md` are met
- [ ] Decide:
  - [ ] Proceed to Deprecation Phase
  - [ ] Extend soak (reason + new end date)
  - [ ] Other

## If Proceeding to Deprecation

- [ ] Create `DEPRECATION_PLAN.md`
- [ ] Mark legacy delegation methods with `@deprecated` JSDoc in `AIBrain.ts`
- [ ] Schedule removal of duplicate methods
- [ ] Communicate to the team

## Artifacts to Attach to Retrospective

- Final `AIBrain.getUsageStats()` output
- Final audit script result
- Screenshot of the live panel
- Any notable user feedback

**Date of completion decision:** 
