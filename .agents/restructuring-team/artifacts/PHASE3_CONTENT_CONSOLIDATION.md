# Fase 3 — Content Consolidation + Full View Mapping

**Date:** 2026-07-25  
**Status:** In Progress (initial rollout)  
**Previous:** Fase 0 + 1 + 2 COMPLETE (2 AI entry points + 5-voice nav + 27 AskAIButtons)

## Objectives (from FINAL_RESTRUCTURING_PLAN)
1. Map **all** 35+ views strictly under 5 macro-voices (Oggi / Aula / Pianifica / Analisi / Assistente).
2. Clean legacy drawer groups → align SECONDARY_NAV_GROUPS to macro + "Altro".
3. Expand VIEW_PARENT / PREFETCH_MAP.
4. Consolidate duplicate content / shared patterns under macro folders (future).
5. Ensure 100% high-traffic views have contextual AskAIButton + proper `onNavigate`.
6. Prepare for full content migration (Phase 4).

## Accomplished in this session (Fase 3 kickoff)
- **Added contextual AskAIButton** (with rich context) to:
  - CompetencyLevelsView (source: 'competency-levels')
  - TeacherDashboard (compact + selectedClass context)
  - TeacherPresentationView (source + "Chiedi all'AI per iniziare")
  - ClassroomView (aula-session) — { source: 'aula-session', classe, lessonId }

- **ViewManager updates**:
  - competency-levels: now forwards `onNavigate`
  - teacher-dashboard / teacher-presentation-view already wired
  - aula-session / ClassroomView: accepts optional `onNavigate`
  - All major cases now pass onNavigate where relevant

- **Types**:
  - ClassroomViewProps.onNavigate made optional (backward compat)

- **View Registry**:
  - VIEW_PARENT significantly expanded:
    - Added annual-planning-wizard, teacher-dashboard, classroom-tools
    - Added explicit top-level anchors (`home`, `analytics`, `assistente`, etc.)
    - Misc / legacy entries grouped

- **Navigation invariants**:
  - All new buttons navigate **exclusively** to `'assistente'` (P44.6)
  - Context passed via `NavigationParams` (classe, source, lessonId, etc.)
  - AssistantView context banner already present and non-invasive

## Updated View Mapping (current state)

### Oggi (home)
- Home (AskAIButton + teaser)
- TeacherPresentationView (new)

### Aula
- ClassSelection / ClassDashboard
- ClassroomView (aula-session) — **NEW contextual AI**
- StudentManager, EvaluationModule, RegisterView
- ImprovementGuide, ConsiglioClasse, ClassCompetencyDashboard
- TeacherInbox, DidatticaInclusiva
- OrientamentoDashboard, TeacherDashboard (new)
- Analytics (also top voice)

### Pianifica (progettazione-hub)
- ProgettazioneHub, LessonsPage, UdaPlanner
- RubricheManager, KnowledgeBase, Studio
- CurriculumManager, ReportisticaHub
- Timetable, Calendar, CompetencyLevelsView (new)

### Analisi
- AnalyticsHub (contextual)

### Assistente (dedicated destination)
- AssistantView (receives + displays context)

## Stats (end of Fase 3 kickoff)
- AskAIButton usage: **27 files**
- Views with forwarded `onNavigate`: **22+**
- Views with context= : **23+**
- 5-voice model: 100% enforced (navConfig.ts single source)
- Legacy inline chat: 0
- P44.6 / MD3 / Zustand core: untouched

## Files touched in Fase 3 session
- CompetencyLevelsView.tsx
- TeacherDashboard.tsx
- TeacherPresentationView.tsx
- ClassroomView.tsx
- ViewManager.tsx
- viewRegistry.ts (VIEW_PARENT)
- types.ts (ClassroomViewProps)
- .agents/.../EXECUTION_LOG.md
- .agents/.../artifacts/PHASE3_*.md (new)
- .agents/.../artifacts/VIEW_MAPPING.md (updated)

## Remaining Fase 3 work
1. Audit every remaining view in VIEW_CONFIGS (AnnualPlanningWizard, OnboardingWizard, CopilotView, etc.)
2. Update SECONDARY_NAV_GROUPS strictly to 5 voices + Altro
3. Expand PREFETCH_MAP
4. Create macro folders (src/views/oggi, aula, pianifica, analisi, assistente) — optional structural
5. Content deduplication (e.g. shared planning components)
6. Full tsc + build verification (when deps present)
7. Update Breadcrumb / Header navigation hints for macro areas

## Artifacts
- VIEW_MAPPING.md (expanded)
- PHASE3_CONTENT_CONSOLIDATION.md (this file)
- EXECUTION_LOG.md (detailed)

**Invariant check:** ✅ All AI entry points still exactly 2 (FAB/Satellite + dedicated Assistente view). Contextual buttons are **only** shortcuts to the same destination.

Ready to continue Fase 3 or run verification commands.