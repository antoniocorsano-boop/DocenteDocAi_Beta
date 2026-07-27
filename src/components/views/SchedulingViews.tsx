// MD3 Compliant
/**
 * SchedulingViews.tsx
 * Raggruppa viste relative a orari, calendari e lezioni
 * - Timetable
 * - Calendar  
 * - LessonsPage
 */

/**
 * SchedulingViews.tsx
 * // M3Expressive refactor: Componente renderer senza stili, già conforme M3.
 */

import React from 'react';
import { Timetable } from '../Timetable';
import Calendar from '../Calendar';
import LessonsPage from '../LessonsPage';
import {
    Lezione, EventoCalendario, CurriculumSubject, TimetableSettings,
    AiSettings, SystemSuggestion, Slot
} from '../../types';

export interface SchedulingViewsProps {
    slots: Record<string, Slot>;
    lessons: Record<string, Lezione>;
    settings: TimetableSettings;
    eventi: EventoCalendario[];
    aiSettings: AiSettings;
    activeSuggestion: SystemSuggestion | null;
    curricula: CurriculumSubject[];
    onEditSlot: (giorno: string, ora: string) => void;
    onShowSlotActions: (giorno: string, ora: string, slotKey: string) => void;
    onAiSuggest: () => void;
    onNavigate: (view: string, context?: unknown) => void;
    onScheduleLesson: (data: unknown) => void;
    onAddLessons: (lessons: Lezione[]) => void;
    onUpdateLesson: (lesson: Lezione) => void;
    onStartClassroom: (classe: string, materia: string, draftKey: string, lesson: Lezione) => void;
    setIsLoadingModalOpen: (open: boolean) => void;
    setLoadingModalMessage: (message: string) => void;
    setEventi: React.Dispatch<React.SetStateAction<EventoCalendario[]>>;
    activeSlotKey?: string;
    showGuidanceTips: boolean;
}

export const SchedulingViewsRenderer: React.FC<{
    viewType: 'timetable' | 'calendario' | 'lessons';
    props: SchedulingViewsProps;
}> = ({ viewType, props }) => {
    switch (viewType) {
        case 'timetable':
            return (
                <Timetable
                    slots={props.slots}
                    lessons={props.lessons}
                    settings={props.settings}
                    onEditSlot={props.onEditSlot}
                    onShowSlotActions={(slot: { giorno: string; ora: string }) => {
                        props.onShowSlotActions(slot.giorno, slot.ora, `${slot.giorno}-${slot.ora}`);
                    }}
                    onAiSuggest={props.onAiSuggest}
                    activeSlotKey={props.activeSlotKey}
                    showGuidanceTips={props.showGuidanceTips}
                />
            );
        case 'calendario':
            return (
                <Calendar
                    eventi={props.eventi}
                    setEventi={props.setEventi}
                    aiSettings={props.aiSettings}
                    activeSuggestion={props.activeSuggestion}
                    onNavigate={props.onNavigate}
                />
            );
        case 'lessons':
            return (
                <LessonsPage
                    lessons={Object.values(props.lessons)}
                    uda={[]}
                    knowledgeBase={[]}
                    userClasses={props.settings.classi}
                    onViewLesson={() => {}}
                    onAddLessons={props.onAddLessons}
                    onUpdateLesson={props.onUpdateLesson}
                    onStartClassroom={props.onStartClassroom}
                    aiSettings={props.aiSettings}
                    setIsLoadingModalOpen={props.setIsLoadingModalOpen}
                    setLoadingModalMessage={props.setLoadingModalMessage}
                    slots={props.slots}
                    onScheduleLesson={props.onScheduleLesson}
                    curricula={props.curricula}
                    settings={props.settings}
                />
            );
        default:
            return null;
    }
};

