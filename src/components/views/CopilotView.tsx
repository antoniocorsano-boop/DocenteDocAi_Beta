// MD3 Compliant
/**
 * CopilotView.tsx
 * Vista standalone per il Copilot Docente — registrata come View 'copilot'.
 * Self-contained: legge direttamente dagli store Zustand,
 * stesso pattern di AnalyticsHub.tsx.
 */

import React, { useState, useMemo, useEffect } from 'react';
import CopilotDocentePanel from '../CopilotDocentePanel';
import { useAIPipeline } from '../../ai/pipeline/useAIPipeline';
import { useStudentStore } from '../../stores/useStudentStore';
import { useAcademicStore } from '../../stores/useAcademicStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import EmptyState from '../ui/EmptyState';
import HubShell from '../ui/HubShell';
import type { View } from '../../types';

// Migration Fase 2: CopilotView (8th high-traffic hub) imports single AIBrain (side-by-side)
import { AIBrain } from '../../ai/brain/AIBrain';

interface CopilotViewProps {
    initialSubTab?: string;
    onNavigate?: (view: View, context?: unknown) => void;
}

const SUB_TAB_TO_INDEX: Record<string, number> = {
    artistic: 14,
    guide: 11,
};

const CopilotView: React.FC<CopilotViewProps> = ({ initialSubTab, onNavigate }) => {
    const students = useStudentStore((s) => s.students);
    const evaluations = useStudentStore((s) => s.evaluations);
    const udas = useAcademicStore((s) => s.uda);
    const settings = useSettingsStore((s) => s.settings);

    const userClasses = useMemo(
        () => [...new Set(students.map((s) => s.classe).filter(Boolean))].sort(),
        [students],
    );

    const [selectedClass, setSelectedClass] = useState<string>(userClasses[0] || '');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('all');

    useEffect(() => {
        if (!selectedClass && userClasses.length > 0) {
            setSelectedClass(userClasses[0]);
        }
    }, [userClasses, selectedClass]);

    const filteredStudents = useMemo(
        () => students.filter((s) => s.classe === selectedClass),
        [students, selectedClass],
    );

    const filteredEvals = useMemo(
        () =>
            evaluations.filter((e) => {
                if (selectedStudentId !== 'all' && e.studenteId !== selectedStudentId) return false;
                if (!filteredStudents.find((s) => s.id === e.studenteId)) return false;
                return true;
            }),
        [evaluations, selectedStudentId, filteredStudents],
    );

    const aiPipeline = useAIPipeline(selectedClass, filteredStudents, filteredEvals);

    // Fase 3 (sequenza): Central buildContext + unified recommendations + snapshot
    const _aiBrainCopilot = useMemo(() => {
        try {
            return AIBrain.getCopilotSnapshot();
        } catch {
            return null;
        }
    }, [selectedClass]);

    const copilotContext = useMemo(() => AIBrain.buildContext({
        class: selectedClass,
        students: filteredStudents,
        evaluations: filteredEvals,
        source: 'copilot-view'
    }), [selectedClass, filteredStudents, filteredEvals]);

    const copilotRecs = useMemo(() => AIBrain.getUnifiedRecommendations(copilotContext), [copilotContext]);

    // Fase 3 continuation: visible AIBrain consumption block (user-centric daily copilot gesture)
    const [copilotAiTip, setCopilotAiTip] = React.useState<string | null>(null);
    const [copilotAiLoading, setCopilotAiLoading] = React.useState(false);

    const fetchCopilotAiTip = React.useCallback(async () => {
      setCopilotAiLoading(true);
      try {
        const res = await AIBrain.ask({
          prompt: `Suggerisci un insight rapido per il copilot della classe ${selectedClass}.`,
          context: copilotContext,
          mode: 'balanced'
        });
        setCopilotAiTip(res.content);
        if (import.meta.env.DEV) {
          AIBrain.migrateLegacyAsk('legacy-copilot-view', copilotContext).catch(() => {});
        }
      } catch {
        setCopilotAiTip('Impossibile ottenere insight AIBrain.');
      } finally {
        setCopilotAiLoading(false);
      }
    }, [selectedClass, copilotContext]);

    // Auto-fetch tip on class change (user-centric daily gesture)
    React.useEffect(() => {
      fetchCopilotAiTip();
    }, [fetchCopilotAiTip]);

    if (userClasses.length === 0) {
        return (
            <Box sx={{ p: 'var(--md-sys-spacing-6)' }}>
                <EmptyState
                    icon="smart_toy"
                    title="Nessuna classe disponibile"
                    description="Aggiungi studenti per accedere al Copilot Docente."
                />
            </Box>
        );
    }

    // Use HubShell for standardized header + ContextualAskAI (Phase 4 migration)
    return (
        <HubShell
            title="Copilot Docente"
            subtitle="AI adattiva per pianificazione, analisi e supporto didattico."
            icon="smart_toy"
            onNavigate={onNavigate!}
            aiContext={{ source: 'copilot' }}
        >
            {/* Selettori classe / studente */}
            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-3)', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id="copilot-view-classe-label">Classe</InputLabel>
                    <Select
                        labelId="copilot-view-classe-label"
                        value={selectedClass}
                        inputProps={{ id: 'copilot-view-classe-select', name: 'copilot-view-classe' }}
                        onChange={(e) => {
                            setSelectedClass(e.target.value as string);
                            setSelectedStudentId('all');
                        }}
                    >
                        {userClasses.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="copilot-view-studente-label">Studente</InputLabel>
                    <Select
                        labelId="copilot-view-studente-label"
                        value={selectedStudentId}
                        inputProps={{ id: 'copilot-view-studente-select', name: 'copilot-view-studente' }}
                        onChange={(e) => setSelectedStudentId(e.target.value as string)}
                    >
                        <MenuItem value="all">Tutta la classe</MenuItem>
                        {filteredStudents.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                                {s.cognome} {s.nome}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Fase 3 continuation: Visible AIBrain (Fase 3) block + ask tip for copilot daily gesture */}
            {copilotRecs?.primary && (
              <Box sx={{ mb: 1.5, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                  AIBrain (Fase 3): {copilotRecs.primary.label || copilotRecs.primary.title}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={fetchCopilotAiTip}
                disabled={copilotAiLoading}
                startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
              >
                {copilotAiLoading ? 'AIBrain…' : 'Insight AIBrain (Copilot)'}
              </Button>
              {copilotAiTip && (
                <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-secondary-container)', flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 500 }}>
                    AIBrain (Fase 3): {copilotAiTip}
                  </Typography>
                </Box>
              )}
            </Box>

            <CopilotDocentePanel
                suggestions={aiPipeline.studentSuggestions}
                classHealth={aiPipeline.classHealth}
                snapshots={aiPipeline.snapshots}
                className={selectedClass}
                studentId={selectedStudentId}
                students={filteredStudents}
                evaluations={filteredEvals}
                udas={udas}
                settings={settings}
                initialTab={initialSubTab !== undefined ? (SUB_TAB_TO_INDEX[initialSubTab] ?? 0) : undefined}
            />
        </HubShell>
    );
};

export default CopilotView;
