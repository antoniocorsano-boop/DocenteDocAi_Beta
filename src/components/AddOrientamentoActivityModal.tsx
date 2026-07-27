// MD3 Compliant - Block G Migration (13 violations eliminated)

import React, { useState } from 'react';
import { OrientamentoActivity } from '../types';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { M3Dialog, TextField } from './ui';
import { UI_TEXT } from '../constants/ui-text';
interface AddOrientamentoActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (activity: OrientamentoActivity) => void;
    userClasses: string[];
}

const AddOrientamentoActivityModal: React.FC<AddOrientamentoActivityModalProps> = ({
    isOpen,
    onClose,
    onSave,
    userClasses
}) => {
  const [activity, setActivity] = useState<Partial<OrientamentoActivity>>({
        title: '',
        type: 'didattica',
        durationHours: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        classes: [],
        studentIds: [],
        competenciesAddressed: []
    });

    const handleSave = () => {
        if (!activity.title || !activity.date || activity.durationHours === undefined) return;
        
        onSave({
            ...activity,
            id: `orient-act-${Date.now()}` } as OrientamentoActivity);
        onClose();
    };

    return (
        <M3Dialog isOpen={isOpen} onClose={onClose} title="Nuova Attività di Orientamento"
            buttons={<>
                <Button onClick={onClose} variant="text">{UI_TEXT.CANCEL}</Button>
                <Button onClick={handleSave} variant="contained" disabled={!activity.title}>Salva Attività</Button>
            </>}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
                <TextField
                    label="Titolo Attività"
                    value={activity.title}
                    onChange={(e) => setActivity({ ...activity, title: e.target.value })}
                />
                
                <Stack direction="row" spacing="var(--md-sys-spacing-4)">
                  <FormControl fullWidth>
                    <InputLabel id="orient-type-label" shrink>Tipo</InputLabel>
                    <Select
                      labelId="orient-type-label"
                      value={activity.type}
                      label="Tipo"
                      displayEmpty
                      notched
                      onChange={(e: SelectChangeEvent) => setActivity({ ...activity, type: e.target.value as OrientamentoActivity['type'] })}
                    >
                      <MenuItem value="didattica">Didattica</MenuItem>
                      <MenuItem value="extra-curriculare">Extra-curriculare</MenuItem>
                      <MenuItem value="PCTO">PCTO</MenuItem>
                      <MenuItem value="esperienziale">Esperienziale</MenuItem>
                    </Select>
                  </FormControl>
                    <TextField
                        label="Ore"
                        type="number"
                        value={activity.durationHours?.toString()}
                        onChange={(e) => setActivity({ ...activity, durationHours: parseInt(e.target.value) || 0 })}
                    />
                </Stack>

                <TextField
                    label="Data"
                    type="date"
                    value={activity.date}
                    onChange={(e) => setActivity({ ...activity, date: e.target.value })}
                />

                <TextField multiline
                    label="Descrizione"
                    value={activity.description}
                    onChange={(e) => setActivity({ ...activity, description: e.target.value })}
                    rows={3}
                />

                <Stack spacing="var(--md-sys-spacing-2)">
                    <Typography variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Classi Coinvolte</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-3)' }}>
                        {userClasses.map(cls => (
                            <ButtonBase
                                key={cls}
                                aria-pressed={!!activity.classes?.includes(cls)}
                                aria-label={cls}
                                onClick={() => {
                                    const classes = activity.classes || [];
                                    if (classes.includes(cls)) {
                                        setActivity({ ...activity, classes: classes.filter(c => c !== cls) });
                                    } else {
                                        setActivity({ ...activity, classes: [...classes, cls] });
                                    }
                                }}
                                sx={{
                                  px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-2)',
                                  borderRadius: 'var(--md-sys-shape-corner-full)',
                                  fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                  fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                  transition: `all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`,
                                  bgcolor: activity.classes?.includes(cls)
                                    ? 'var(--md-sys-color-primary)'
                                    : 'var(--md-sys-color-surface-container-high)',
                                  color: activity.classes?.includes(cls)
                                    ? 'var(--md-sys-color-on-primary)'
                                    : 'var(--md-sys-color-on-surface-variant)',
                                }}
                            >
                                {cls}
                            </ButtonBase>
                        ))}
                    </Box>
                </Stack>
            </Box>
        </M3Dialog>
    );
};

export default AddOrientamentoActivityModal;

