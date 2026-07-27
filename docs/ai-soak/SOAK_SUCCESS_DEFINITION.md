# SOAK SUCCESS DEFINITION

## What "Successful Soak" Means

The central prompt path (`buildPrompt` + `generateWithCentralPrompt`) is considered successful when **all** of the following are true after 7–14 days:

### 1. Adoption
- Total central calls ≥ 200–300
- At least 5 different task types actively used (e.g. lesson-enrich, class-planning, proactive-suggestions, etc.)

### 2. Reliability
- Fallback rate consistently below 8% in the last 5+ days
- No critical user-reported regressions related to AI features

### 3. Stability
- TSC remains exactly the 3 pre-existing errors (no new ones introduced)
- All Phase 4 invariants remain exactly the same:
  - ContextualAskAI = 65
  - Post-Fase 4 visible blocks = 27
  - Legacy aiService direct in UI = 0

### 4. Coverage
- High-traffic daily gestures (planning wizards, lessons, reports, studio, inclusivity) show meaningful usage

## If These Are Met
→ Proceed to Deprecation Phase (mark legacy methods, start cleanup)

## If Not Fully Met
→ Extend soak by 3–7 days or investigate issues
