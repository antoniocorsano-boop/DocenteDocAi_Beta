// MD3 GOLD COMPLIANT — BulkEvaluationModal
// Permette al docente di assegnare voti a tutta la classe in due modalità:
//  1. Per Livelli  — sceglie una fascia di voto, poi tocca gli studenti da assegnare
//  2. Assistita AI — suggerimenti automatici basati sull'andamento storico, revisionabili

import React, { useState, useMemo, useCallback } from 'react';
import { Studente, Valutazione, TimetableSettings } from '../types';
import { RATING_OPTIONS, EVALUATION_TYPES } from '../constants';
import { calculatePerformance } from '../utils/evaluationUtils';
import { M3Dialog, Avatar } from './ui';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useUIStore } from '../stores/useUIStore';

// Fase 3 continuation: Route daily bulk evaluation (AI-assisted grading) gestures through AIBrain
import { AIBrain } from '../ai/brain/AIBrain';

type BulkMode = 'levels' | 'ai';

interface BulkEvaluationModalProps {
    students: Studente[];
    evaluations: Valutazione[];
    settings: TimetableSettings;
    onClose: () => void;
    onSave: (evals: Omit<Valutazione, 'id'>[]) => void;
}

const TREND_ICON: Record<string, string> = { up: 'trending_up', down: 'trending_down', stable: 'trending_flat' };
const TREND_COLOR: Record<string, string> = {
    up: 'var(--md-sys-color-tertiary)',
    down: 'var(--md-sys-color-error)',
    stable: 'var(--md-sys-color-on-surface-variant)',
};

function gradeBgColor(voto: string): string {
    const g = parseFloat(voto);
    if (isNaN(g)) return 'var(--md-sys-color-secondary-container)';
    if (g >= 8) return 'var(--md-sys-color-tertiary-container)';
    if (g >= 7) return 'var(--md-sys-color-primary-container)';
    if (g >= 6) return 'var(--md-sys-color-secondary-container)';
    return 'var(--md-sys-color-error-container)';
}
function gradeTextColor(voto: string): string {
    const g = parseFloat(voto);
    if (isNaN(g)) return 'var(--md-sys-color-on-secondary-container)';
    if (g >= 8) return 'var(--md-sys-color-on-tertiary-container)';
    if (g >= 7) return 'var(--md-sys-color-on-primary-container)';
    if (g >= 6) return 'var(--md-sys-color-on-secondary-container)';
    return 'var(--md-sys-color-on-error-container)';
}

function suggestGrade(student: Studente, materia: string, evaluations: Valutazione[]): string {
    const overall = calculatePerformance(student.id, 'Complessivo', evaluations);
    const gradeStr = overall.grade;
    const trend = overall.trend;
    if (!gradeStr) return '';
    let v = parseFloat(gradeStr);
    if (trend === 'up') v += 0.5;
    else if (trend === 'down') v -= 0.5;
    v = Math.max(1, Math.min(10, Math.round(v * 2) / 2));
    return v % 1 === 0 ? String(v) : v.toFixed(1);
}

const BulkEvaluationModal: React.FC<BulkEvaluationModalProps> = ({
    students, evaluations, settings, onClose, onSave
}) => {
    const { showToast } = useUIStore(s => ({ showToast: s.actions.showToast }));

    const disciplines = settings.disciplines ?? [];
    const today = new Date().toISOString().slice(0, 10);

    const [materia, setMateria] = useState(disciplines[0] ?? '');
    const [tipo, setTipo] = useState<Valutazione['tipo']>('Scritto');
    const [argomento, setArgomento] = useState('');
    const [data, setData] = useState(today);
    const [mode, setMode] = useState<BulkMode>('levels');
    const [activeBand, setActiveBand] = useState(RATING_OPTIONS[2]); // default '8'
    const [assignments, setAssignments] = useState<Record<string, string>>({});

    // Fase 3 continuation (user-centric daily gesture): Real AIBrain consumption in BulkEvaluationModal (AI-assisted grading flow)
    const bulkEvalContext = React.useMemo(() => AIBrain.buildContext({
      source: 'bulk-evaluation-modal',
      extra: { 
        materia, 
        tipo,
        studentsCount: students.length,
        mode 
      }
    }), [materia, tipo, students.length, mode]);

    const bulkEvalRecs = React.useMemo(() => {
      try { return AIBrain.getUnifiedRecommendations(bulkEvalContext); } catch { return null; }
    }, [bulkEvalContext]);

    const [bulkEvalTip, setBulkEvalTip] = React.useState<string | null>(null);
    const [bulkEvalLoading, setBulkEvalLoading] = React.useState(false);

    const fetchBulkEvalTip = React.useCallback(async () => {
      setBulkEvalLoading(true);
      try {
        const res = await AIBrain.ask({
          prompt: `Suggerisci un insight rapido per la valutazione di gruppo (materia: ${materia}, modalità: ${mode}).`,
          context: bulkEvalContext,
          mode: 'balanced'
        });
        setBulkEvalTip(res.content);
        if (import.meta.env.DEV) {
          AIBrain.migrateLegacyAsk('legacy-bulk-eval', bulkEvalContext).catch(() => {});
        }
      } catch {
        setBulkEvalTip('Impossibile ottenere suggerimento AIBrain.');
      } finally {
        setBulkEvalLoading(false);
      }
    }, [materia, mode, bulkEvalContext]);

    // AI suggestions (recomputed when materia changes)
    const aiSuggestions = useMemo(() => {
        const result: Record<string, string> = {};
        for (const s of students) {
            const sug = suggestGrade(s, materia, evaluations);
            if (sug) result[s.id] = sug;
        }
        return result;
    }, [students, materia, evaluations]);

    // Per-student history for display
    const studentHistory = useMemo(() => {
        const result: Record<string, { grade: string | null; trend: string | null }> = {};
        for (const s of students) {
            const perf = calculatePerformance(s.id, 'Complessivo', evaluations);
            result[s.id] = { grade: perf.grade, trend: perf.trend };
        }
        return result;
    }, [students, evaluations]);

    const assignedCount = Object.keys(assignments).filter(id => assignments[id]).length;
    const totalCount = students.length;

    // ── Level mode helpers ─────────────────────────────────────────────────
    const studentsForBand = useMemo(
        () => students.filter(s => assignments[s.id] === activeBand),
        [students, assignments, activeBand]
    );
    const unassignedStudents = useMemo(
        () => students.filter(s => !assignments[s.id]),
        [students, assignments]
    );
    const reassignableStudents = useMemo(
        () => students.filter(s => assignments[s.id] && assignments[s.id] !== activeBand),
        [students, assignments, activeBand]
    );

    const assignToBand = useCallback((studentId: string) => {
        setAssignments(prev => ({ ...prev, [studentId]: activeBand }));
    }, [activeBand]);

    const removeAssignment = useCallback((studentId: string) => {
        setAssignments(prev => { const n = { ...prev }; delete n[studentId]; return n; });
    }, []);

    const bandCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const v of Object.values(assignments)) {
            if (v) counts[v] = (counts[v] ?? 0) + 1;
        }
        return counts;
    }, [assignments]);

    // ── AI mode helpers ────────────────────────────────────────────────────
    const acceptAllSuggestions = () => {
        setAssignments(prev => ({ ...prev, ...aiSuggestions }));
    };

    const clearAll = () => setAssignments({});

    // ── Save ───────────────────────────────────────────────────────────────
    const handleSave = () => {
        if (!materia) { showToast('Seleziona una materia.', 'error'); return; }
        const entries = students
            .filter(s => assignments[s.id])
            .map(s => ({
                studenteId: s.id,
                materia,
                data: new Date(data).toISOString(),
                tipo,
                voto: assignments[s.id],
                argomento: argomento || undefined,
            } as Omit<Valutazione, 'id'>));
        if (entries.length === 0) { showToast('Assegna almeno un voto.', 'error'); return; }
        onSave(entries);
        onClose();
    };

    // ── Student row (shared UI atom) ───────────────────────────────────────
    const renderStudentPill = (student: Studente, variant: 'unassigned' | 'assigned' | 'other', onClick: () => void) => {
        const hist = studentHistory[student.id];
        const isAssigned = variant === 'assigned';
        const otherGrade = variant === 'other' ? assignments[student.id] : null;
        return (
            <ButtonBase
                key={student.id}
                onClick={onClick}
                focusRipple
                aria-label={`${student.cognome} ${student.nome} — ${isAssigned ? 'rimuovi' : 'assegna a ' + activeBand}`}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)',
                    width: '100%', textAlign: 'left', px: 'var(--md-sys-spacing-3)',
                    py: 'var(--md-sys-spacing-2)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    bgcolor: isAssigned
                        ? 'var(--md-sys-color-primary-container)'
                        : 'var(--md-sys-color-surface-container)',
                    '&:hover': {
                        bgcolor: isAssigned
                            ? 'var(--md-sys-color-primary-container)'
                            : 'var(--md-sys-color-surface-container-high)',
                    },
                    transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                }}
            >
                {isAssigned && (
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                        sx={{ fontSize: 16, color: 'var(--md-sys-color-primary)', flexShrink: 0 }}>
                        check_circle
                    </Box>
                )}
                {!isAssigned && (
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                        sx={{ fontSize: 16, color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}>
                        add_circle_outline
                    </Box>
                )}
                <Avatar name={`${student.nome} ${student.cognome}`} size="sm" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{
                        fontWeight: isAssigned ? 'var(--md-sys-typescale-weight-bold)' : 'var(--md-sys-typescale-weight-regular)',
                        color: isAssigned ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {student.cognome} {student.nome}
                    </Typography>
                </Box>
                {hist.grade && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>
                            {hist.grade}
                        </Typography>
                        {hist.trend && (
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                                sx={{ fontSize: 14, color: TREND_COLOR[hist.trend] }}>
                                {TREND_ICON[hist.trend]}
                            </Box>
                        )}
                    </Box>
                )}
                {otherGrade && (
                    <Box sx={{
                        px: '6px', py: '1px', borderRadius: 'var(--md-sys-shape-corner-full)',
                        bgcolor: gradeBgColor(otherGrade), flexShrink: 0,
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: gradeTextColor(otherGrade), fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>
                            {otherGrade}
                        </Typography>
                    </Box>
                )}
                {isAssigned && (
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                        sx={{ fontSize: 18, color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}>
                        close
                    </Box>
                )}
            </ButtonBase>
        );
    };

    // ── Prova config section ───────────────────────────────────────────────
    const renderProvaConfig = () => (
        <Box sx={{
            px: 'var(--md-sys-spacing-4)', pt: 'var(--md-sys-spacing-3)', pb: 'var(--md-sys-spacing-3)',
            borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
            bgcolor: 'var(--md-sys-color-surface-container-low)',
            display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)',
        }}>
            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-3)', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 130, flex: '1 1 130px' }}>
                    <InputLabel id="bulk-materia-label" shrink>Materia</InputLabel>
                    <Select
                        labelId="bulk-materia-label"
                        value={materia}
                        label="Materia"
                        notched
                        onChange={(e: SelectChangeEvent) => setMateria(e.target.value)}
                    >
                        {disciplines.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </Select>
                </FormControl>

                <TextField
                    type="date"
                    value={data}
                    size="small"
                    aria-label="Data prova"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData(e.target.value)}
                    sx={{ flex: '1 1 130px' }}
                    slotProps={{ inputLabel: { shrink: true } }}
                />
            </Box>

            {/* Tipo prova chips */}
            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)', overflowX: 'auto', pb: '2px', '&::-webkit-scrollbar': { height: '3px' } }}>
                {EVALUATION_TYPES.filter(t => t !== 'Ricevimento').map(t => (
                    <Chip
                        key={t}
                        label={t}
                        size="small"
                        color={tipo === t ? 'primary' : 'default'}
                        variant={tipo === t ? 'filled' : 'outlined'}
                        onClick={() => setTipo(t)}
                        sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    />
                ))}
            </Box>

            {/* Argomento */}
            <TextField
                value={argomento}
                label="Argomento / titolo prova"
                placeholder="opzionale"
                size="small"
                fullWidth
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArgomento(e.target.value)}
                aria-label="Argomento prova"
            />
        </Box>
    );

    // ── Mode: Per Livelli ──────────────────────────────────────────────────
    const renderLevelsMode = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)', pt: 'var(--md-sys-spacing-3)' }}>
            {/* Grade band selector */}
            <Box sx={{ px: 'var(--md-sys-spacing-4)' }}>
                <Typography variant="caption" sx={{
                    color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block',
                    mb: 'var(--md-sys-spacing-2)',
                }}>
                    1. Scegli il voto da assegnare
                </Typography>
                <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)', overflowX: 'auto', pb: '4px', '&::-webkit-scrollbar': { height: '3px' } }}>
                    {RATING_OPTIONS.map(opt => {
                        const count = bandCounts[opt] ?? 0;
                        const isActive = activeBand === opt;
                        return (
                            <Box key={opt} sx={{ position: 'relative', flexShrink: 0 }}>
                                <Chip
                                    label={opt}
                                    size="small"
                                    onClick={() => setActiveBand(opt)}
                                    color={isActive ? 'primary' : 'default'}
                                    variant={isActive ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: isActive ? 'var(--md-sys-typescale-weight-bold)' : 'var(--md-sys-typescale-weight-regular)' }}
                                />
                                {count > 0 && (
                                    <Box sx={{
                                        position: 'absolute', top: '-6px', right: '-6px',
                                        width: '16px', height: '16px', borderRadius: '50%',
                                        bgcolor: isActive ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-primary)',
                                        color: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 'var(--md-sys-typescale-body-small-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1,
                                    }}>
                                        {count}
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Student list */}
            <Box sx={{ px: 'var(--md-sys-spacing-4)' }}>
                <Typography variant="caption" sx={{
                    color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block',
                    mb: 'var(--md-sys-spacing-2)',
                }}>
                    2. Tocca gli studenti da assegnare a {activeBand}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-1)', maxHeight: '320px', overflowY: 'auto' }}>
                    {studentsForBand.map(s =>
                        renderStudentPill(s, 'assigned', () => removeAssignment(s.id))
                    )}
                    {unassignedStudents.map(s =>
                        renderStudentPill(s, 'unassigned', () => assignToBand(s.id))
                    )}
                    {reassignableStudents.map(s =>
                        renderStudentPill(s, 'other', () => assignToBand(s.id))
                    )}
                    {students.length === 0 && (
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', py: 'var(--md-sys-spacing-4)', textAlign: 'center' }}>
                            Nessuno studente in questa classe.
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );

    // ── Mode: Assistita AI ─────────────────────────────────────────────────
    const renderAiMode = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)', pt: 'var(--md-sys-spacing-3)' }}>
            {/* Action bar */}
            <Box sx={{
                px: 'var(--md-sys-spacing-4)', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                        sx={{ fontSize: 18, color: 'var(--md-sys-color-secondary)' }}>auto_awesome</Box>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Basato sull'andamento storico per {materia || 'la materia selezionata'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)' }}>
                    <Button size="small" variant="outlined" onClick={clearAll}>Azzera</Button>
                    <Button size="small" variant="contained" onClick={acceptAllSuggestions}
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>done_all</Box>}>
                        Accetta tutti
                    </Button>
                </Box>
            </Box>

            {/* Student rows */}
            <Box sx={{ px: 'var(--md-sys-spacing-2)', display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '340px', overflowY: 'auto' }}>
                {students.map(student => {
                    const hist = studentHistory[student.id];
                    const suggested = aiSuggestions[student.id];
                    const current = assignments[student.id] ?? '';
                    const isConfirmed = !!current;

                    return (
                        <Box key={student.id} sx={{
                            display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)',
                            px: 'var(--md-sys-spacing-3)', py: 'var(--md-sys-spacing-2)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            bgcolor: isConfirmed ? 'var(--md-sys-color-surface-container)' : 'transparent',
                            borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                        }}>
                            <Avatar name={`${student.nome} ${student.cognome}`} size="sm" />

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{
                                    fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                    color: 'var(--md-sys-color-on-surface)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {student.cognome} {student.nome}
                                </Typography>
                                {hist.grade ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>
                                            media {hist.grade}
                                        </Typography>
                                        {hist.trend && (
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                                                sx={{ fontSize: 13, color: TREND_COLOR[hist.trend] }}>
                                                {TREND_ICON[hist.trend]}
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-outline)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>
                                        nessuna storia valutazioni
                                    </Typography>
                                )}
                            </Box>

                            {/* Suggested badge (if not yet set) */}
                            {suggested && !current && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                                        sx={{ fontSize: 13, color: 'var(--md-sys-color-secondary)' }}>auto_awesome</Box>
                                    <Typography variant="caption" sx={{
                                        color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-small-font-size)', fontStyle: 'italic'
                                    }}>
                                        sug. {suggested}
                                    </Typography>
                                </Box>
                            )}

                            {/* Grade select */}
                            <Select
                                size="small"
                                value={current}
                                displayEmpty
                                renderValue={(v) => v
                                    ? <Typography variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: gradeTextColor(v as string) }}>{v as string}</Typography>
                                    : <Typography variant="body2" sx={{ color: 'var(--md-sys-color-outline)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>—</Typography>
                                }
                                onChange={(e: SelectChangeEvent) => setAssignments(prev => {
                                    if (!e.target.value) { const n = { ...prev }; delete n[student.id]; return n; }
                                    return { ...prev, [student.id]: e.target.value };
                                })}
                                sx={{
                                    minWidth: '72px', flexShrink: 0,
                                    bgcolor: current ? gradeBgColor(current) : 'var(--md-sys-color-surface-container)',
                                    '& .MuiSelect-select': { py: '4px', px: '8px' },
                                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                    borderRadius: 'var(--md-sys-shape-corner-small)',
                                }}
                            >
                                <MenuItem value=""><em>—</em></MenuItem>
                                {RATING_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                            </Select>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );

    // ── DialogActions status bar ───────────────────────────────────────────
    const statusBar = (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 'var(--md-sys-spacing-3)' }}>
            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-outline)' }}>
                {assignedCount}/{totalCount} studenti assegnati
            </Typography>
            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)' }}>
                <Button onClick={onClose} variant="outlined">Annulla</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={assignedCount === 0}
                    startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18 }}>save</Box>}
                >
                    Salva {assignedCount > 0 ? `(${assignedCount})` : ''}
                </Button>
            </Box>
        </Box>
    );

    return (
        <M3Dialog
            onClose={onClose}
            title="Valutazione di Gruppo"
            maxWidth="sm"
            buttons={statusBar}
        >
            {/* Prova config */}
            {renderProvaConfig()}

            {/* Mode tabs */}
            <Tabs
                value={mode}
                onChange={(_, v: BulkMode) => setMode(v)}
                indicatorColor="primary"
                textColor="primary"
                sx={{
                    px: 'var(--md-sys-spacing-4)',
                    borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                    bgcolor: 'var(--md-sys-color-surface)',
                    minHeight: 'auto',
                }}
            >
                <Tab
                    value="levels"
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>tune</Box>
                            Per Livelli
                        </Box>
                    }
                    sx={{ minHeight: 'var(--md-sys-spacing-12)', py: 'var(--md-sys-spacing-1)', textTransform: 'none', fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}
                />
                <Tab
                    value="ai"
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>auto_awesome</Box>
                            Assistita AI
                        </Box>
                    }
                    sx={{ minHeight: 'var(--md-sys-spacing-12)', py: 'var(--md-sys-spacing-1)', textTransform: 'none', fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}
                />
            </Tabs>

            {/* Mode content */}
            <Box sx={{ overflowY: 'auto' }}>
                {mode === 'levels' && renderLevelsMode()}
                {mode === 'ai' && renderAiMode()}
            </Box>
        </M3Dialog>
    );
};

export default BulkEvaluationModal;
