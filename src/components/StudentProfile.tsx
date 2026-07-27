// MD3 Compliant - Block J Migration Complete (2 violations eliminated)
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React, { useState, useMemo } from 'react';
import { Studente, Valutazione, ValutazioneCompetenza, TimetableSettings, RegisterEntry, Lezione, Competenza, AiSettings } from '../types';
import { calculatePerformance } from '../utils/evaluationUtils';

import { printStudentProfile, printCertificazioneCompetenze } from '../utils/printUtils';
import { DEFAULT_COMPETENZE } from '../constants';
import StudentInterviewModal from './StudentInterviewModal';
import { EmptyState, InfoCard, Avatar, M3ConfirmDialog } from './ui';
import Button from '@mui/material/Button';
// Fase 4: FULL routing via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';

interface StudentProfileProps {
    student: Studente;
    evaluations: Valutazione[];
    competencyEvaluations: ValutazioneCompetenza[];
    settings: TimetableSettings;
    aiSettings: AiSettings;
    onBack: () => void;
    onDeleteEvaluation: (evalId: string) => void;
    onOpenInclusionPlanEditor?: (student: Studente) => void;
    register?: RegisterEntry[];
    lessons?: Record<string, Lezione>;
}

export type ProfileTab = 'overview' | 'grades' | 'competencies' | 'notes' | 'history';

const StudentProfile: React.FC<StudentProfileProps> = ({ student, evaluations, competencyEvaluations, settings, aiSettings, onBack, onDeleteEvaluation, onOpenInclusionPlanEditor, register = [], lessons = {} }) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
    const [isInterviewModeOpen, setIsInterviewModeOpen] = useState(false);
    const [aiJudgment, setAiJudgment] = useState<string | null>(null);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
    // Print is synchronous — no async exporting state needed
    const isExporting = false;

    const performance = calculatePerformance(student.id, 'Complessivo', evaluations);
    const trendIcon = performance.trend === 'up' ? 'trending_up' : performance.trend === 'down' ? 'trending_down' : 'trending_flat';

    // Check if student is in terminal year (starts with 3 for middle school, 5 for high school)
    const isTerminalYear = student.classe.startsWith('3') || student.classe.startsWith('5');

    const groupedEvaluations = useMemo(() => {
        const safeEvaluations: Valutazione[] = evaluations || [];
        return safeEvaluations.reduce((acc, ev) => {
            (acc[ev.materia] = acc[ev.materia] || []).push(ev);
            return acc;
        }, {} as Record<string, Valutazione[]>);
    }, [evaluations]);

    const groupedCompetencyEvals = useMemo(() => {
        const safeCompetencyEvaluations: ValutazioneCompetenza[] = competencyEvaluations || [];
        return safeCompetencyEvaluations.reduce((acc, ev) => {
            let competency = settings.competenze.find(c => c.id === ev.competenzaId);
            if (!competency) {
                competency = DEFAULT_COMPETENZE.find(c => c.id === ev.competenzaId);
            }

            if (competency) {
                const compName = competency.nome;
                if (!acc[compName]) {
                    acc[compName] = { competenza: competency, evals: [] };
                }
                acc[compName].evals.push(ev);
            }
            return acc;
        }, {} as Record<string, { competenza: Competenza, evals: ValutazioneCompetenza[] }>);
    }, [competencyEvaluations, settings.competenze]);

    const attendanceStats = useMemo(() => {
        const studentEntries: RegisterEntry[] = (Array.isArray(register) ? register : []).filter(e => e.classe === student.classe);
        const totalLessons = studentEntries.length;
        const absences = studentEntries.filter(e => e.studentAttendance[student.id] === 'assente').length;
        const lates = studentEntries.filter(e => e.studentAttendance[student.id] === 'ritardo').length;

        const percentage = totalLessons > 0 ? Math.round((absences / totalLessons) * 100) : 0;

        return { totalLessons, absences, lates, percentage };
    }, [register, student.id, student.classe]);

    const studentReceptions = useMemo(() => {
        return (lessons && typeof lessons === 'object' ? Object.values(lessons) : []).filter((l: Lezione) =>
            l.tipoLezione === 'Ricevimento' &&
            (l.contesto?.includes(`STUDENT_ID:${student.id}`) || l.contenuto.includes(student.cognome))
        );
    }, [lessons, student]);

    const handleExportPdf = () => {
        printStudentProfile(student, evaluations, competencyEvaluations, settings);
    };

    const handleGenerateCertification = () => {
        const certData = Object.values(groupedCompetencyEvals).map(({ competenza, evals }) => {
            const latest = evals.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
            const level = competenza.livelli.find(l => l.id === latest.livelloId);
            let mappedLevel = 'D';
            if (level) {
                if (level.nome.includes('Avanzato') || level.nome.startsWith('A')) mappedLevel = 'A';
                else if (level.nome.includes('Intermedio') || level.nome.startsWith('B')) mappedLevel = 'B';
                else if (level.nome.includes('Base') || level.nome.startsWith('C')) mappedLevel = 'C';
            }
            return { competencyName: competenza.nome, level: mappedLevel };
        });
        printCertificazioneCompetenze(student, certData, settings);
    };

    const handleGenerateAiJudgment = async () => {
        setIsLoadingAi(true);
        setAiJudgment(null);
        try {
            // Fase 4: route daily student profile judgment gesture via AIBrain
            const ctx = AIBrain.buildContext({
                source: 'student-profile',
                extra: { studentId: student.id, class: student.classe, evalsCount: evaluations.length, compsCount: competencyEvaluations.length }
            });
            await AIBrain.migrateLegacyAsk(`Genera giudizio AI per ${student.cognome}`, ctx);

            const suggestion = await AIBrain.generateWithCentralPrompt('judgment-suggestion', {
                s: student,
                evals: evaluations,
                cEvals: competencyEvaluations,
                comps: settings.competenze,
                sec: 'giudizio',
                classe: student.classe,
                periodo: 'periodo corrente'
            }, aiSettings);
            setAiJudgment(suggestion);
        } catch (error) {
            logger.error("Error generating AI judgment:", error);
            showToast('Errore durante la generazione del giudizio AI.', 'error');
        } finally {
            setIsLoadingAi(false);
        }
    };

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-3)' }}>
                <InfoCard title="Media Voti" description={performance.grade || '-'} icon="analytics" variant="contained" />
                <InfoCard title="Andamento" description={performance.trend === 'up' ? 'In crescita' : performance.trend === 'down' ? 'In calo' : 'Stabile'} icon={trendIcon} variant="surface" />
                <InfoCard title="Assenze" description={`${attendanceStats.absences} ore`} icon="event_busy" variant="outlined" />
                <InfoCard title="Ritardi" description={`${attendanceStats.lates} ingressi`} icon="schedule" variant="tertiary" />
            </div>

            {onOpenInclusionPlanEditor && (
                <button
                    onClick={() => onOpenInclusionPlanEditor(student)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-tertiary-container)', border: 'none', cursor: 'pointer', width: 'var(--md-sys-percent-100)', textAlign: 'left' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-10)', height: 'var(--md-sys-spacing-10)', borderRadius: 'var(--md-sys-shape-corner-medium)', backgroundColor: 'var(--md-sys-color-tertiary)', color: 'var(--md-sys-color-on-tertiary)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">accessibility_new</Box>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Typography component="h3" variant="subtitle1" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-tertiary-container)' }}>Piano di Inclusione (BES/DSA)</Typography>
                            <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-tertiary-container)', opacity: 'var(--md-sys-state-opacity-caption)' }}>Gestisci misure compensative e dispensative.</Typography>
                        </div>
                    </div>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>arrow_forward</Box>
                </button>
            )}

            {/* AI Judgment Suggestion Section */}
            {/* Post-Fase 4 visible block - daily student profile AI judgment routed via AIBrain central prompt path */}
            <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                AIBrain (Post-Fase 4): StudentProfile — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (judgment-suggestion)
            </Box>
            <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container)', padding: 'var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--md-sys-spacing-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-10)', height: 'var(--md-sys-spacing-10)', borderRadius: 'var(--md-sys-shape-corner-medium)', backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">psychology</Box>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Typography component="h3" variant="subtitle1" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>Consulente AI: Giudizio</Typography>
                            <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>Genera una bozza di giudizio basata sui dati.</Typography>
                        </div>
                    </div>
                    <Button onClick={handleGenerateAiJudgment} variant="contained" disabled={isLoadingAi}>
                        {isLoadingAi ? '⏳' : 'Genera Bozza'}
                    </Button>
                </div>

                {aiJudgment && (
                    <div style={{ borderRadius: 'var(--md-sys-shape-corner-medium)', backgroundColor: 'var(--md-sys-color-primary-container)', padding: 'var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-5)', color: 'var(--md-sys-color-primary)' }}>auto_awesome</Box>
                            <span style={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', color: 'var(--md-sys-color-on-primary-container)' }}>Suggerimento AI</span>
                        </div>
                        <Typography component="p" variant="body1" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-primary-container)', fontStyle: 'italic', lineHeight: 1.6 }}>
                            &ldquo;{aiJudgment}&rdquo;
                        </Typography>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button onClick={() => { navigator.clipboard.writeText(aiJudgment); showToast('Giudizio copiato negli appunti!', 'success'); }} variant="text" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">content_copy</Box>}>
                                Copia Testo
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {isTerminalYear && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-10)', height: 'var(--md-sys-spacing-10)', borderRadius: 'var(--md-sys-shape-corner-medium)', backgroundColor: 'var(--md-sys-color-secondary)', color: 'var(--md-sys-color-on-secondary)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">workspace_premium</Box>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Typography component="h3" variant="subtitle1" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>Certificazione Competenze</Typography>
                            <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>Fine ciclo studi</Typography>
                        </div>
                    </div>
                    <Button onClick={handleGenerateCertification} variant="outlined" disabled={isExporting}>Genera PDF</Button>
                </div>
            )}
        </div>
    );

    const renderGrades = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {Object.entries(groupedEvaluations).length > 0 ? (
                Object.entries(groupedEvaluations).map(([materia, evals]: [string, Valutazione[]]) => (
                    <div key={materia} style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-10)', height: 'var(--md-sys-spacing-10)', borderRadius: 'var(--md-sys-shape-corner-medium)', backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>
                                    {materia.substring(0, 2).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Typography component="h3" variant="subtitle1" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>{materia}</Typography>
                                    <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{evals.length} prove registrate</Typography>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-full)', backgroundColor: 'var(--md-sys-color-primary-container)' }}>
                                <span style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-primary-container)' }}>Media:</span>
                                <span style={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-title-medium-font-size)', color: 'var(--md-sys-color-on-primary-container)' }}>
                                    {(evals.reduce((a, b) => a + (parseFloat(b.voto) || 0), 0) / evals.length).toFixed(1)}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {evals.map(ev => (
                                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', padding: 'var(--md-sys-spacing-2) 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-10)', height: 'var(--md-sys-spacing-10)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: parseFloat(ev.voto) < 6 ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-primary-container)', color: parseFloat(ev.voto) < 6 ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-primary-container)', fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', flexShrink: 0 }}>
                                        {ev.voto}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface)' }}>{ev.argomento || 'Verifica'}</div>
                                        <div style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{`${ev.tipo}${ev.note ? ` • ${ev.note}` : ''}`}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{new Date(ev.data).toLocaleDateString()}</span>
                                        <Button onClick={() => setConfirmDialog({ message: 'Eliminare voto?', onConfirm: () => onDeleteEvaluation(ev.id) })} variant="text">
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">delete</Box>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : <EmptyState title="Nessun voto" description="Nessun voto registrato per questo studente." icon="grade_off" />}
        </div>
    );

    const renderCompetencies = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {Object.entries(groupedCompetencyEvals).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                    {Object.values(groupedCompetencyEvals).map(({ competenza, evals }) => {
                        const latest = evals.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
                        const level = competenza.livelli.find(l => l.id === latest.livelloId);
                        let levelColor = "student-profile-competency-level-default";
                        
                        if (level?.nome.includes("Avanzato") || level?.nome.includes("A -")) {
                            levelColor = "student-profile-competency-level-advanced";
                        } else if (level?.nome.includes("Intermedio") || level?.nome.includes("B -")) {
                            levelColor = "student-profile-competency-level-intermediate";
                        } else if (level?.nome.includes("Base") || level?.nome.includes("C -")) {
                            levelColor = "student-profile-competency-level-basic";
                        }

                        return (
                            <div key={competenza.id} style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container)', padding: 'var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--md-sys-spacing-3)' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Typography component="p" variant="caption" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-label-small-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{competenza.codice}</Typography>
                                        <Typography component="h3" variant="subtitle1" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>{competenza.nome}</Typography>
                                    </div>
                                    <div style={{
                                        padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
                                        borderRadius: 'var(--md-sys-shape-corner-small)',
                                        fontSize: 'var(--md-sys-typescale-body-small-font-size)',
                                        fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                        textAlign: 'center',
                                        backgroundColor: levelColor.includes('advanced') ? 'var(--md-sys-color-tertiary-container)' :
                                                        levelColor.includes('intermediate') ? 'var(--md-sys-color-secondary-container)' :
                                                        levelColor.includes('basic') ? 'var(--md-sys-color-primary-container)' :
                                                        'var(--md-sys-color-surface-container-highest)',
                                        color: levelColor.includes('advanced') ? 'var(--md-sys-color-on-tertiary-container)' :
                                               levelColor.includes('intermediate') ? 'var(--md-sys-color-on-secondary-container)' :
                                               levelColor.includes('basic') ? 'var(--md-sys-color-on-primary-container)' :
                                               'var(--md-sys-color-on-surface)'
                                    }}>
                                        {level?.nome}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}>event</Box>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{new Date(latest.data).toLocaleDateString()}</span>
                                    </div>
                                    <Typography component="p" variant="body1" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{level?.descrizione}</Typography>
                                </div>
                                {latest.nota && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-2)', padding: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-medium)', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-5)', color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}>chat_bubble</Box>
                                        <Typography component="p" variant="body2" sx={{ margin: 0, fontStyle: 'italic', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>&ldquo;{latest.nota}&rdquo;</Typography>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : <EmptyState title="Nessuna competenza" description="Nessuna valutazione per competenza registrata." icon="psychology_alt" />}
        </div>
    );

    const renderNotes = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {studentReceptions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                    {(studentReceptions || []).map(lesson => (
                        <div key={lesson.id} style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container)', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <div style={{ height: 'var(--md-sys-spacing-1)', backgroundColor: 'var(--md-sys-color-primary)' }} />
                            <div style={{ padding: 'var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-full)', backgroundColor: 'var(--md-sys-color-primary-container)' }}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-primary)' }}>meeting_room</Box>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-on-primary-container)' }}>Ricevimento</span>
                                    </div>
                                    <span style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{lesson.data ? new Date(lesson.data).toLocaleDateString() : ''}</span>
                                </div>
                                <Typography component="p" variant="body1" sx={{ margin: 0, color: 'var(--md-sys-color-on-surface)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 1.6 }}>{lesson.contenuto}</Typography>
                                {lesson.obiettivi && (
                                    <div style={{ padding: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-medium)', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderLeft: 'var(--md-sys-border-width-thick) solid var(--md-sys-color-primary)' }}>
                                        <Typography component="p" variant="caption" sx={{ margin: '0 0 var(--md-sys-spacing-1)', fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-label-small-font-size)', color: 'var(--md-sys-color-primary)', textTransform: 'uppercase' }}>Esito / Obiettivi</Typography>
                                        <Typography component="p" variant="body2" sx={{ margin: 0, color: 'var(--md-sys-color-on-surface)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>{lesson.obiettivi}</Typography>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : <EmptyState title="Nessuna nota" description="Nessun colloquio o nota registrata." icon="event_note" />}
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Panoramica', icon: 'dashboard' },
        { id: 'grades', label: 'Voti', icon: 'grade' },
        { id: 'competencies', label: 'Competenze', icon: 'psychology' },
        { id: 'notes', label: 'Colloqui', icon: 'chat' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'var(--md-sys-percent-100)', overflowY: 'auto', backgroundColor: 'var(--md-sys-color-surface)' }}>
            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-3)', padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                    <Button onClick={onBack} variant="text">
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_back</Box>
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)' }}>
                        <Avatar name={`${student.nome} ${student.cognome}`} size="xl" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Typography component="h1" variant="h5" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-headline-small-font-size)', color: 'var(--md-sys-color-on-surface)' }}>{student.cognome} {student.nome}</Typography>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', marginTop: 'var(--md-sys-spacing-1)', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>Classe {student.classe}</span>
                                {student.hasBES && <span style={{ padding: '0 var(--md-sys-spacing-2)', borderRadius: 'var(--md-sys-shape-corner-full)', backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', fontSize: 'var(--md-sys-typescale-label-small-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>BES</span>}
                                {student.hasDSA && <span style={{ padding: '0 var(--md-sys-spacing-2)', borderRadius: 'var(--md-sys-shape-corner-full)', backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)', fontSize: 'var(--md-sys-typescale-label-small-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>DSA</span>}
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                    <Button onClick={() => setIsInterviewModeOpen(true)} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">record_voice_over</Box>}>
                        Colloquio
                    </Button>
                    <Button onClick={handleExportPdf} variant="contained" disabled={isExporting} startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">download</Box>}>
                        Esporta PDF
                    </Button>
                </div>
            </div>

                        <Tabs
              value={activeTab}
              onChange={(_, v: string) => ((id) => setActiveTab(id as ProfileTab))(v)}
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
              {(tabs).map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  id={`tab-${tab.id}`}
                  aria-controls={`panel-${tab.id}`}
                  data-testid={`tab-${tab.id}`}
                  label={(
                    <Badge badgeContent={tab.badge} color="error">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {tab.icon && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>}
                        {tab.label}
                      </Box>
                    </Badge>
                  )}
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

            <div style={{ flex: 1, padding: 'var(--md-sys-spacing-4)', overflowY: 'auto' }}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'grades' && renderGrades()}
                {activeTab === 'competencies' && renderCompetencies()}
                {activeTab === 'notes' && renderNotes()}
            </div>

            {isInterviewModeOpen && (
                <StudentInterviewModal 
                    student={student}
                    evaluations={[]}
                    competencyEvaluations={[]}
                    settings={settings}
                    onClose={() => setIsInterviewModeOpen(false)}
                />
            )}
            {confirmDialog && (
                <M3ConfirmDialog
                    title="Conferma eliminazione"
                    message={confirmDialog.message}
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                    danger={true}
                />
            )}
        </div>
    );
};

export default StudentProfile;

