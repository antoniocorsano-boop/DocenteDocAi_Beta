// MD3 Compliant
/**
 * EvaluationViews.tsx
 * Raggruppa viste relative a valutazioni, competenze e registro
 * - EvaluationModule
 * - RegisterView
 * - ClassCompetencyDashboard
 * - CompetencyLevelsView
 */

/**
 * EvaluationViews.tsx
 * // M3Expressive refactor: Componente renderer senza stili, già conforme M3.
 */

import React from 'react';
import EvaluationModule from '../EvaluationModule';
import RegisterView from '../RegisterView';
import ClassCompetencyDashboard from '../ClassCompetencyDashboard';
import CompetencyLevelsView from '../CompetencyLevelsView';
import {
    Studente, Valutazione, ValutazioneCompetenza, Lezione, RegisterEntry,
    TimetableSettings, AiSettings
} from '../../types';

export interface EvaluationViewsProps {
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvals: ValutazioneCompetenza[];
    lessons: Record<string, Lezione>;
    finalizedRegister: RegisterEntry[];
    settings: TimetableSettings;
    aiSettings: AiSettings;
    viewContext?: string;
    selectedClass?: string;
    onNavigate: (view: string, context?: unknown) => void;
    setEvaluations: (input: Valutazione[] | ((prev: Valutazione[]) => Valutazione[])) => void;
    setCompetencyEvals: (input: ValutazioneCompetenza[] | ((prev: ValutazioneCompetenza[]) => ValutazioneCompetenza[])) => void;
    onOpenInclusionPlanEditor?: (student: Studente) => void;
    onViewStudentProfile?: (student: Studente) => void;
    showGuidanceTips: boolean;
}

export const EvaluationViewsRenderer: React.FC<{
    viewType: 'evaluations' | 'register' | 'class-competency-dashboard' | 'competency-levels';
    props: EvaluationViewsProps;
}> = ({ viewType, props }) => {
    switch (viewType) {
        case 'evaluations':
            return (
                <EvaluationModule
                    students={props.students}
                    evaluations={props.evaluations}
                    setEvaluations={props.setEvaluations}
                    competencyEvaluations={props.competencyEvals}
                    setCompetencyEvaluations={props.setCompetencyEvals}
                    userClasses={props.settings.classi}
                    settings={props.settings}
                    aiSettings={props.aiSettings}
                    initialClass={props.viewContext}
                    onClearInitialStudent={() => {}}
                    onOpenInclusionPlanEditor={props.onOpenInclusionPlanEditor || (() => {})}
                    showGuidanceTips={props.showGuidanceTips}
                    register={props.finalizedRegister}
                    lessons={props.lessons}
                />
            );
        case 'register':
            return (
                <RegisterView
                    entries={props.finalizedRegister}
                    lessons={props.lessons}
                    students={props.students}
                    initialClass={props.viewContext}
                />
            );
        case 'class-competency-dashboard':
            return (
                <ClassCompetencyDashboard
                    selectedClass={props.selectedClass || 'default-class'}
                    students={props.students}
                    competencyEvaluations={props.competencyEvals}
                    settings={props.settings}
                    onViewStudentProfile={props.onViewStudentProfile || (() => {})}
                />
            );
        case 'competency-levels':
            return (
                <CompetencyLevelsView
                    competenze={props.settings.competenze}
                />
            );
        default:
            return null;
    }
};

