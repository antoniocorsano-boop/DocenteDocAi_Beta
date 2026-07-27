// MD3 Compliant - Block G Migration (13 violations eliminated)

import React, { useState } from 'react';
import { Valutazione } from '../types';
import { EVALUATION_TYPES } from '../constants';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { M3Dialog, TextField } from './ui';
interface AddProvaModalProps {
    disciplines: string[];
    onClose: () => void;
    onSave: (prova: Omit<Valutazione, 'id' | 'studenteId' | 'voto'>) => void;
}

const getTestTypeIcon = (tipo: string) => {
  switch (tipo) {
        case 'Scritto': return 'edit_note';
        case 'Orale': return 'record_voice_over';
        case 'Pratico': return 'build';
        case 'Test': return 'quiz';
        case 'Verifica': return 'assignment_late';
        default: return 'assignment';
    }
};

const ChoiceCard: React.FC<{ icon: string; label: string; onClick: () => void; selected: boolean }> = ({ icon, label, onClick, selected }) => (
  <Paper
    elevation={selected ? 3 : 1}
    sx={{
      borderRadius: 'var(--md-sys-shape-corner-extra-large)',
      border: `2px solid ${selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
      bgcolor: selected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
      color: selected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
      transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
      minWidth: 'var(--md-sys-spacing-16)',
      transform: selected ? 'scale(1.05)' : 'none',
    }}
  >
    <ButtonBase
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 'var(--md-sys-spacing-2)', p: 'var(--md-sys-spacing-4)', width: '100%',
        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        '&:hover': {
          bgcolor: selected
            ? 'color-mix(in srgb, var(--md-sys-color-primary) 8%, var(--md-sys-color-primary-container))'
            : 'var(--md-sys-color-surface-container-high)',
        },
      }}
    >
      <Box sx={{ width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)', borderRadius: 'var(--md-sys-shape-corner-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)', color: selected ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-primary)', transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)' }}>
        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-medium)', userSelect: 'none' }}>{icon}</Box>
      </Box>
      <Box component="span" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontFamily: 'var(--md-sys-typescale-body-small-font-family)' }}>{label}</Box>
    </ButtonBase>
  </Paper>
);

const AddProvaModal: React.FC<AddProvaModalProps> = ({ disciplines, onClose, onSave }) => {
    const [materia, setMateria] = useState<string>((disciplines && disciplines[0]) || '');
    const [tipo, setTipo] = useState<Valutazione['tipo']>('Scritto');
    const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
    const [argomento, setArgomento] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            materia,
            tipo,
            data,
            argomento
        });
        onClose();
    };

    return (
        <M3Dialog
            onClose={onClose}
            title="Aggiungi Prova di Valutazione"
            buttons={
                <>
                    <Button type="button" onClick={onClose} variant="text">Annulla</Button>
                    <Button type="submit" form="add-prova-form" variant="contained">Crea Prova</Button>
                </>
            }
        >
            <Box id="add-prova-form" component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
                <Typography variant="body2" component="p" sx={{
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    fontWeight: 'var(--md-sys-typescale-body-large-font-weight)',
                    lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
                    color: 'var(--md-sys-color-on-surface-variant)'
                }}>
                    Stai creando una nuova colonna nella griglia di valutazione per la classe selezionata.
                </Typography>

                <TextField
                    id="prova-argomento"
                    name="argomento"
                    label="Titolo / Argomento"
                    value={argomento}
                    onChange={e => setArgomento(e.target.value)}
                    placeholder="Es. 'Verifica sul Barocco'"
                    required
                />

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'var(--md-sys-grid-fr-1)',
                    gap: 'var(--md-sys-spacing-4)'
                }}>
                    <TextField
                        id="prova-data"
                        name="data"
                        label="Data"
                        type="date"
                        value={data}
                        onChange={e => setData(e.target.value)}
                        required
                    />
                    <FormControl fullWidth>
                      <InputLabel id="prova-materia-label" shrink>Materia</InputLabel>
                      <Select
                        labelId="prova-materia-label"
                        id="prova-materia"
                        value={materia}
                        label="Materia"
                        displayEmpty
                        notched
                        required
                        onChange={(e: SelectChangeEvent) => setMateria(e.target.value)}
                        renderValue={(v) => v || <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>Seleziona...</Typography>}
                      >
                        {(disciplines || []).map(d => (
                          <MenuItem key={d} value={d}>{d}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography component="label" sx={{
                        fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                        fontWeight: 'var(--md-sys-typescale-body-large-font-weight)',
                        lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
                        color: 'var(--md-sys-color-on-surface)',
                        mb: 'var(--md-sys-spacing-3)'
                    }}>Tipo Prova</Typography>
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--md-sys-spacing-4)'
                    }}>
                        {EVALUATION_TYPES.map(t => (
                            <ChoiceCard
                                key={t}
                                icon={getTestTypeIcon(t)}
                                label={t}
                                onClick={() => setTipo(t)}
                                selected={tipo === t}
                            />
                        ))}
                    </Box>
                </Box>
            </Box>
        </M3Dialog>
    );
};

export default AddProvaModal;

