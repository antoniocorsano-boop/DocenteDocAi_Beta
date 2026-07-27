// MD3 GOLD COMPLIANT — AUDIT 2026-01-25
// Tutti i valori di design (colori, spacing, tipografia, elevazione, shape) sono gestiti esclusivamente tramite token MD3 (`var(--md-sys-*)`).
// Nessun valore hardcoded (px, rem, %, hex, rgba) presente. Nessun uso di className custom. Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md.
// Audit e refactor completati: 2026-01-25.
import React from 'react';
import SlotActionModal from './SlotActionModal';
import SyncConflictModal from './SyncConflictModal';
import { CreateLessonFromAiModal } from './CreateLessonFromAiModal';

import EditSlotModal from './EditSlotModal';
import type { 
    AppState, 
    AppActions, 
    Modals, 
    Lezione, 
    Slot
} from '../types';

interface ModalManagerProps {
    appState: AppState;
    actions: AppActions;
    modals: Partial<Modals>;
}

export const ModalManager: React.FC<ModalManagerProps> = ({ appState, actions, modals }) => {
    const { students, settings, draftRegister, slots, lessons, pianiInclusione, knowledgeBase, aiSettings } = appState;
    const { onScheduleLesson, setLessons, setSlots, handleStartClassroom } = actions;

      const activeSlot = modals.activeSlotKey ? slots[modals.activeSlotKey] : null;
    const activeLesson = modals.lessonViewContext;

    // Check if there is an active draft for this slot
    const isDraftExisting = modals.activeSlotKey ? !!draftRegister[modals.activeSlotKey] : false;

    return (
        <>
            {modals.syncConflictModal?.isOpen && modals.syncConflictModal?.data && (
                <SyncConflictModal
                    data={modals.syncConflictModal.data}
                    onRestore={() => {
                        actions.handleRestoreFromDrive();
                        modals.setSyncConflictModal?.({ isOpen: false, data: null });
                    }}
                    onIgnore={() => {
                        actions.handleSyncToDrive();
                        modals.setSyncConflictModal?.({ isOpen: false, data: null });
                    }}
                />
            )}

            {modals.createLessonContext?.isOpen && modals.createLessonContext?.lezione && (
                <CreateLessonFromAiModal
                    content={{ title: '', htmlContent: '', ...(modals.createLessonContext.lezione as object) }}
                    onClose={() => modals.setCreateLessonContext?.({ isOpen: false, slotKey: null, lezione: null })}
                    onSave={(lessonData: Omit<import('../types').Lezione, 'id' | 'svolta'>) => {
                        const newLesson = {
                            ...lessonData,
                            id: `lesson-ai-${Date.now()}`,
                            svolta: false
                        };
                        actions.setLessons((prev: Record<string, Lezione>) => ({ ...prev, [newLesson.id]: newLesson }));
                        actions.showToast('Lezione creata da AI!', 'success');
                    }}
                    userClasses={settings.classi}
                    disciplines={settings.disciplines}
                    students={students}
                    pianiInclusione={pianiInclusione}
                    aiSettings={aiSettings}
                    slots={slots}
                    onSchedule={onScheduleLesson}
                    curricula={appState.curricula}
                />
            )}

            {activeSlot && activeLesson && modals.activeSlotKey && !modals.editingSlotKey && (
                <SlotActionModal
                    slot={activeSlot}
                    lesson={activeLesson}
                    isDraftExisting={isDraftExisting}
                    onClose={() => { modals.setActiveSlotKey?.(null); modals.setLessonViewContext?.(null); }}
                    onEdit={() => { modals.setEditingSlotKey?.(modals.activeSlotKey ?? null); modals.setActiveSlotKey?.(null); }}
                    onStart={() => {
                        actions.handleStartClassroom(activeSlot.classe!, activeSlot.materia!, modals.activeSlotKey!, activeLesson);
                        modals.setActiveSlotKey?.(null);
                    }}
                    onView={() => {
                        actions.handleNavigate('lessons');
                        modals.setActiveSlotKey?.(null);
                    }}
                />
            )}

            {/* Edit slot modal (open when user clicks an empty cell or chooses Edit) */}
            {modals.editingSlotKey ? (() => {
                const slotKey = modals.editingSlotKey as string;
                if (!slotKey) return null;
                const slot = slots[slotKey] || { giorno: slotKey.split('-')[0] || '', ora: slotKey.split('-')[1] || '' };
                const lesson = slot && slot.lezioneId ? lessons[slot.lezioneId] : undefined;
                return (
                    <EditSlotModal
                        slot={slot}
                        lesson={lesson}
                        allLessons={lessons}
                        allSlots={slots}
                        udas={appState.uda}
                        onClose={() => { modals.setEditingSlotKey?.(null); }}
                        onSave={(key: string, slotData: Slot) => {
                            setSlots((prev: Record<string, Slot>) => ({ ...prev, [key]: slotData }));
                            modals.setEditingSlotKey?.(null);
                        }}
                        onDelete={(key: string) => {
                            // remove lesson association if exists
                            const s = slots[key];
                            if (s?.lezioneId) {
                                const lid = s.lezioneId;
                                setLessons((prev: Record<string, Lezione>) => {
                                    const cp = { ...prev };
                                    delete cp[lid];
                                    return cp;
                                });
                            }
                            setSlots((prev: Record<string, Slot>) => {
                                const cp = { ...prev };
                                delete cp[key];
                                return cp;
                            });
                            modals.setEditingSlotKey?.(null);
                        }}
                        onSaveLesson={(lessonData: Lezione | undefined, key: string) => {
                            if (!lessonData) return;
                            const id = lessonData.id || `les-${Date.now()}`;
                            const newLesson = { ...lessonData, id };
                            setLessons((prev: Record<string, Lezione>) => ({ ...prev, [id]: newLesson }));
                            setSlots((prev: Record<string, Slot>) => ({ ...prev, [key]: { ...(prev[key] || {}), lezioneId: id, classe: newLesson.classe ?? ', materia: newLesson.materia ?? ' } }));
                            modals.setEditingSlotKey?.(null);
                        }}
                        onStartClassroom={(classe: string, materia: string, key: string, lessonObj: Lezione | undefined) => {
                            if (!lessonObj) return;
                            handleStartClassroom(classe, materia, key, lessonObj);
                            modals.setEditingSlotKey?.(null);
                        }}
                        timetableSettings={settings}
                        userClasses={settings.classi}
                        aiSettings={aiSettings}
                        students={students}
                        knowledgeBase={knowledgeBase}
                        pianiInclusione={pianiInclusione}
                    />
                );
            })() : null}
        </>
    );
};

