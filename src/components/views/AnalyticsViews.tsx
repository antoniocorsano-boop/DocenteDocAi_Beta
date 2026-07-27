// MD3 Compliant
/**
 * AnalyticsViews.tsx
 * Raggruppa viste relative ad analytics e reporting
 * - AnalyticsHub
 * - ReportisticaHub
 * - ImprovementGuide
 * - ConsiglioClasse
 */

import React from 'react';
import AnalyticsHub from '../AnalyticsHub';
import ReportisticaHub from '../ReportisticaHub';
import ImprovementGuide from '../ImprovementGuide';
import ConsiglioClasse from '../ConsiglioClasse';
import {
    Studente, Valutazione, ValutazioneCompetenza, Uda, Lezione, Report,
    GiudizioPeriodico, PianoInclusione, KnowledgeBaseEntry, RegisterEntry,
    TimetableSettings, AiSettings, EventoCalendario
} from '../../types';

export interface AnalyticsViewsProps {
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvals: ValutazioneCompetenza[];
    lessons: Record<string, Lezione>;
    reportistica: Report[];
    giudizi: Record<string, GiudizioPeriodico>;
    pianiInclusione: Record<string, PianoInclusione>;
    knowledgeBase: KnowledgeBaseEntry[];
    finalizedRegister: RegisterEntry[];
    settings: TimetableSettings;
    aiSettings: AiSettings;
    uda: Uda[];
    viewContext?: string;
    onNavigate: (view: string, context?: unknown) => void;
    onDeleteReport: (id: string) => void;
    onSaveReport: (report: Report) => void;
    onSaveGiudizio: (giudizio: GiudizioPeriodico) => void;
    onAddKbEntry: (entry: KnowledgeBaseEntry) => void;
    onViewStudentProfile: (student: Studente) => void;
    setGiudizi: (updater: (prev: Record<string, GiudizioPeriodico>) => Record<string, GiudizioPeriodico>) => void;
    onSaveUda: (uda: Uda) => void;
    onAddLessons: (lessons: Lezione[]) => void;
    onSaveEvent: (event: EventoCalendario) => void;
}

export const AnalyticsViewsRenderer: React.FC<{
    viewType: 'analytics' | 'reportistica' | 'improvement-guide' | 'consiglio-di-classe';
    props: AnalyticsViewsProps;
}> = ({ viewType, props }) => {
    switch (viewType) {
        case 'analytics':
            return (
                <AnalyticsHub
                    userClasses={props.settings.classi}
                    students={props.students}
                    evaluations={props.evaluations}
                    settings={props.settings}
                />
            );
        case 'reportistica':
            return (
                <ReportisticaHub
                    reportistica={props.reportistica}
                    onDeleteReport={props.onDeleteReport}
                    userClasses={props.settings.classi}
                    students={props.students}
                    evaluations={props.evaluations}
                    competencyEvaluations={props.competencyEvals}
                    settings={props.settings}
                    uda={props.uda}
                    lessons={props.lessons}
                    onSaveReport={props.onSaveReport}
                    aiSettings={props.aiSettings}
                    pianiInclusione={props.pianiInclusione}
                    knowledgeBase={props.knowledgeBase}
                    onAddKbEntry={props.onAddKbEntry}
                    onSaveUda={props.onSaveUda}
                    onAddLessons={props.onAddLessons}
                    onSaveEvent={props.onSaveEvent}
                />
            );
        case 'improvement-guide':
            return (
                <ImprovementGuide
                    selectedClass={props.viewContext ?? ''}
                    students={props.students}
                    evaluations={props.evaluations}
                    competencyEvaluations={props.competencyEvals}
                    lessons={props.lessons}
                    register={props.finalizedRegister}
                    settings={props.settings}
                    aiSettings={props.aiSettings}
                />
            );
        case 'consiglio-di-classe':
            return (
                <ConsiglioClasse
                    selectedClass={props.viewContext ?? ''}
                    students={props.students}
                    evaluations={props.evaluations}
                    giudizi={props.giudizi}
                    onSaveGiudizio={props.onSaveGiudizio}
                    settings={props.settings}
                    aiSettings={props.aiSettings}
                    annoScolasticoCorrente={props.settings.annoScolasticoCorrente}
                    onViewStudentProfile={props.onViewStudentProfile}
                    competencyEvaluations={props.competencyEvals}
                />
            );
        default:
            return null;
    }
};

