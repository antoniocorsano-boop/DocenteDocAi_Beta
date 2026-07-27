# SOAK EXIT CRITERIA — When to End the Soak

**Target duration:** 7–14 days from 2026-07-27

## Minimum Requirements to Exit Soak

1. **Adoption**
   - At least 200+ total central calls (`totalCentralCalls`)
   - At least 5 different tasks with ≥ 15 calls each

2. **Quality**
   - Fallback rate < 8% sustained over the last 4-5 days
   - No critical regressions reported

3. **Stability**
   - TSC remains exactly 3 pre-existing errors (no new ones)
   - All Phase 4 invariants still exactly met:
     - ContextualAskAI = 65
     - Post-Fase 4 blocks = 27
     - Legacy aiService in UI = 0

4. **Coverage**
   - High-traffic daily gestures (planning, lessons, reports, studio, inclusivity) have meaningful usage

## Recommended Checkpoints

- **Day 3–4** (2026-07-30/31): First checkpoint
- **Day 7** (2026-08-03): Mid-soak review
- **Day 10–14**: Final decision

## Decision Matrix

| Condition                        | Action                     |
|----------------------------------|----------------------------|
| All minimum requirements met     | Proceed to Deprecation Phase |
| Adoption good but data thin      | Extend soak by 3–5 days    |
| High fallback or issues          | Investigate + extend soak  |
| Invariants broken                | Stop and fix immediately   |

## After Exit

- Create `DEPRECATION_PLAN.md`
- Start marking legacy delegation methods with `@deprecated`
- Begin gradual removal of duplicate methods inside AIBrain
