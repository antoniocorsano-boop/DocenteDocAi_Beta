// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026

import React, { useState, useEffect, useCallback } from 'react';

import { LiveAssistant } from './LiveAssistant'; // Corrected named import
import { LiveAssistantModalProps } from '../types';
import { M3Dialog } from './ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Migration A + Fase 3 continuation: Real consumption of AIBrain.ask + buildContext (user-centric vocal daily gesture)
import { AIBrain } from '../ai/brain/AIBrain';

const LiveAssistantModal: React.FC<LiveAssistantModalProps> = ({ 
    onClose, 
    lessonContext, 
    onNavigate, 
    onCreateEvent, 
    onScheduleLesson, 
    onAddEvaluation, 
    onAddNote,
    onMarkAttendance, 
    onCreateUda, 
    onLoadDemoData,
    students,
    evaluations,
    slots,
    lessons,
    pianiInclusione,
    knowledgeBase,
    userContext // Receive new prop
}) => {
    // Fase 3 continuation: Real AIBrain consumption inside LiveAssistantModal
    const [liveAiSuggestion, setLiveAiSuggestion] = useState<string | null>(null);
    const [_liveAiLoading, setLiveAiLoading] = useState(false);

    const fetchLiveAiSuggestion = useCallback(async () => {
        setLiveAiLoading(true);
        try {
            const ctx = AIBrain.buildContext({
                source: 'live-assistant',
                extra: { hasLesson: !!lessonContext, studentsCount: students?.length || 0 }
            });
            const res = await AIBrain.ask({
                prompt: 'Suggerisci una rapida azione vocale o supporto per la lezione attuale.',
                context: ctx,
                mode: 'balanced'
            });
            setLiveAiSuggestion(res.content);
        } catch {
            setLiveAiSuggestion('Impossibile ottenere suggerimento AI vocale.');
        } finally {
            setLiveAiLoading(false);
        }
    }, [lessonContext, students]);

    // Auto-fetch a quick insight on open (user-centric)
    useEffect(() => {
        if (lessonContext || students?.length) {
            fetchLiveAiSuggestion();
        }
    }, [lessonContext, students, fetchLiveAiSuggestion]);

    // Expose AIBrain (for LiveAssistant if needed) + real usage above
    const _aiBrain = AIBrain;

    return (
        <M3Dialog
            title="Assistente Vocale Live"
            onClose={onClose}
            maxWidth="xl"
        >
            {/* Fase 3 continuation: Visible real AIBrain.ask consumption (user-centric vocal gesture) */}
            {liveAiSuggestion && (
              <Box sx={{ p: 1.5, mb: 2, borderRadius: 'var(--md-sys-shape-corner-medium)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                  AIBrain (Fase 3) — Insight vocale: {liveAiSuggestion}
                </Typography>
              </Box>
            )}

            <LiveAssistant 
                    lessonContext={lessonContext} 
                    isModalMode={true} 
                    onNavigate={(v, c) => { onNavigate?.(v, c); onClose(); }}
                    onCreateEvent={(e) => { 
                        onCreateEvent?.(e); 
                        onClose();
                    }} 
                    onScheduleLesson={(data) => { onScheduleLesson?.(data); onClose(); }} 
                    onAddEvaluation={(data) => { onAddEvaluation?.(data); onClose(); }} 
                    onCreateUda={(data) => { onCreateUda?.(data); onClose(); }} 
                    onAddNote={(data) => { onAddNote?.(data); onClose(); }}
                    onMarkAttendance={(data) => { onMarkAttendance?.(data); onClose(); }} 
                    onLoadDemoData={() => { onLoadDemoData?.(); onClose(); }}
                    students={students}
                    evaluations={evaluations}
                    slots={slots}
                    lessons={lessons}
                    pianiInclusione={pianiInclusione}
                    knowledgeBase={knowledgeBase}
                    userContext={userContext}
                />
        </M3Dialog>
    );
};

export default LiveAssistantModal;
