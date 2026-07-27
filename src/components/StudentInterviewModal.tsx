// MD3 Compliant - Migration completed
// StudentInterviewModal.tsx - All styling uses MD3 tokens via style props

import React, { useMemo } from 'react';
import { Studente, Valutazione, ValutazioneCompetenza, TimetableSettings } from '../types';
import { calculatePerformance } from '../utils/evaluationUtils';
import BarChart from './charts/BarChart';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog, InfoCard } from './ui';
interface StudentInterviewModalProps {
    student: Studente;
    evaluations: Valutazione[];
    competencyEvaluations: ValutazioneCompetenza[];
    settings: TimetableSettings;
    onClose: () => void;
}

const StudentInterviewModal: React.FC<StudentInterviewModalProps> = ({ student, evaluations, competencyEvaluations, settings, onClose }) => {
  const performance = useMemo(() => calculatePerformance(student.id, 'Complessivo', evaluations), [student.id, evaluations]);

    // Group evaluations by subject
    const subjectAverages = useMemo(() => {
        const groups: Record<string, number[]> = {};
        evaluations.forEach(ev => {
            if (!groups[ev.materia]) groups[ev.materia] = [];
            const val = parseFloat(ev.voto);
            if (!isNaN(val)) groups[ev.materia].push(val);
        });

        return Object.entries(groups).map(([materia, voti]) => ({
            label: materia,
            value: parseFloat((voti.reduce((a, b) => a + b, 0) / voti.length).toFixed(1))
        }));
    }, [evaluations]);

    // Recent competencies
    const recentCompetencies = useMemo(() => {
        return settings.competenze.map(comp => {
            const latestEval = competencyEvaluations
                .filter(e => e.competenzaId === comp.id)
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

            if (!latestEval) return null;
            const level = comp.livelli.find(l => l.id === latestEval.livelloId);
            return { name: comp.nome, level: level?.nome, desc: level?.descrizione, date: latestEval.data };
        }).filter(Boolean);
    }, [competencyEvaluations, settings.competenze]);

    return (
        <M3Dialog
            onClose={onClose}
            title={`Modalità Colloquio - Classe ${student.classe}`}
            headline={`${student.cognome} ${student.nome}`}
            maxWidth="lg"
            mode="fullscreen"
            buttons={
                <Button onClick={onClose} variant="text">Chiudi Vista</Button>
            }
        >
            <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-6)', height: 'var(--md-sys-percent-100)' }}>
                {/* Left Column: Performance */}
                <Box sx={{ gap: 'var(--md-sys-spacing-6)' }}>
                    <Box data-testid="m3-card" sx={{
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 50%, transparent)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        padding: 'var(--md-sys-spacing-6)',
                        border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)'
                    }}>
                        <Typography variant="h5" sx={{ mb: 'var(--md-sys-spacing-8)', display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)' }}>
                            <Typography component="span" sx={{ color: 'var(--md-sys-color-primary)' }}>monitoring</Typography>
                            Andamento Didattico
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-6)', mb: 'var(--md-sys-spacing-6)' }}>
                            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', flex: 1, border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)' }}>
                                <Typography component="span" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block', fontSize: 'var(--md-sys-typescale-body-large-font-size)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Media Generale</Typography>
                                <Typography component="span" sx={{
                                    fontSize: 'var(--md-sys-typescale-display-small-font-size)',
                                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                    color: parseFloat(performance.grade || '0') < 6 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)'
                                }}>
                                    {performance.grade || '-'}
                                </Typography>
                            </Box>
                            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', flex: 1, border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)' }}>
                                <Typography component="span" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block', fontSize: 'var(--md-sys-typescale-body-large-font-size)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Trend</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 'var(--md-sys-spacing-4)', mt: 'var(--md-sys-spacing-4)' }}>
                                    <Typography component="span" sx={{
                                        fontSize: 'var(--md-sys-typescale-display-small-font-size)',
                                        color: performance.trend === 'up' ? 'var(--md-sys-color-tertiary)' : performance.trend === 'down' ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-outline-variant)'
                                    }}>
                                        {performance.trend === 'up' ? 'trending_up' : performance.trend === 'down' ? 'trending_down' : 'trending_flat'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Typography variant="h6" sx={{ mb: 'var(--md-sys-spacing-8)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Media per Materia</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <BarChart data={subjectAverages} color="var(--md-sys-color-primary)" horizontal />
                        </Box>
                    </Box>

                    <Box data-testid="m3-card" sx={{
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 50%, transparent)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        padding: 'var(--md-sys-spacing-6)',
                        border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)'
                    }}>
                        <Typography variant="h5" sx={{ mb: 'var(--md-sys-spacing-8)', display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)' }}>
                            <Typography component="span" sx={{ color: 'var(--md-sys-color-secondary)' }}>history</Typography>
                            Ultime Valutazioni
                        </Typography>
                        <Box sx={{ gap: 'var(--md-sys-spacing-2)' }}>
                            {evaluations.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5).map(ev => (
                                <Box key={ev.id} sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--md-sys-spacing-6)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)', transition: 'color var(--md-sys-motion-duration-medium)' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{ev.materia}</Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>{new Date(ev.data).toLocaleDateString()}</Typography>
                                    </Box>
                                    <Typography component="span" sx={{
                                        fontSize: 'var(--md-sys-typescale-headline-small-font-size)',
                                        fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                        color: parseFloat(ev.voto) < 6 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)'
                                    }}>
                                        {ev.voto}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Right Column: Competencies & Notes */}
                <Box sx={{ gap: 'var(--md-sys-spacing-6)' }}>
                    <Box data-testid="m3-card" sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 50%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)' }}>
                        <Typography variant="h5" sx={{ mb: 'var(--md-sys-spacing-8)', display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)' }}>
                            <Typography component="span" sx={{ color: 'var(--md-sys-color-tertiary)' }}>verified</Typography>
                            Competenze Trasversali
                        </Typography>
                        <Box sx={{ gap: 'var(--md-sys-spacing-3)' }}>
                            {recentCompetencies.length > 0 ? (
                                recentCompetencies.map((comp, idx) => (
                                    comp && (
                                    <Box key={idx} sx={{
                                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-tertiary-container) 10%, transparent)',
                                        borderRadius: 'var(--md-sys-shape-corner-large)',
                                        padding: 'var(--md-sys-spacing-8)',
                                        border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)'
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 'var(--md-sys-spacing-4)' }}>
                                            <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{comp.name}</Typography>
                                            <Typography component="span" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', backgroundColor: 'var(--md-sys-color-tertiary)', border: 'none' }}>{comp.level}</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>{comp.desc}</Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 'var(--md-sys-spacing-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rilevato il {new Date(comp.date).toLocaleDateString()}</Typography>
                                    </Box>
                                    )))
                            ) : (
                                <InfoCard
                                    type="info"
                                    description="Nessuna competenza ancora valutata per questo studente."
                                />
                            )}
                        </Box>
                    </Box>

                    <Box data-testid="m3-card" sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 50%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)' }}>
                        <Typography variant="h5" sx={{ mb: 'var(--md-sys-spacing-8)', display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)' }}>
                            <Typography component="span" className="material-symbols-outlined" sx={{ color: 'var(--md-sys-color-primary)' }}>info</Typography>
                            Informazioni Studente
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-8)' }}>
                            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)' }}>
                                <Typography component="span" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-small-font-size)', textTransform: 'uppercase', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Classe</Typography>
                                <Typography variant="body2" sx={{ fontSize: 'var(--md-sys-typescale-headline-small-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{student.classe}</Typography>
                            </Box>
                            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)' }}>
                                <Typography component="span" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-small-font-size)', textTransform: 'uppercase', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Bisogni</Typography>
                                <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-4)', mt: 'var(--md-sys-spacing-4)' }}>
                                    {student.hasBES && <Box component="span" sx={{ backgroundColor: 'var(--md-sys-color-tertiary)', width: 'var(--md-sys-spacing-3)', height: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-spacing-4)' }} title="BES" />}
                                    {student.hasDSA && <Box component="span" sx={{ backgroundColor: 'var(--md-sys-color-error)', width: 'var(--md-sys-spacing-3)', height: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-spacing-4)' }} title="DSA" />}
                                    {student.has104 && <Box component="span" sx={{ width: 'var(--md-sys-spacing-3)', height: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-primary)' }} title="L.104" />}
                                    {!student.hasBES && !student.hasDSA && !student.has104 && <Typography component="span" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>-</Typography>}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </M3Dialog>

    );
};

export default StudentInterviewModal;

