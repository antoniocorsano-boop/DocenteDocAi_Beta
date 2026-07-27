# PHASE 4 START — Content Consolidation + Deduplication + Label Consistency

**Date:** 2026-07-26  
**Previous:** Phase 3 COMPLETE (exhaustive 5-voice + contextual AI)

## Status at Phase 4 Kickoff
- **AskAIButton deployments**: 43 files (all high-traffic + specials)
- **Explicit `label=` props on AskAIButton**: **0** (now using smart defaults)
- **Smart label derivation** implemented in AskAIButton (CANONICAL map + context fallback)
- **onNavigate forwards**: 29+
- **VIEW_CONFIGS**: 37
- Legacy chat: 0
- 5 voices: strictly enforced

## Phase 4 Goals
1. **Label Consistency** — All "Chiedi all’AI" buttons now use the smart resolver (no more scattered explicit labels).
2. **Content Deduplication** — Identify & consolidate repeated UI/hub patterns:
   - Multiple *Hub / *Dashboard files (AnalyticsHub, ProgettazioneHub, ClassDashboard, etc.)
   - Repeated card/grid patterns
   - Wizard duplication
3. **Hub Consolidation** — Evaluate merging or macro-structuring:
   - `ProgettazioneHub` + sub-wizards
   - Analytics-related dashboards
4. **Optional macro folder restructure**:
   ```
   src/components/views/
     oggi/
     aula/
     pianifica/
     analisi/
     assistente/
   ```
5. **Polish**:
   - Improve AssistantView context pre-seeding (non-invasive)
   - Further registry/PREFETCH refinement
   - Prepare for build + E2E

## Immediate Wins (already done in this session)
- Removed ~30+ explicit `label=` props
- Centralized smart labels in `AskAIButton.tsx` (CANONICAL map)
- All calls now rely on context-driven defaults

## Next Actions (recommended)
1. Audit remaining *Hub/*Dashboard for duplication
2. Create shared "HubShell" or "MacroCard" components
3. Decide on folder macro-structure
4. Run `npm run build` + `tsc` when deps available
5. Update EXECUTION_LOG + create PHASE4_PROGRESS

**Current state**: Excellent foundation. Phase 3 invariants preserved. Phase 4 can focus on **cohesion** and **maintainability**.