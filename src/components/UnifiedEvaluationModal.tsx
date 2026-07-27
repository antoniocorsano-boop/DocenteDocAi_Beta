// ✅ MD3 Native Compliant - Migrated to direct MD3 tokens

import React, { useState, useMemo } from 'react';
import type { Studente, Prova, Valutazione, ValutazioneCompetenza, TimetableSettings } from '../types';
import { RATING_OPTIONS } from '../constants';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import { M3Dialog, InfoCard } from './ui';
interface UnifiedEvaluationModalProps {
    student: Studente;
    prova: Prova;
    settings: TimetableSettings;
    existingGrade: Valutazione | undefined;
    existingCompetencyEvals: ValutazioneCompetenza[];
    onClose: () => void;
    onSave: (data: {
        grade: string;
        competencyEvals: Record<string, string>; // competenzaId -> livelloId
    }) => void;
}

const getTestTypeIcon = (tipo: string) => {
  switch (tipo) {
        case 'Scritto': return 'edit_note';
        case 'Orale': return 'record_voice_over';
        case 'Pratico': return 'build';
        case 'Test': return 'quiz';
        default: return 'assignment';
    }
};

const UnifiedEvaluationModal: React.FC<UnifiedEvaluationModalProps> = ({
    student,
    prova,
    settings,
    existingGrade,
    existingCompetencyEvals,
    onClose,
    onSave }) => {
    const [grade, setGrade] = useState(existingGrade?.voto || '');
    const [selectedLevels, setSelectedLevels] = useState<Record<string, string>>(() => {
        return existingCompetencyEvals.reduce((acc, curr) => {
            acc[curr.competenzaId] = curr.livelloId;
            return acc;
        }, {} as Record<string, string>);
    });

    const relevantCompetencies = useMemo(() => {
        return settings.competenze.filter(c =>
            !c.disciplines || c.disciplines.length === 0 || c.disciplines.includes(prova.materia)
        );
    }, [settings.competenze, prova.materia]);

    const handleLevelChange = (competenzaId: string, livelloId: string) => {
        setSelectedLevels(prev => ({
            ...prev,
            [competenzaId]: livelloId
        }));
    };

    const handleSubmit = () => {
        onSave({ grade, competencyEvals: selectedLevels });
    };

    return (
        <M3Dialog
            onClose={onClose}
            title={`Valutazione ${prova.tipo}`}
            maxWidth="sm"
            buttons={
                <>
                    <Button onClick={onClose} variant="text">Annulla</Button>
                    <Button onClick={handleSubmit} variant="contained">Salva Valutazione</Button>
                </>
            }
        >
            {/* Aura Ornaments */}
            <Box sx={{ backgroundColor: 'var(--md-sys-color-primary)', opacity: 0.05, borderRadius: 'var(--md-sys-spacing-4)' }} />
            <Box sx={{ backgroundColor: 'var(--md-sys-color-secondary)', opacity: 0.05, borderRadius: 'var(--md-sys-spacing-4)' }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)', pt: 'var(--md-sys-spacing-4)', pb: 'var(--md-sys-spacing-4)' }}>
                <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)', display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', color: 'var(--md-sys-color-on-primary)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography component="span" sx={{ color: 'var(--md-sys-color-on-primary)' }}>{getTestTypeIcon(prova.tipo)}</Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 'var(--md-sys-spacing-8)', opacity: 'var(--md-sys-state-opacity-secondary)' }}>
                            {student.cognome} {student.nome} • {prova.materia}
                        </Typography>
                                                <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel id="unified-grade-label" shrink>Voto Numerico</InputLabel>
                          <Select
                            labelId="unified-grade-label"
                            value={grade}
                            label="Voto Numerico"
                            displayEmpty
                            notched
                            onChange={(e: SelectChangeEvent) => setGrade(e.target.value)}
                            renderValue={(v) => v || <Typography variant="body2" sx={{ opacity: 0.6 }}>Nessun Voto</Typography>}
                          >
                            <MenuItem value="">Nessun Voto</MenuItem>
                            {RATING_OPTIONS.map(o => (
                              <MenuItem key={o} value={o}>{o}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-6)', pl: 'var(--md-sys-spacing-4)', pr: 'var(--md-sys-spacing-4)' }}>
                        <Box sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) var(--md-sys-percent-10), transparent)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography component="span" sx={{ color: 'var(--md-sys-color-primary)', fontSize: 'var(--md-sys-spacing-4)' }}>verified</Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', letterSpacing: '-0.005em' }}>Competenze Valutate</Typography>
                    </Box>

                    {relevantCompetencies.length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-8)', overflowY: 'auto' }}>
                            {relevantCompetencies.map((competenza, idx) => (
                                <Box
                                    key={competenza.id}
                                    sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-low)', padding: 'var(--md-sys-spacing-6)', border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)', transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', animationDelay: `${idx * 100}ms` }}
                                >
                                    <Box sx={{ textTransform: 'uppercase', color: 'var(--md-sys-color-primary)', mb: 'var(--md-sys-spacing-8)', fontWeight: 'var(--md-sys-typescale-weight-black)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-black)' }}>{competenza.nome}</Typography>
                                        {selectedLevels[competenza.id] && (
                                            <ButtonBase
                                                component="button"
                                                type="button"
                                                onClick={() => setSelectedLevels(prev => {
                                                    const { [competenza.id]: _removed, ...rest } = prev;
                                                    return rest;
                                                })}
                                                sx={{ color: 'var(--md-sys-color-error)', backgroundColor: 'var(--md-sys-color-error-container)', borderRadius: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-weight-black)', transition: 'color var(--md-sys-motion-duration-medium)', px: 1 }}
                                            >
                                                RIMUOVI
                                            </ButtonBase>
                                        )}
                                    </Box>
                                    <Box sx={{ gap: 'var(--md-sys-spacing-3)' }}>
                                        {competenza.livelli.map(level => {
                                            const isSelected = selectedLevels[competenza.id] === level.id;
                                            return (
                                                <Box
                                                    key={level.id}
                                                    component="label"
                                                    sx={{ padding: 'var(--md-sys-spacing-8)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`competenza-${competenza.id}`}
                                                        value={level.id}
                                                        checked={isSelected}
                                                        onChange={() => handleLevelChange(competenza.id, level.id)}
                                                    />
                                                    <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}>
                                                        {isSelected && <Box sx={{ backgroundColor: 'var(--md-sys-color-on-primary)', width: 'var(--md-sys-spacing-2)', height: 'var(--md-sys-spacing-2)', borderRadius: 'var(--md-sys-spacing-4)' }} />}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                                                        <Typography component="span" sx={{ color: isSelected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-black)', display: 'block' }}>{level.nome}</Typography>
                                                        <Typography variant="body2">{level.descrizione}</Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <InfoCard
                            type="info"
                            message={`Nessuna competenza associata alla materia "${prova.materia}".`}
                        />
                    )}
                </Box>
            </Box>
        </M3Dialog>
    );
};

export default UnifiedEvaluationModal;

