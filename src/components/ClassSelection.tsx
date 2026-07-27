// MD3 Compliant

import React, { useState, useMemo } from 'react';
import { View, Valutazione, Studente, ValutazioneCompetenza, TimetableSettings, PeriodoValutazione, NavigationParams } from '../types';
import ContextualAskAI from './ui/ContextualAskAI';
import { calculatePerformance } from '../utils/evaluationUtils';

import { printCouncilData } from '../utils/printUtils';
import { M3Dialog, SectionHeader, EmptyState, PageWrapper } from './ui';
import ToolsGrid from './ui/ToolsGrid';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import { useStudentStore } from '../stores/useStudentStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { generateHueFromString } from '../utils/colorUtils';
import { logger } from '../utils/logger';


interface ClassSelectionProps {
    onSelectClass: (className: string) => void;
    onNavigate: (view: View, context?: NavigationParams) => void;
}

const ClassSelection: React.FC<ClassSelectionProps> = ({ onSelectClass, onNavigate }) => {
  const students = useStudentStore(state => state.students);
    const evaluations = useStudentStore(state => state.evaluations);
    const competencyEvaluations = useStudentStore(state => state.competencyEvals);
    const settings = useSettingsStore(state => state.settings);
    const userClasses = settings.classi || [];

    const [isPrintCenterOpen, setIsPrintCenterOpen] = useState(false);

    // --- LOGIC: Upcoming Tests (Cross-Class) ---
    const upcomingTests = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return evaluations
            .filter(e => {
                const evalDate = new Date(e.data);
                return evalDate >= today;
            })
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .reduce((acc, curr) => {
                const key = `${String(curr.data)}-${String(curr.materia)}-${String(curr.tipo)}`;
                if (!acc.some(i => `${String(i.data)}-${String(i.materia)}-${String(i.tipo)}` === key)) {
                    const student = students.find(s => s.id === curr.studenteId);
                    if (student) {
                        acc.push({ ...curr, className: student.classe });
                    }
                }
                return acc;
            }, [] as (Valutazione & { className: string })[])
            .slice(0, 3); // Take top 3
    }, [evaluations, students]);

    return (
        <PageWrapper gap="var(--md-sys-spacing-4)">
             {/* Header Section */}
            <Box sx={{ mb: 'var(--md-sys-spacing-6)' }}>
                <Typography component="h1" variant="h4" sx={{ 
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                    fontSize: 'var(--md-sys-typescale-headline-large-font-size)',
                    mb: 'var(--md-sys-spacing-2)'
                }}>
                    Le Mie Classi
                </Typography>
                <Typography component="p" variant="subtitle1" sx={{ 
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    lineHeight: '1.5'
                }}>
                    Gestione studenti e analisi.
                </Typography>
            </Box>

            {/* --- GLOBAL AGENDA WIDGET --- */}
            {upcomingTests.length > 0 && (
                <Box component="section" sx={{ mb: 'var(--md-sys-spacing-6)' }}>
                    <Typography component="h2" variant="h6" sx={{ 
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: 'var(--md-sys-typescale-title-medium-font-size)',
                        fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--md-sys-typescale-title-medium-tracking)',
                        mb: 'var(--md-sys-spacing-4)'
                    }}>
                        In Arrivo (Tutte le classi)
                    </Typography>
                    <Stack spacing={1.5}>
                        {upcomingTests.map((test, idx) => (
                            <MuiCard
                                key={idx}
                                elevation={1}
                                sx={{
                                    backgroundColor: 'var(--md-sys-color-surface-container)',
                                    borderLeft: '4px solid var(--md-sys-color-tertiary)',
                                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                                }}
                            >
                                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                        <Typography component="span" variant="overline" sx={{
                                            display: 'block',
                                            color: 'var(--md-sys-color-tertiary)',
                                            lineHeight: 1.4,
                                        }}>
                                            {new Date(test.data).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </Typography>
                                        <Typography component="h4" variant="subtitle1" sx={{
                                            color: 'var(--md-sys-color-on-surface)',
                                            my: 0.5,
                                        }}>
                                            {test.materia}
                                        </Typography>
                                        <Typography component="p" variant="body2" sx={{
                                            color: 'var(--md-sys-color-on-surface-variant)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {test.argomento || test.tipo}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        size="small"
                                        sx={{
                                            ml: 2,
                                            backgroundColor: 'var(--md-sys-color-primary-container)',
                                            color: 'var(--md-sys-color-on-primary-container)',
                                        }}
                                    />
                                </CardContent>
                            </MuiCard>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Section 1: Classes Grid (New Widget Style) */}
            <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                 <SectionHeader 
                    title="Classi Attive" 
                    icon="school"
                />
                
                {userClasses.length > 0 ? (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                        gap: 'var(--md-sys-spacing-4)',
                    }}>
                        {userClasses.map((className) => {
                            const classStudents = students.filter(s => s.classe === className);
                            const studentCount = classStudents.length;
                            const studentAverages = classStudents.map(s => {
                                const sEvals = evaluations.filter(e => e.studenteId === s.id);
                                const { grade } = calculatePerformance(s.id, 'Complessivo', sEvals);
                                const numGrade = grade ? parseFloat(grade) : null;
                                return numGrade;
                            }).filter((v): v is number => v !== null);
                            const classAverage = studentAverages.length > 0
                                ? (studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length).toFixed(1)
                                : null;
                            const hue = generateHueFromString(className);
                            const accentBg = `hsl(${hue}, 55%, 92%)`;
                            const accentFg = `hsl(${hue}, 55%, 28%)`;
                            const accentBorder = `hsl(${hue}, 55%, 78%)`;
                            const avatarBg = `hsl(${hue}, 60%, 42%)`;
                            const avgNum = classAverage ? parseFloat(classAverage) : null;
                            const avgColor = avgNum === null
                                ? 'var(--md-sys-color-on-surface-variant)'
                                : avgNum >= 7
                                ? 'hsl(145, 55%, 30%)'
                                : avgNum >= 6
                                ? 'hsl(40, 90%, 28%)'
                                : 'hsl(0, 65%, 38%)';
                            const avgBg = avgNum === null
                                ? 'var(--md-sys-color-surface-variant)'
                                : avgNum >= 7
                                ? 'hsl(145, 55%, 90%)'
                                : avgNum >= 6
                                ? 'hsl(40, 90%, 90%)'
                                : 'hsl(0, 65%, 92%)';

                            return (
                                <Box
                                    key={className}
                                    component="button"
                                    onClick={() => onSelectClass(className)}
                                    aria-label={`Apri classe ${className}`}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        cursor: 'pointer',
                                        border: `1.5px solid ${accentBorder}`,
                                        borderRadius: 'var(--md-sys-shape-corner-large)',
                                        background: accentBg,
                                        padding: 0,
                                        overflow: 'hidden',
                                        transition: 'box-shadow 0.18s, transform 0.14s',
                                        textAlign: 'left',
                                        '&:hover': {
                                            boxShadow: `0 4px 18px hsla(${hue}, 55%, 40%, 0.22)`,
                                            transform: 'translateY(-2px)',
                                        },
                                        '&:active': { transform: 'translateY(0)' },
                                        '&:focus-visible': {
                                            outline: `3px solid ${avatarBg}`,
                                            outlineOffset: '2px',
                                        },
                                    }}
                                >
                                    {/* Card accent top strip */}
                                    <Box sx={{ height: '6px', background: avatarBg, flexShrink: 0 }} />

                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-3)', p: 'var(--md-sys-spacing-4)' }}>
                                        {/* Avatar */}
                                        <Box sx={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                                            background: avatarBg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Box
                                                component="span"
                                                className="material-symbols-outlined"
                                                aria-hidden="true"
                                                sx={{ fontSize: 28, color: 'var(--md-sys-color-on-primary)' }}
                                            >
                                                groups
                                            </Box>
                                        </Box>

                                        {/* Text */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                component="h3"
                                                sx={{
                                                    color: accentFg,
                                                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                                    fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                                                    lineHeight: 1.2,
                                                    mb: 'var(--md-sys-spacing-1)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {className}
                                            </Typography>
                                            <Typography
                                                component="p"
                                                sx={{
                                                    color: accentFg,
                                                    fontSize: 'var(--md-sys-typescale-body-small-font-size)',
                                                    opacity: 0.75,
                                                }}
                                            >
                                                {studentCount} {studentCount === 1 ? 'studente' : 'studenti'}
                                            </Typography>
                                        </Box>

                                        {/* Chevron */}
                                        <Box
                                            component="span"
                                            className="material-symbols-outlined"
                                            aria-hidden="true"
                                            sx={{ fontSize: 20, color: accentFg, opacity: 0.5, mt: 0.5, flexShrink: 0 }}
                                        >
                                            chevron_right
                                        </Box>
                                    </Box>

                                    {/* Stats footer */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderTop: `1px solid ${accentBorder}`,
                                        px: 'var(--md-sys-spacing-4)',
                                        py: 'var(--md-sys-spacing-2)',
                                        background: `hsla(${hue}, 30%, 96%, 0.7)`,
                                    }}>
                                        <Typography
                                            component="span"
                                            sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)', color: accentFg, opacity: 0.65 }}
                                        >
                                            Media di classe
                                        </Typography>
                                        <Box sx={{
                                            background: avgBg,
                                            color: avgColor,
                                            borderRadius: 'var(--md-sys-shape-corner-full)',
                                            px: 1.5,
                                            py: 0.25,
                                            fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                            fontSize: 'var(--md-sys-typescale-label-medium-font-size)',
                                        }}>
                                            {classAverage ?? '—'}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    <EmptyState
                        icon="school"
                        title="Nessuna classe configurata"
                        description="Configura le tue classi nelle impostazioni per iniziare a gestire studenti e valutazioni."
                        actionLabel="Vai a Impostazioni"
                        onAction={() => onNavigate('settings')}
                    />
                )}
            </Box>

            {/* Contextual AI (Fase 4 — migrated to wrapper) */}
            <ContextualAskAI
              onNavigate={onNavigate}
              context={{ source: 'aula' }}
            />

            {/* Section 2: Global Tools — migrated to ToolsGrid (Phase 4) */}
            <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                 <SectionHeader 
                    title="Gestione Rapida" 
                    icon="settings_applications"
                />
                
                <ToolsGrid
                    items={[
                        { view: 'studenti', icon: 'group_add', label: 'Importazione Massiva', caption: 'Carica studenti da CSV' },
                        { view: '', icon: 'print', label: 'Centro Stampe', caption: 'Report PDF multi-classe', onClick: () => setIsPrintCenterOpen(true) },
                        { view: 'analytics', icon: 'analytics', label: 'Analytics Hub', caption: 'Dashboard dati avanzata' },
                        { view: 'didattica-inclusiva', icon: 'accessibility_new', label: 'Didattica Inclusiva', caption: 'Gestione PEI/PDP globale' },
                    ]}
                    onNavigate={onNavigate}
                />
            </Box>

            {/* INTERNAL MODAL: PRINT CENTER */}
            {isPrintCenterOpen && (
                <PrintCenterModal 
                    userClasses={userClasses}
                    onClose={() => setIsPrintCenterOpen(false)}
                    students={students}
                    evaluations={evaluations}
                    competencyEvaluations={competencyEvaluations}
                    settings={settings}
                />
            )}
        </PageWrapper>
    );
};

// --- Sub-component: Print Center Modal ---
const PrintCenterModal: React.FC<{ 
    userClasses: string[]; 
    onClose: () => void;
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvaluations: ValutazioneCompetenza[];
    settings: TimetableSettings;
}> = ({ userClasses, onClose, students, evaluations, competencyEvaluations, settings }) => {
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [periodo, setPeriodo] = useState<PeriodoValutazione>('primo-quadrimestre');
    const [isProcessing, setIsProcessing] = useState(false);

    const toggleClass = (c: string) => {
        setSelectedClasses(prev => prev.includes(c) ? prev.filter(k => k !== c) : [...prev, c]);
    };

    const handlePrintAll = async () => {
        if (selectedClasses.length === 0) return;
        setIsProcessing(true);
        try {
            for (const className of selectedClasses) {
                const classStudents = students.filter(s => s.classe === className);
                printCouncilData(
                    className,
                    periodo,
                    classStudents,
                    evaluations,
                    competencyEvaluations,
                    settings
                );
                // Small delay between windows
                await new Promise(r => setTimeout(r, 400));
            }
        } catch(e) {
            logger.error(e);
        } finally {
            setIsProcessing(false);
            onClose();
        }
    };

    return (
        <M3Dialog
            title="Centro Stampe"
            onClose={onClose}
            maxWidth="md"
        >
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Seleziona le classi e il periodo per cui generare il prospetto voti (PDF).</Typography>

                    <Stack spacing={1}>
                        <Typography component="label" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>Periodo</Typography>
                        <Tabs
                          value={periodo}
                          onChange={(_, v: string) => ((id) => setPeriodo(id as PeriodoValutazione))(v)}
                          indicatorColor="primary"
                          textColor="primary"
                          aria-label="Sezioni di navigazione"
                          sx={{
                            bgcolor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: 'var(--md-sys-shape-corner-full)',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            minHeight: 'auto',
                            p: 0.5,
                          }}
                        >
                          {([
                                { id: 'primo-quadrimestre', label: '1Q' },
                                { id: 'secondo-quadrimestre', label: 'Finale' }
                            ]).map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
                            <Tab
                              key={tab.id}
                              value={tab.id}
                              id={`tab-${tab.id}`}
                              aria-controls={`panel-${tab.id}`}
                              data-testid={`tab-${tab.id}`}
                              label={
                                <Badge badgeContent={tab.badge} color="error">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {tab.icon && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>}
                                    {tab.label}
                                  </Box>
                                </Badge>
                              }
                              sx={{
                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                minHeight: 'auto',
                                py: 1,
                                px: 2,
                                textTransform: 'uppercase',
                                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                              }}
                            />
                          ))}
                        </Tabs>
                    </Stack>

                    <Stack spacing={1}>
                        <Typography component="label" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>Classi</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {userClasses.map(c => (
                                <Chip
                                    key={c}
                                   
                                    onClick={() => toggleClass(c)}
                                    variant={selectedClasses.includes(c) ? 'filled' : 'outlined'}
                                    color={selectedClasses.includes(c) ? 'primary' : 'default'}
                                />
                            ))}
                        </Box>
                    </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="text">Annulla</Button>
                <Button onClick={handlePrintAll} disabled={selectedClasses.length === 0 || isProcessing} variant="contained">
                    {isProcessing ? 'Elaborazione...' : `Genera ${selectedClasses.length} PDF`}
                </Button>
            </DialogActions>
        </M3Dialog>
    )
}

export default React.memo(ClassSelection);

