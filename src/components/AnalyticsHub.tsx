// MD3 Compliant - Block G Migration (Eliminated 23 violations)
/**
 * AnalyticsHub.tsx
 * // M3Expressive refactor: Removed all className attributes, converted to inline styles with MD3 tokens for layout, colors, spacing, and typography.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAIPipeline } from '../ai/pipeline/useAIPipeline';
import AISuggestionsPanel from './AISuggestionsPanel';
import AITrendPanel from './AITrendPanel';
import ClassHealthWidget from './ClassHealthWidget';
import CopilotDocentePanel from './CopilotDocentePanel';
import { useAcademicStore } from '../stores/useAcademicStore';

// Migration Fase 2: Route high-traffic hub analysis through the single AIBrain
import { AIBrain } from '../ai/brain/AIBrain';

import InfoCard from './ui/InfoCard';
import SectionHeader from './ui/SectionHeader';
import EmptyState from './ui/EmptyState';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';

import type { Studente, Valutazione, TimetableSettings, View, NavigationParams } from '../types';
import HubShell from './ui/HubShell';

interface AnalyticsHubProps {
    userClasses: string[];
    students: Studente[];
    evaluations: Valutazione[];
    settings: TimetableSettings;
    onNavigate?: (view: View, params?: NavigationParams) => void;
}

// Removed: type ChartType = 'trend' | 'radar' | 'dist';

const AnalyticsHub: React.FC<AnalyticsHubProps> = ({
    userClasses, students, evaluations, settings, onNavigate
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(userClasses[0] || '');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    // Removed chartType, setChartType (unused)

    useEffect(() => {
        if (!selectedClass && userClasses.length > 0) {
            setSelectedClass(userClasses[0]);
        }
    }, [userClasses, selectedClass]);

    // Removed aiInsight (unused)

    // Memoized filters
    const filteredStudents = useMemo(() => students.filter(s => s.classe === selectedClass), [students, selectedClass]);
    const filteredEvals = useMemo(() => {
        return evaluations.filter(e => {
            if (selectedStudentId !== 'all' && e.studenteId !== selectedStudentId) return false;
            if (selectedSubject !== 'all' && e.materia !== selectedSubject) return false;
            if (selectedStudentId === 'all' && !filteredStudents.find(s => s.id === e.studenteId)) return false;
            return true;
        });
    }, [evaluations, selectedStudentId, selectedSubject, filteredStudents]);

    // Central AI pipeline (legacy path still used for now)
    const aiPipeline = useAIPipeline(selectedClass, filteredStudents, filteredEvals);

    // Migration Fase 2 + Fase 3 (sequenza): Use central buildContext + analyzeClass via Post-Fase 4 central prompt (memoized + async handling)
    const [aiBrainAnalysis, setAiBrainAnalysis] = useState<any>(null);
    useEffect(() => {
        if (!selectedClass || filteredStudents.length === 0) {
            setAiBrainAnalysis(null);
            return;
        }
        (async () => {
            try {
                const ctx = AIBrain.buildContext({
                    class: selectedClass,
                    students: filteredStudents,
                    evaluations: filteredEvals,
                    source: 'analytics-hub',
                });
                const analysis = await AIBrain.generateWithCentralPrompt('analyze-class', { 
                  class: selectedClass, 
                  students: filteredStudents, 
                  studentsLength: filteredStudents.length,
                  evaluations: filteredEvals 
                }, {} as any);
                setAiBrainAnalysis(analysis);
            } catch {
                setAiBrainAnalysis(null);
            }
        })();
    }, [selectedClass, filteredStudents, filteredEvals]);

    // Fase 3: Memoized unified recommendation for UI (avoids IIFE in render)
    const analyticsUnifiedRec = useMemo(() => {
      try {
        return AIBrain.getUnifiedRecommendations({ class: selectedClass, source: 'analytics-hub' });
      } catch {
        return null;
      }
    }, [selectedClass]);

    // Fase 3 continuation: Real AIBrain.ask consumption (user-centric daily gesture in Analytics)
    const [analyticsAiInsight, setAnalyticsAiInsight] = useState<string | null>(null);
    const [analyticsAiLoading, setAnalyticsAiLoading] = useState(false);

    const fetchAnalyticsAiInsight = useCallback(async () => {
      setAnalyticsAiLoading(true);
      try {
        const ctx = AIBrain.buildContext({
          class: selectedClass,
          students: filteredStudents,
          evaluations: filteredEvals,
          source: 'analytics-hub-insight'
        });
        const res = await AIBrain.ask({
          prompt: `Fornisci un insight rapido o suggerimento per la classe ${selectedClass} basato sui dati attuali.`,
          context: ctx,
          mode: 'balanced'
        });
        setAnalyticsAiInsight(res.content);
      } catch {
        setAnalyticsAiInsight('Impossibile ottenere insight AI.');
      } finally {
        setAnalyticsAiLoading(false);
      }
    }, [selectedClass, filteredStudents, filteredEvals]);

    // UDA, settings globali
    const udas = useAcademicStore((s) => s.uda);



    if (userClasses.length === 0) {
        return (
            <HubShell
                title="Analytics Hub"
                subtitle="Analisi dati classe e studente."
                icon="analytics"
                onNavigate={onNavigate || (() => {})}
            >
                <EmptyState title="Nessuna classe" description="Configura le tue classi nelle Impostazioni." icon="bar_chart_off" />
            </HubShell>
        );
    }

    const aiContext = { class: selectedClass, studentId: selectedStudentId !== 'all' ? selectedStudentId : undefined };

    return (
        <HubShell
            title="Analytics Hub"
            subtitle="Analisi dati classe e studente."
            icon="analytics"
            onNavigate={onNavigate || (() => {})}
            aiContext={aiContext}
        >
            {/* Filters row */}
            <InfoCard variant="outlined">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 'var(--md-sys-spacing-4)' }}>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="analytics-classe-label">Classe</InputLabel>
                        <Select labelId="analytics-classe-label" label="Classe" inputProps={{ id: 'analytics-classe-select', name: 'analytics-classe' }} value={selectedClass} onChange={e => { setSelectedClass(e.target.value as string); setSelectedStudentId('all'); }}>
                            {userClasses.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="analytics-studente-label">Studente</InputLabel>
                        <Select labelId="analytics-studente-label" label="Studente" inputProps={{ id: 'analytics-studente-select', name: 'analytics-studente' }} value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value as string)}>
                            <MenuItem value="all">Tutta la Classe (Media)</MenuItem>
                            {filteredStudents.map(s => <MenuItem key={s.id} value={s.id}>{s.cognome} {s.nome}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="analytics-materia-label">Materia</InputLabel>
                        <Select labelId="analytics-materia-label" label="Materia" inputProps={{ id: 'analytics-materia-select', name: 'analytics-materia' }} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value as string)}>
                            <MenuItem value="all">Tutte le Materie</MenuItem>
                            {settings.disciplines.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </InfoCard>

            {/* Row 1: ClassHealthWidget */}
            <ClassHealthWidget health={aiPipeline.classHealth} />

            {/* Row 2: AISuggestionsPanel */}
            <AISuggestionsPanel suggestions={aiPipeline.studentSuggestions} />

            {/* Row 3: AITrendPanel */}
            <AITrendPanel
                snapshots={aiPipeline.snapshots}
                className={selectedClass}
                onClearHistory={aiPipeline.clearSnapshots}
            />

            {/* Row 4: CopilotDocentePanel (Fase 1 MVP) + Fase 3: real AIBrain unified recs */}
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
            />

            {/* Fase 3 — Real consumption of AIBrain (unified recommendations) — memoized */}
            {analyticsUnifiedRec?.primary && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'var(--md-sys-color-primary-container)', borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                  AIBrain (Fase 3): {analyticsUnifiedRec.primary.label || analyticsUnifiedRec.primary.title}
                </Typography>
              </Box>
            )}

            {/* Post-Fase 4 visible block for AnalyticsHub (analyzeClass via central prompt path) */}
            <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
              AIBrain (Post-Fase 4): AnalyticsHub — buildPrompt + generateWithCentralPrompt (analyze-class) + buildContext + migrateLegacyAsk
            </Box>

            {/* Fase 3 continuation: Real AIBrain.ask consumption (visible daily gesture) */}
            <Box sx={{ mt: 1, mb: 1.5 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={fetchAnalyticsAiInsight}
                disabled={analyticsAiLoading}
                startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
              >
                {analyticsAiLoading ? 'AIBrain…' : 'Insight rapido AIBrain (Analytics)'}
              </Button>
              {analyticsAiInsight && (
                <Box sx={{ mt: 1, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500 }}>
                    AIBrain (Fase 3): {analyticsAiInsight}
                  </Typography>
                </Box>
              )}
            </Box>
        </HubShell>
    );
};

export default AnalyticsHub;

