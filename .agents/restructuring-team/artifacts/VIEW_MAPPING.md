# View Mapping under 5-Voice Navigation (Fase 3 — FINAL)

**Date:** 2026-07-26  
**Status:** COMPLETE — full coverage

## 5 Canonical Voices (Single Source of Truth: navConfig.ts)
1. **Oggi** → `home`
2. **Aula** → `aula`
3. **Pianifica** → `progettazione-hub`
4. **Analisi** → `analytics`
5. **Assistente** → `assistente` (dedicated AI)

## Full Macro-Area Mapping (FINAL)

### Oggi
- Home.tsx (AskAIButton primary teaser)
- TeacherPresentationView

### Aula
- ClassSelection.tsx
- ClassDashboard.tsx (contextual)
- ClassroomView (aula-session, contextual)
- StudentManager
- EvaluationModule
- RegisterView
- ImprovementGuide
- ConsiglioClasse
- ClassCompetencyDashboard
- TeacherInbox
- DidatticaInclusiva
- OrientamentoDashboard
- TeacherDashboard (compact)
- **StudentLoginScreen** (student-dashboard — AskAIButton + onNavigate)
- **StudentClassroomView** (student-workspace — contextual + onNavigate)

### Pianifica
- ProgettazioneHub
- LessonsPage
- UdaPlanner
- RubricheManager
- KnowledgeBase
- Studio
- CurriculumManager
- ReportisticaHub
- Timetable
- Calendar
- CompetencyLevelsView
- AnnualPlanningWizard (via hub)

### Analisi
- AnalyticsHub (contextual)

### Assistente (dedicated)
- AssistantView (SmartChat + context banner)

### Supporting / Special (AI layer access)
- **CopilotView** (with AskAIButton)
- **LiveAssistant** (with AskAIButton)
- **UserWorkspace** (workspace — AskAIButton in header + onNavigate)
- FeedManager
- CompetencyManager
- **WelcomeScreen** (onboarding — AskAIButton + onNavigate)
- **ClassroomTools** (embedded in aula-session — AskAIButton + onNavigate)
- **VideoAnalysisModal** (modal — AskAIButton + onNavigate)

## SecondaryNavDrawer (FINAL)
- Aula
- Pianifica
- Risorse & Analisi
- Altro (orientamento, student-dashboard, settings)

## AskAIButton + Context Coverage
**38+ files** — exhaustive across 5 voices + specials.

All navigation to `'assistente'` + optional `NavigationParams` (classe, source, etc.).

## Registry / Types / ViewManager
- All VIEW_CONFIGS wired
- VIEW_PARENT fully expanded
- PREFETCH_MAP adjacent-optimized
- All relevant Props interfaces include `onNavigate?: ...`
- ViewManager forwards `handleNavigate` to 30+ views

**Status: FULL 5-VOICE + CONTEXTUAL AI LAYER COMPLETE**

## Phase 4 Consolidation Notes (2026-07-26)
- All high-traffic hubs/dashboards now use standardized **HubShell** (7 total):
  - AnalyticsHub, ClassDashboard, ProgettazioneHub, ReportisticaHub, Studio, KnowledgeBase, DidatticaInclusiva
- **ToolsGrid** adopted for tool/action sections (ClassDashboard, ProgettazioneHub, ClassSelection)
- Contextual AI teaser pattern centralized in **ContextualAskAI** (31+ locations)
- 0 explicit labels — smart resolver in AskAIButton active everywhere
- All views remain aligned to 5-voice macro structure
- Raw layout duplication significantly reduced

**HubShell + ToolsGrid** deliver the structural consolidation target of Phase 4.
