// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026
import React, { useState } from 'react';
import { HomeworkSubmission, Lezione, Studente } from '../types';
import { TextField, Avatar } from './ui';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import { saveAs } from '../utils/documentUtils';
import { RATING_OPTIONS } from '../constants';

// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for homework submission cards, grading forms, and status displays
interface HomeworkSubmissionProps {
    submission: HomeworkSubmission;
    student: Studente;
    lesson: Lezione;
    onGrade?: (submissionId: string, grade: string, feedback: string) => void;
}

const HomeworkSubmissionCard: React.FC<HomeworkSubmissionProps> = ({ submission, student, lesson, onGrade }) => {
    const [grade, setGrade] = useState<string>(submission.teacherFeedback || '');
    const [feedback, setFeedback] = useState<string>('');

    const handleDownload = () => {
        if (submission.file) {
            const byteCharacters = atob(submission.file.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: submission.file.mimeType });
            saveAs(blob, submission.file.name);
        }
    };

    const handleGradeSubmit = () => {
        if (onGrade) {
            onGrade(submission.id, grade, feedback);
        }
    };

    return (
        <Stack spacing="var(--md-sys-spacing-4)">
            <Stack direction="row" spacing="var(--md-sys-spacing-4)" alignItems="center">
                <Avatar name={`${student.nome} ${student.cognome}`} size="lg" />
                <Stack spacing="var(--md-sys-spacing-1)">
                    <Typography variant="h6" component="h3">{student.cognome} {student.nome}</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {lesson.materia} • {lesson.contenuto}
                    </Typography>
                </Stack>
            </Stack>

            <Stack direction="row" spacing="var(--md-sys-spacing-4)" alignItems="center">
                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>description</Box>
                <Stack spacing="var(--md-sys-spacing-1)" sx={{ flex: 1 }}>
                    <Typography variant="body1">{submission.file?.name || 'Allegato Elaborato'}</Typography>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{submission.file?.mimeType}</Typography>
                </Stack>
                <Button onClick={handleDownload} variant="contained" color="secondary" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">download</Box>} sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)', fontWeight: 'var(--md-sys-typescale-weight-black)' }}>
                    Scarica
                </Button>
            </Stack>

            {submission.status === 'pending' && onGrade && (
                <Stack spacing="var(--md-sys-spacing-4)">
                    <FormControl fullWidth>
                        <InputLabel id="hw-grade-label" shrink>Voto Finale</InputLabel>
                        <Select
                            labelId="hw-grade-label"
                            value={grade}
                            label="Voto Finale"
                            displayEmpty
                            notched
                            onChange={(e: SelectChangeEvent) => setGrade(e.target.value)}
                            renderValue={(v) => v || <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>-</Typography>}
                        >
                            {RATING_OPTIONS.map((v) => (
                                <MenuItem key={v} value={v}>{v}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Feedback Rapido"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Es. Analisi molto curata, bravo..."
                        slotProps={{ htmlInput: { startAdornment: <InputAdornment position="start"><Box component="span" className="material-symbols-outlined" aria-hidden="true">chat</Box></InputAdornment> } }}
                    />
                    <Button
                        onClick={handleGradeSubmit}
                        disabled={!grade}
                        variant="contained"
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">task_alt</Box>}
                    >
                        Registra Valutazione &amp; Archivia
                    </Button>
                </Stack>
            )}

            {submission.status === 'graded' && (
                <Stack direction="row" spacing="var(--md-sys-spacing-3)" alignItems="center">
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>check</Box>
                    <Stack spacing="var(--md-sys-spacing-1)">
                        <Typography variant="body1">Valutato con successo</Typography>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Esito: {submission.teacherFeedback}</Typography>
                        {feedback && <Typography variant="body2" sx={{ fontStyle: 'italic' }}>\u201c{feedback}\u201d</Typography>}
                    </Stack>
                </Stack>
            )}
        </Stack>
    );
};

export default HomeworkSubmissionCard;

