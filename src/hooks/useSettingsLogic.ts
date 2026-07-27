/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef, useCallback } from 'react';
import { messages } from '../messages';
import { TimetableSettings, AiSettings, AppThemeState } from '../types';
import { AI_PROFILES, DEFAULT_TIMETABLE_SETTINGS } from '../constants';
import { ThemeService } from '../services/ThemeService';
import { useDebounce } from './useDebounce';
import { useSettingsStore } from '../stores/useSettingsStore';

// MD3 compliant percentage values
const MD3_SATURATION_HIGH = 70;
const MD3_LIGHTNESS_HIGH = 80;

interface UseSettingsLogicProps {
    settings: TimetableSettings;
    onSaveSettings: (s: TimetableSettings) => void;
    aiSettings: AiSettings;
    onSaveAiSettings: (s: AiSettings) => void;
    themeState: AppThemeState;
    onSaveTheme: (t: AppThemeState) => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    onCleanDemoData: () => void;
}

export const useSettingsLogic = ({
    settings,
    onSaveSettings,
    aiSettings,
    onSaveAiSettings,
    themeState,
    onSaveTheme,
    showToast,
    onCleanDemoData
}: UseSettingsLogicProps): {
    localSettings: TimetableSettings;
    localAiSettings: AiSettings;
    handleChange: (field: keyof TimetableSettings, value: unknown) => void;
    handleThemeChange: (partial: Partial<AppThemeState>) => void;
    handleAiProfileChange: (profile: keyof typeof AI_PROFILES) => void;
    handleResetAiCache: () => void;
    themePrompt: string;
    setThemePrompt: (v: string) => void;
    isGeneratingTheme: boolean;
    handleGenerateThemeFromPrompt: () => Promise<void>;
    isResetModalOpen: boolean;
    setIsResetModalOpen: (v: boolean) => void;
    performReset: () => void;
    handleBulkAssign: (selectedClasses: string[], selectedSubjects: string[]) => void;
    toggleAssociation: (studentId: string, classCode: string) => void;
    updateAssignmentHours: (id: string, hours: number) => void;
} => {
    // Local State — merge incoming settings with defaults to guard against incomplete backup data
    const [localSettings, setLocalSettings] = useState<TimetableSettings>({ ...DEFAULT_TIMETABLE_SETTINGS, ...settings });
    const [localAiSettings, setLocalAiSettings] = useState<AiSettings>(aiSettings);
    const [themePrompt, setThemePrompt] = useState('');
    const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    // Debounce Settings
    const debouncedSettings = useDebounce(localSettings, 800);

    // Sync Props to State (when props change externally)
    useEffect(() => {
        setLocalSettings(prev => ({ ...DEFAULT_TIMETABLE_SETTINGS, ...prev, ...settings }));
    }, [settings]);

    useEffect(() => {
        setLocalAiSettings(aiSettings);
    }, [aiSettings]);

    // Save Settings when debounced value changes
    const isFirstRun = useRef(true);
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        // Basic comparison to avoid saving if nothing changed
        if(JSON.stringify(debouncedSettings) !== JSON.stringify(settings)) {
             onSaveSettings(debouncedSettings);
             showToast(messages.toast.save, 'success'); 
        }
    }, [debouncedSettings, settings, onSaveSettings, showToast]);

    const handleChange = useCallback((field: keyof TimetableSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleThemeChange = useCallback((partial: Partial<AppThemeState>) => {
        const current = useSettingsStore.getState().themeState;
        onSaveTheme({ ...current, ...partial });
    }, [onSaveTheme]);

    const handleBulkAssign = useCallback((selectedClasses: string[], selectedSubjects: string[]) => {
        const newAssignments = [...(localSettings.teachingAssignments || [])];
        let addedCount = 0;

        selectedClasses.forEach(cls => {
            selectedSubjects.forEach(subj => {
                const exists = newAssignments.some(a => a.classId === cls && a.subjectId === subj);
                if (!exists) {
                    const hue = Math.floor(Math.random() * 360); // Simple random hue for now
                    newAssignments.push({
                        id: `${cls}-${subj}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        classId: cls,
                        subjectId: subj,
                        color: `hsl(${hue}, ${MD3_SATURATION_HIGH}%, ${MD3_LIGHTNESS_HIGH}%)`,
                        hoursPerWeek: 2
                    });
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            handleChange('teachingAssignments', newAssignments);
            showToast(`${addedCount} nuove associazioni create!`, 'success');
        } else {
            showToast(`Nessuna nuova associazione da creare.`, 'info');
        }
    }, [localSettings.teachingAssignments, handleChange, showToast]);

    const handleAiProfileChange = useCallback((profileKey: keyof typeof AI_PROFILES) => {
        const profile = AI_PROFILES[profileKey];
        const newSettings = { ...localAiSettings, model: profile.model };
        setLocalAiSettings(newSettings);
        onSaveAiSettings(newSettings);
        showToast(`${profile.label} attivato. ${profile.description}`, "info");
    }, [localAiSettings, onSaveAiSettings, showToast]);

    const handleResetAiCache = useCallback(() => {
        handleAiProfileChange('rapido');
        showToast(messages.toast.retry, 'info');
    }, [handleAiProfileChange, showToast]);

    const handleGenerateThemeFromPrompt = useCallback(async () => {
        if (!themePrompt.trim()) {
            showToast(messages.generic.error, 'error');
            return;
        }
        setIsGeneratingTheme(true);
        try {
            const generated = await ThemeService.generateViaAi(themePrompt, aiSettings);
            onSaveTheme({
                ...themeState,
                customizationName: 'Custom',
                customColors: generated.colors,
                generatedName: generated.name,
                generatedColors: generated.colors,
            });
            showToast(messages.toast.save, 'success');
        } catch {
            showToast(messages.toast.error, 'error');
        } finally {
            setIsGeneratingTheme(false);
        }
    }, [aiSettings, themePrompt, themeState, onSaveTheme, showToast]);

    const performReset = useCallback(() => {
        onCleanDemoData();
        setIsResetModalOpen(false);
    }, [onCleanDemoData]);

    const toggleAssociation = useCallback((cls: string, subj: string) => {
        const index = localSettings.teachingAssignments.findIndex(a => a.classId === cls && a.subjectId === subj);
        const updated = [...localSettings.teachingAssignments];
        
        if (index >= 0) {
            updated.splice(index, 1);
        } else {
            const hue = Math.floor(Math.random() * 360);
            updated.push({
                id: crypto.randomUUID(),
                classId: cls,
                subjectId: subj,
                color: `hsl(${hue}, ${MD3_SATURATION_HIGH}%, ${MD3_LIGHTNESS_HIGH}%)`,
                hoursPerWeek: 4
            });
        }
        handleChange('teachingAssignments', updated);
    }, [localSettings.teachingAssignments, handleChange]);

    const updateAssignmentHours = useCallback((id: string, hours: number) => {
        const updated = localSettings.teachingAssignments.map(a => 
            a.id === id ? { ...a, hoursPerWeek: hours } : a
        );
        handleChange('teachingAssignments', updated);
    }, [localSettings.teachingAssignments, handleChange]);

    return {
        localSettings,
        localAiSettings,
        handleChange,
        handleThemeChange,
        handleAiProfileChange,
        handleResetAiCache,
        themePrompt,
        setThemePrompt,
        isGeneratingTheme,
        handleGenerateThemeFromPrompt,
        isResetModalOpen,
        setIsResetModalOpen,
        performReset,
        handleBulkAssign,
        toggleAssociation,
        updateAssignmentHours
    };
};

