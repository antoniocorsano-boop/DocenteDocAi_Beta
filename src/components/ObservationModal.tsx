// MD3 Compliant
import React, { useState } from 'react';
import { Studente, ObservationEntry } from '../types';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import TextField from '@mui/material/TextField';
import { M3Dialog } from './ui';

interface ObservationModalProps {
    student: Studente;
    initialData?: ObservationEntry;
    onClose: () => void;
    onSave: (data: ObservationEntry) => void;
}

const ObservationModal: React.FC<ObservationModalProps> = ({ student, initialData, onClose, onSave }) => {
    const [autonomy, setAutonomy] = useState(initialData?.autonomy || 0);
    const [collaboration, setCollaboration] = useState(initialData?.collaboration || 0);
    const [responsibility, setResponsibility] = useState(initialData?.responsibility || 0);
    const [note, setNote] = useState(initialData?.note || '');

    const RatingStars = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
        <Box
            sx={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                padding: 'var(--md-sys-spacing-5)',
                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--md-sys-spacing-8)',
                    px: 'var(--md-sys-spacing-4)' }}
            >
                <Typography
                    component="span"
                    sx={{
                        color: 'var(--md-sys-color-primary)',
                        fontWeight: 'var(--md-sys-typescale-weight-black)',
                        textTransform: 'uppercase' }}
                >{label}</Typography>
                <Typography
                    component="span"
                    sx={{
                        fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                        fontWeight: 'var(--md-sys-typescale-weight-black)',
                        color: 'var(--md-sys-color-primary)' }}
                >{value}/4</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--md-sys-spacing-8)' }}>
                {[1, 2, 3, 4].map((i) => (
                    <ButtonBase key={i} onClick={() => onChange(i)} aria-label={`Valutazione ${i} di 4`} aria-pressed={i <= value} sx={{
                        flex: 1,
                        height: 'var(--md-sys-spacing-14)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
                        backgroundColor: i <= value ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-low)',
                        color: i <= value ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
                        border: i <= value ? 'none' : 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                        boxShadow: i <= value ? 'var(--md-sys-elevation-level1)' : 'none',
                        transform: i <= value ? 'scale(1.05)' : 'scale(1)' }}>
                        <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 'var(--md-sys-spacing-6)' }}>{i <= value ? 'star' : 'star_outline'}</Box>
                    </ButtonBase>
                ))}
            </Box>
        </Box>
    );

    const handleSave = () => {
        onSave({ autonomy, collaboration, responsibility, note });
        onClose();
    };

    return (
        <M3Dialog
            title="Osservazione Formativa"
            onClose={onClose}
            maxWidth="md"
            buttons={<>
                <Button onClick={onClose} variant="text">Annulla</Button>
                <Button onClick={handleSave} variant="contained">Registra Nota</Button>
            </>}
        >
            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                <Box sx={{ mb: 'var(--md-sys-spacing-6)', px: 'var(--md-sys-spacing-4)' }}>
                    <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                        {student.cognome} {student.nome}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
                    <RatingStars label="Autonomia" value={autonomy} onChange={setAutonomy} />
                    <RatingStars label="Collaborazione" value={collaboration} onChange={setCollaboration} />
                    <RatingStars label="Responsabilità" value={responsibility} onChange={setResponsibility} />
                    <TextField multiline label="Aneddoti / Note Osservative" value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Es. Ha dimostrato iniziativa nel lavoro di gruppo..." />
                </Box>
            </Box>
        </M3Dialog>
    );
};

export default ObservationModal;

