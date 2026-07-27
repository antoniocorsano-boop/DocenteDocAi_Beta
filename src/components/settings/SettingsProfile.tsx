import React from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import SettingsGroup from './SettingsGroupAccordion';
import { TextField } from '../ui';
import { TimetableSettings } from '../../types';

interface SettingsProfileSectionProps {
    expanded: boolean;
    onToggle: () => void;
    localSettings: TimetableSettings;
    handleChange: (field: keyof TimetableSettings, value: unknown) => void;
}

export const SettingsProfileSection: React.FC<SettingsProfileSectionProps> = ({
    expanded, onToggle, localSettings, handleChange
}) => (
    <SettingsGroup
        id="profile"
        title="Profilo & Identità"
        subtitle="Dati docente e istituto"
        icon="badge"
        variant="surface"
        expanded={expanded}
        onToggle={onToggle}
    >
        <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 2 }}>
                <TextField label="Nome" value={localSettings.nomeInsegnante} onChange={e => handleChange('nomeInsegnante', e.target.value)} />
                <TextField label="Cognome" value={localSettings.cognomeInsegnante || ''} onChange={e => handleChange('cognomeInsegnante', e.target.value)} />
            </Box>
            <TextField label="Email Istituzionale" type="email" value={localSettings.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="nome.cognome@scuola.edu.it" />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 2 }}>
                <TextField label="Nome Istituto" value={localSettings.nomeIstituto} onChange={e => handleChange('nomeIstituto', e.target.value)} />
                <TextField label="Città" value={localSettings.cittaIstituto} onChange={e => handleChange('cittaIstituto', e.target.value)} />
            </Box>
        </Stack>
    </SettingsGroup>
);

export default SettingsProfileSection;
