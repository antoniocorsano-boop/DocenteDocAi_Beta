// MD3 Compliant - Migration completed
// AiAdvisor.tsx - All styling uses MD3 tokens via style props

import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { AiSettings, Studente, TimetableSettings, Valutazione, ValutazioneCompetenza } from '../types';
// Fase 4: FULL routing via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { AiThinkingGem } from './ui';
import { logger } from '../utils/logger';

// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for AI advisor interface, form controls, and advice display
interface AiAdvisorProps {
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvals: ValutazioneCompetenza[];
    settings: TimetableSettings;
    aiSettings: AiSettings;
}

interface Advice {
    titolo: string;
    descrizione: string;
}

const AiAdvisor: React.FC<AiAdvisorProps> = ({ students, evaluations, competencyEvals, settings, aiSettings }) => {
    const [advisorStatus, setAdvisorStatus] = useState<string | null>(null);
    const [advice, setAdvice] = useState<Advice[] | null>(null);
    const [error, setError] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
    const [requestType, setRequestType] = useState<'recupero' | 'potenziamento'>('recupero');

    const handleGenerateAdvice = useCallback(async () => {
        setAdvisorStatus("Analisi dei dati in corso...");
        setAdvice(null);
        setError('');

        try {
            let studentData: unknown;
            if (selectedStudentId === 'all') {
                studentData = {
                    nome: "Tutta la classe",
                    valutazioni: evaluations.slice(-30), // last 30 evals for the class
                    competenze: competencyEvals.slice(-30)
                };
            } else {
                const student = students.find(s => s.id === selectedStudentId);
                if (!student) throw new Error("Studente non trovato.");
                studentData = {
                    nome: `${student.cognome} ${student.nome}`,
                    valutazioni: evaluations.filter(e => e.studenteId === student.id),
                    competenze: competencyEvals.filter(e => e.studenteId === student.id)
                };
            }
            
            setAdvisorStatus(requestType === 'recupero' ? "Elaborazione strategie di recupero..." : "Elaborazione strategie di potenziamento...");
            await new Promise(r => setTimeout(r, 500)); // UX delay

            // POST-Fase 4 rollout: generate pedagogical advice via central prompt builder
            const result = await AIBrain.generateWithCentralPrompt('pedagogical-advice', { type: requestType, ... (studentData as any) }, aiSettings) as any;
            setAdvice((result?.suggerimenti || []) as Advice[]);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Si è verificato un errore durante la generazione del consiglio.";
            logger.error(err);
            setError(errorMsg);
        } finally {
            setAdvisorStatus(null);
        }
    }, [students, evaluations, competencyEvals, selectedStudentId, requestType, aiSettings, settings]);

    return (
        <Stack spacing={3} sx={{
            p: 'var(--md-sys-spacing-6)',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'
        }}>
            <Typography component="h2" variant="h6" sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--md-sys-spacing-3)',
                fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                color: 'var(--md-sys-color-on-surface)',
                margin: 0
            }}>
                <span style={{
                    fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                    color: 'var(--md-sys-color-primary)'
                }}>psychology</span>
                Consulente Didattico AI
            </Typography>

            {/* Post-Fase 4 visible block - prompt centralization rollout */}
            <Box sx={{ 
              fontSize: '0.72rem', 
              color: 'var(--md-sys-color-on-surface-variant)', 
              mb: 1, 
              px: 1,
              py: 0.5,
              bgcolor: 'var(--md-sys-color-surface-container-low)',
              borderRadius: 'var(--md-sys-shape-corner-small)'
            }}>
              AIBrain (Post-Fase 4): AiAdvisor — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (pedagogical advice)
            </Box>
            <Typography component="p" variant="subtitle1" sx={{
                color: 'var(--md-sys-color-on-surface-variant)',
                fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                lineHeight: 1.5,
                margin: 0
            }}>
                Seleziona uno studente (o l'intera classe) e un obiettivo. L'AI analizzerà i dati e proporrà attività personalizzate.
            </Typography>

            <Stack spacing={2} sx={{
                p: 'var(--md-sys-spacing-6)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)'
            }}>
                <FormControl fullWidth>
                    <InputLabel id="student-select-advisor-label" shrink>Studente / Gruppo</InputLabel>
                    <Select
                        labelId="student-select-advisor-label"
                        inputProps={{ id: 'student-select-advisor' }}
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                        label="Studente / Gruppo"
                        displayEmpty
                        notched
                    >
                        <MenuItem value="all">Tutta la classe</MenuItem>
                        {students.map(s => <MenuItem key={s.id} value={s.id}>{s.cognome} {s.nome}</MenuItem>)}
                    </Select>
                </FormControl>

                <Stack spacing={1}>
                    <Typography component="span" variant="overline" sx={{
                        fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                        fontWeight: 'var(--md-sys-typescale-weight-bold)',
                        color: 'var(--md-sys-color-on-surface)',
                        letterSpacing: 'var(--md-sys-typescale-label-small-tracking)'
                    }}>Tipo di Intervento</Typography>
                    <ToggleButtonGroup
                        exclusive
                        value={requestType}
                        onChange={(_e, val) => { if (val) setRequestType(val); }}
                        aria-label="Tipo di intervento"
                        fullWidth
                        sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', overflow: 'hidden' }}
                    >
                        <ToggleButton value="recupero" aria-label="Recupero">Recupero</ToggleButton>
                        <ToggleButton value="potenziamento" aria-label="Potenziamento">Potenziamento</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        onClick={handleGenerateAdvice}
                        disabled={!!advisorStatus}
                        aria-label={advisorStatus ? 'Elaborazione consiglio in corso...' : 'Genera consiglio AI'}
                        startIcon={advisorStatus ? <AiThinkingGem size="small" inline text="" /> : undefined}
                    >
                        {advisorStatus ? 'Elaborazione...' : 'Genera Consiglio'}
                    </Button>
                </Box>
            </Stack>

            {advisorStatus && (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    p: 'var(--md-sys-spacing-4)',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)'
                }}>
                    <AiThinkingGem size="medium" text={advisorStatus} />
                </Box>
            )}
            {error && <Typography component="p" variant="body1" sx={{
                color: 'var(--md-sys-color-error)',
                fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                backgroundColor: `color-mix(in srgb, var(--md-sys-color-error) var(--md-sys-percent-10), transparent)`,
                padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-error)',
                margin: 0
            }}>{error}</Typography>}
            {advice && (
                <Box sx={{
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                    p: 'var(--md-sys-spacing-6)'
                }}>
                    <Typography component="h3" variant="h6" sx={{
                        fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                        fontWeight: 'var(--md-sys-typescale-weight-bold)',
                        color: 'var(--md-sys-color-on-surface)',
                        mb: 'var(--md-sys-spacing-4)',
                        mt: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-2)'
                    }}>
                        <span style={{
                            fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                            color: 'var(--md-sys-color-primary)'
                        }}>lightbulb</span>
                        Suggerimenti dell'AI:
                    </Typography>
                    <Stack spacing={2}>
                        {advice.map((item, index) => (
                            <Box key={index} sx={{
                                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                                borderRadius: 'var(--md-sys-shape-corner-large)',
                                p: 'var(--md-sys-spacing-4)',
                                border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)'
                            }}>
                                <Typography component="h4" variant="subtitle2" sx={{
                                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                    color: 'var(--md-sys-color-on-surface)',
                                    mb: 'var(--md-sys-spacing-2)',
                                    mt: 0
                                }}>{item.titolo}</Typography>
                                <Typography component="p" variant="body1" sx={{
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                    lineHeight: 1.5,
                                    margin: 0
                                }}>{item.descrizione}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}
        </Stack>
    );
};

export default AiAdvisor;

