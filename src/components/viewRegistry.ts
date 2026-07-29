// MD3 Compliant
import React, { lazy } from 'react';
import { View } from '../types';

// Lazy loaded views
export const Home = lazy(() => import('./Home'));
export const Timetable = lazy(() => import('./Timetable'));
export const Calendar = lazy(() => import('./Calendar'));
export const Settings = lazy(() => import('./Settings'));
export const ClassSelection = lazy(() => import('./ClassSelection'));
export const ClassDashboard = lazy(() => import('./ClassDashboard'));
export const ClassroomView = lazy(() => import('./ClassroomView'));
export const StudentManager = lazy(() => import('./StudentManager'));
export const EvaluationModule = lazy(() => import('./EvaluationModule'));
export const RegisterView = lazy(() => import('./RegisterView'));
export const ClassCompetencyDashboard = lazy(() => import('./ClassCompetencyDashboard'));
export const ProgettazioneHub = lazy(() => import('./ProgettazioneHub'));
export const LessonsPage = lazy(() => import('./LessonsPage'));
export const UdaPlanner = lazy(() => import('./UdaPlanner'));
export const RubricheManager = lazy(() => import('./RubricheManager'));
export const ReportisticaHub = lazy(() => import('./ReportisticaHub'));
export const KnowledgeBase = lazy(() => import('./KnowledgeBase'));
export const AnalyticsHub = lazy(() => import('./AnalyticsHub'));
export const DidatticaInclusiva = lazy(() => import('./DidatticaInclusiva'));
export const StudentLoginScreen = lazy(() => import('./StudentLoginScreen'));
export const StudentClassroomView = lazy(() => import('./StudentClassroomView'));
export const TeacherInbox = lazy(() => import('./TeacherInbox'));
export const ImprovementGuide = lazy(() => import('./ImprovementGuide'));
export const ConsiglioClasse = lazy(() => import('./ConsiglioClasse'));
export const CompetencyLevelsView = lazy(() => import('./CompetencyLevelsView'));
export const CurriculumManager = lazy(() => import('./CurriculumManager'));
export const TeacherPresentationView = lazy(() => import('./TeacherPresentationView'));
export const Studio = lazy(() => import('./Studio'));
export const OrientamentoDashboard = lazy(() => import('./OrientamentoDashboard'));
export const LiveAssistant = lazy(() => import('./LiveAssistant'));
export const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
export const UserWorkspace    = lazy(() => import('./workspace/UserWorkspace'));
export const WorkspaceRouter  = lazy(() => import('./workspace/WorkspaceRouter'));
export const CopilotView      = lazy(() => import('./views/CopilotView'));
export const AssistantView    = lazy(() => import('./views/AssistantView'));
export const FeedManager      = lazy(() => import('./FeedManager'));
export const WelcomeScreen      = lazy(() => import('./WelcomeScreen'));
export const ClassroomTools     = lazy(() => import('./ClassroomTools'));
export const VideoAnalysisModal = lazy(() => import('./VideoAnalysisModal'));

export interface ViewConfig {
    id: View;
     
    component: React.LazyExoticComponent<React.ComponentType<Record<string, never>>>;
    fullWidth?: boolean;
    auraWrapper?: boolean;
}

export const VIEW_CONFIGS: Partial<Record<View, ViewConfig>> = {
    'home': { id: 'home', component: Home, auraWrapper: true },
    'timetable': { id: 'timetable', component: Timetable, auraWrapper: true },
    'calendario': { id: 'calendario', component: Calendar, auraWrapper: true },
    'settings': { id: 'settings', component: Settings, auraWrapper: true },
    'aula': { id: 'aula', component: ClassSelection, auraWrapper: true },
    'studenti': { id: 'studenti', component: StudentManager, auraWrapper: true },
    'progettazione-hub': { id: 'progettazione-hub', component: ProgettazioneHub, auraWrapper: true },
    'reportistica': { id: 'reportistica', component: ReportisticaHub, auraWrapper: true },
    'knowledge-base': { id: 'knowledge-base', component: KnowledgeBase, auraWrapper: true },
    'studio': { id: 'studio', component: Studio, auraWrapper: true, fullWidth: true },
    'lessons': { id: 'lessons', component: LessonsPage, auraWrapper: true },
    'uda': { id: 'uda', component: UdaPlanner, auraWrapper: true },
    'rubriche': { id: 'rubriche', component: RubricheManager, auraWrapper: true },
    'didattica-inclusiva': { id: 'didattica-inclusiva', component: DidatticaInclusiva, auraWrapper: true },
    'evaluations': { id: 'evaluations', component: EvaluationModule, auraWrapper: true },
    'register': { id: 'register', component: RegisterView, auraWrapper: true },
    'improvement-guide': { id: 'improvement-guide', component: ImprovementGuide, auraWrapper: true },
    'consiglio-di-classe': { id: 'consiglio-di-classe', component: ConsiglioClasse, auraWrapper: true },
    'class-competency-dashboard': { id: 'class-competency-dashboard', component: ClassCompetencyDashboard, auraWrapper: true },
    'analytics': { id: 'analytics', component: AnalyticsHub, auraWrapper: true },
    'student-dashboard': { id: 'student-dashboard', component: StudentLoginScreen, auraWrapper: true },
    'student-workspace': { id: 'student-workspace', component: StudentClassroomView, auraWrapper: true, fullWidth: true },
    'competency-levels': { id: 'competency-levels', component: CompetencyLevelsView, auraWrapper: true },
    'live-assistant': { id: 'live-assistant', component: LiveAssistant, auraWrapper: true, fullWidth: true },
    'curriculum-manager': { id: 'curriculum-manager', component: CurriculumManager, auraWrapper: true, fullWidth: true },
    'teacher-inbox': { id: 'teacher-inbox', component: TeacherInbox, auraWrapper: true },
    'teacher-presentation-view': { id: 'teacher-presentation-view', component: TeacherPresentationView, auraWrapper: true },
    'orientamento': { id: 'orientamento', component: OrientamentoDashboard, auraWrapper: true, fullWidth: true },
    'teacher-dashboard': { id: 'teacher-dashboard', component: TeacherDashboard, auraWrapper: true },
    'workspace':          { id: 'workspace',          component: WorkspaceRouter,  auraWrapper: true },
    'copilot':            { id: 'copilot',            component: CopilotView,      auraWrapper: true, fullWidth: true },
    'assistente':         { id: 'assistente',         component: AssistantView,    auraWrapper: true, fullWidth: true },
    'feed-manager':       { id: 'feed-manager',       component: FeedManager,    auraWrapper: true },
    'welcome':            { id: 'welcome',            component: WelcomeScreen,  auraWrapper: true },
    // 'classroom-tools' and 'video-analysis' are special (launched via modals / navigation, not top-level registry views)
    'video-analysis':     { id: 'video-analysis',     component: VideoAnalysisModal, auraWrapper: true, fullWidth: true },
    // Legacy / special (kept for compatibility, often launched via navigation or modals or other flows)
};

// ---------------------------------------------------------------------------
// VIEW_LABELS — label leggibile per ogni view (usato da Breadcrumb e <title>)
// ---------------------------------------------------------------------------
export const VIEW_LABELS: Record<View, string> = {
    'home':                         'Home',
    'timetable':                    'Orario',
    'calendario':                   'Agenda',
    'settings':                     'Impostazioni',
    'aula':                         'Classi',
    'studenti':                     'Studenti',
    'progettazione-hub':            'Progettazione',
    'reportistica':                 'Reportistica',
    'knowledge-base':               'Knowledge Base',
    'studio':                       'Studio AI',
    'lessons':                      'Lezioni',
    'uda':                          'UDA',
    'rubriche':                     'Rubriche',
    'didattica-inclusiva':          'Didattica Inclusiva',
    'feed-manager':                 'Feed',
    'evaluations':                  'Valutazioni',
    'register':                     'Registro',
    'improvement-guide':            'Piano di Miglioramento',
    'consiglio-di-classe':          'Consiglio di Classe',
    'class-competency-dashboard':   'Dashboard Competenze',
    'analytics':                    'Analisi Classe',
    'student-dashboard':            'Area Studenti',
    'student-workspace':            'Spazio Studente',
    'aula-session':                 'Sessione in Aula',
    'competency-levels':            'Livelli di Competenza',
    'live-assistant':               'Assistente Live',
    'welcome':                      'Benvenuto',
    'orientamento':                 'Orientamento',
    'curriculum-manager':           'Curriculum',
    'teacher-inbox':                'Inbox Docente',
    'video-analysis':               'Analisi Video',
    'teacher-presentation-view':    'Presentazione',
    'teacher-dashboard':             'Dashboard Docente',
    'copilot':                       'Copilot Docente',
    'assistente':                    'Assistente',
    'workspace':                     'Spazio di Lavoro',
};

// ---------------------------------------------------------------------------
// VIEW_PARENT — mappa ogni sub-view alla voce primaria di navigazione genitore
// (Fase 3 prep — aligned to 5 voices)
// ---------------------------------------------------------------------------
export const VIEW_PARENT: Partial<Record<View, View>> = {
    // === Sotto Pianifica (progettazione-hub) ===
    'knowledge-base':           'progettazione-hub',
    'studio':                   'progettazione-hub',
    'lessons':                  'progettazione-hub',
    'uda':                      'progettazione-hub',
    'rubriche':                 'progettazione-hub',
    'reportistica':             'progettazione-hub',
    'didattica-inclusiva':      'progettazione-hub',
    'curriculum-manager':       'progettazione-hub',
    'competency-levels':        'progettazione-hub',
    'calendario':               'progettazione-hub',
    'timetable':                'progettazione-hub',
    // (removed legacy 'annual-planning-wizard')

    // === Sotto Aula ===
    'evaluations':              'aula',
    'register':                 'aula',
    'studenti':                 'aula',
    'improvement-guide':        'aula',
    'consiglio-di-classe':      'aula',
    'class-competency-dashboard': 'aula',
    'teacher-inbox':            'aula',
    'aula-session':             'aula',
    'live-assistant':           'aula',
    'teacher-presentation-view': 'aula',
    'teacher-dashboard':        'aula',
    'student-dashboard':        'aula',
    'student-workspace':        'aula',
    'orientamento':             'aula',

    // === Top-level voices (direct) ===
    'home':                     'home',
    'assistente':               'assistente',
    'progettazione-hub':        'progettazione-hub',
    'aula':                     'aula',

    // Misc (Altro / legacy)
    'settings':                 'home',
    'copilot':                  'assistente',
    'workspace':                'progettazione-hub',
    'welcome':                  'home',
    'feed-manager':             'progettazione-hub',
    'video-analysis':           'aula',
};

// ---------------------------------------------------------------------------
// PREFETCH_MAP — adjacent views to warm-load after the current view renders.
// Used by usePrefetch hook (Roadmap #21).
// ---------------------------------------------------------------------------
export const PREFETCH_MAP: Partial<Record<View, Array<() => Promise<unknown>>>> = {
    'home': [
        (): Promise<unknown> => import('./ProgettazioneHub'),
        (): Promise<unknown> => import('./ClassSelection'),
        (): Promise<unknown> => import('./Calendar'),
        (): Promise<unknown> => import('./AnalyticsHub'),
    ],
    'progettazione-hub': [
        (): Promise<unknown> => import('./UdaPlanner'),
        (): Promise<unknown> => import('./LessonsPage'),
        (): Promise<unknown> => import('./ReportisticaHub'),
        (): Promise<unknown> => import('./KnowledgeBase'),
        (): Promise<unknown> => import('./Studio'),
        (): Promise<unknown> => import('./CurriculumManager'),
    ],
    'aula': [
        (): Promise<unknown> => import('./ClassDashboard'),
        (): Promise<unknown> => import('./EvaluationModule'),
        (): Promise<unknown> => import('./ClassroomView'),
        (): Promise<unknown> => import('./StudentManager'),
        (): Promise<unknown> => import('./RegisterView'),
        (): Promise<unknown> => import('./ImprovementGuide'),
    ],
    'analytics': [
        (): Promise<unknown> => import('./ClassCompetencyDashboard'),
        (): Promise<unknown> => import('./ReportisticaHub'),
    ],
    'uda': [
        (): Promise<unknown> => import('./LessonsPage'),
        (): Promise<unknown> => import('./ReportisticaHub'),
        (): Promise<unknown> => import('./RubricheManager'),
    ],
    'studenti': [
        (): Promise<unknown> => import('./EvaluationModule'),
        (): Promise<unknown> => import('./ClassCompetencyDashboard'),
        (): Promise<unknown> => import('./DidatticaInclusiva'),
        (): Promise<unknown> => import('./OrientamentoDashboard'),
    ],
    'studio': [
        (): Promise<unknown> => import('./KnowledgeBase'),
        (): Promise<unknown> => import('./AnalyticsHub'),
        (): Promise<unknown> => import('./LessonsPage'),
    ],
    'evaluations': [
        (): Promise<unknown> => import('./ClassCompetencyDashboard'),
        (): Promise<unknown> => import('./RegisterView'),
        (): Promise<unknown> => import('./ImprovementGuide'),
    ],
    'assistente': [
        (): Promise<unknown> => import('./ProgettazioneHub'),
        (): Promise<unknown> => import('./AnalyticsHub'),
    ],
    'lessons': [
        (): Promise<unknown> => import('./UdaPlanner'),
        (): Promise<unknown> => import('./ProgettazioneHub'),
    ],
    'welcome': [
        (): Promise<unknown> => import('./ClassSelection'),
        (): Promise<unknown> => import('./ProgettazioneHub'),
    ],
    // classroom-tools is special (launched from Aula, not prefetched as top-level)
    'video-analysis': [
        (): Promise<unknown> => import('./Studio'),
        (): Promise<unknown> => import('./KnowledgeBase'),
    ],
};
