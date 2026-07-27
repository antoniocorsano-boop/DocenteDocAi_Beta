// MD3 Compliant
/**
 * PlanningViews.tsx
 * Raggruppa viste relative a pianificazione didattica
 * - ProgettazioneHub
 * - UdaPlanner
 * - RubricheManager
 * - DidatticaInclusiva
 * - CurriculumManager
 */

/**
 * PlanningViews.tsx
 * // M3Expressive refactor: Componente renderer senza stili, già conforme M3.
 */

import React from 'react';
import ProgettazioneHub from '../ProgettazioneHub';
import UdaPlanner from '../UdaPlanner';
import RubricheManager from '../RubricheManager';
import DidatticaInclusiva from '../DidatticaInclusiva';
import CurriculumManager from '../CurriculumManager';
import {
    Uda, Rubrica, PianoInclusione, EventoCalendario, KnowledgeBaseEntry,
    Lezione, Studente, Valutazione, ValutazioneCompetenza, Competenza,
    TimetableSettings, AiSettings, CurriculumSubject
} from '../../types';

export interface PlanningViewsProps {
    uda: Uda[];
    eventi: EventoCalendario[];
    rubriche: Rubrica[];
    pianiInclusione: Record<string, PianoInclusione>;
    knowledgeBase: KnowledgeBaseEntry[];
    lessons: Record<string, Lezione>;
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvals: ValutazioneCompetenza[];
    settings: TimetableSettings;
    aiSettings: AiSettings;
    curricula: CurriculumSubject[];
    viewContext?: { action?: string; student?: Studente };
    onNavigate: (view: string, context?: unknown) => void;
    onSaveUda: (uda: Uda) => void;
    onSaveRubrica: (rubrica: Rubrica) => void;
    onSavePiano: (piano: PianoInclusione) => void;
    onDeleteRubrica: (id: string) => void;
    onDeletePiano: (id: string) => void;
    onDeleteUda: (id: string) => void;
    onSaveReport: (report: unknown) => void;
    onSaveEvent: (event: EventoCalendario) => void;
    onAddLessons: (lessons: Lezione[]) => void;
    setUdas: (updater: (prev: Uda[]) => Uda[]) => void;
    setRubriche: (updater: (prev: Rubrica[]) => Rubrica[]) => void;
    setPianiInclusione: (updater: (prev: Record<string, PianoInclusione>) => Record<string, PianoInclusione>) => void;
    setCurricula: (curricula: CurriculumSubject[]) => void;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    showGuidanceTips: boolean;
    setIsLoadingModalOpen: (open: boolean) => void;
    setLoadingModalMessage: (message: string) => void;
    setIsGlobalAiLoading: (loading: boolean) => void;
    setViewContext: (updater: (prev: unknown) => unknown) => void;
    onUpdateCompetencies?: (comp: Competenza[]) => void;
}

export const PlanningViewsRenderer: React.FC<{
    viewType: 'progettazione-hub' | 'uda' | 'rubriche' | 'didattica-inclusiva' | 'curriculum-manager';
    props: PlanningViewsProps;
}> = ({ viewType, props }) => {
    switch (viewType) {
        case 'progettazione-hub':
            return (
                <ProgettazioneHub
                    onNavigate={props.onNavigate as unknown as import('../../types').ProgettazioneHubProps['onNavigate']}
                    udas={props.uda}
                    events={props.eventi}
                    settings={props.settings}
                    aiSettings={props.aiSettings}
                    onSaveUda={props.onSaveUda}
                    onAddLessons={props.onAddLessons}
                    onSaveReport={props.onSaveReport as unknown as import('../../types').ProgettazioneHubProps['onSaveReport']}
                    onSaveEvent={props.onSaveEvent}
                    initialAction={props.viewContext?.action}
                    knowledgeBase={props.knowledgeBase}
                    showToast={props.showToast}
                    showGuidanceTips={props.showGuidanceTips}
                    setIsLoadingModalOpen={props.setIsLoadingModalOpen}
                    setLoadingModalMessage={props.setLoadingModalMessage}
                    students={props.students}
                    pianiInclusione={props.pianiInclusione}
                    onUpdateCompetencies={props.onUpdateCompetencies || (() => {})}
                    curricula={props.curricula}
                />
            );
        case 'uda':
            return (
                <UdaPlanner
                    uda={props.uda}
                    onSaveUda={props.onSaveUda}
                    onDeleteUda={props.onDeleteUda}
                    lessons={props.lessons}
                    onUpdateUdaLessons={() => {}}
                    aiSettings={props.aiSettings}
                    knowledgeBase={props.knowledgeBase}
                    competenze={props.settings.competenze}
                    settings={props.settings}
                    onSaveReport={props.onSaveReport}
                    onNavigate={props.onNavigate}
                    showToast={props.showToast}
                    showGuidanceTips={props.showGuidanceTips}
                    setIsLoadingModalOpen={props.setIsLoadingModalOpen}
                    setLoadingModalMessage={props.setLoadingModalMessage}
                    eventi={props.eventi}
                    onAddLessons={props.onAddLessons}
                    onSaveEvent={props.onSaveEvent}
                    curricula={props.curricula}
                />
            );
        case 'rubriche':
            return (
                <RubricheManager
                    competenze={props.settings.competenze}
                    rubriche={props.rubriche}
                    onSaveRubrica={props.onSaveRubrica}
                    onDeleteRubrica={props.onDeleteRubrica}
                    onNavigate={props.onNavigate}
                />
            );
        case 'didattica-inclusiva':
            return (
                <DidatticaInclusiva
                    students={props.students}
                    pianiInclusione={props.pianiInclusione}
                    onSavePiano={props.onSavePiano}
                    onDeletePiano={props.onDeletePiano}
                    aiSettings={props.aiSettings}
                    evaluations={props.evaluations}
                    competencyEvaluations={props.competencyEvals}
                    settings={props.settings}
                    studentToEdit={props.viewContext?.student}
                    onClearStudentToEdit={() => props.setViewContext(prev => ({ ...(prev ?? {}), student: undefined }))}
                    showToast={props.showToast}
                    showGuidanceTips={props.showGuidanceTips}
                    onAiProcessing={props.setIsGlobalAiLoading}
                />
            );
        case 'curriculum-manager':
            return (
                <CurriculumManager
                    curricula={props.curricula || []}
                    onUpdateCurricula={props.setCurricula}
                    settings={props.settings}
                    aiSettings={props.aiSettings}
                    onNavigate={props.onNavigate}

                />
            );
        default:
            return null;
    }
};

