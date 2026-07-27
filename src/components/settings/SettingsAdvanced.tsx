import React, { useState } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import SettingsGroup from './SettingsGroupAccordion';
import { TextField } from '../ui';
import { TimetableSettings } from '../../types';
import { useAIBeta } from '../../hooks/useAIBeta';
import { purgeAIData } from '../../utils/dataRetention';
import TermsOfUseModal from '../TermsOfUseModal';

interface SettingsAdvancedSectionProps {
    expanded: boolean;
    onToggle: () => void;
    localSettings: TimetableSettings;
    handleChange: (field: keyof TimetableSettings, value: unknown) => void;
    setIsResetModalOpen: (open: boolean) => void;
}

export const SettingsAdvancedSection: React.FC<SettingsAdvancedSectionProps> = ({
    expanded, onToggle, localSettings, handleChange, setIsResetModalOpen
}) => {
    const { isBeta, setBeta } = useAIBeta();
    const [aiDataPurged, setAiDataPurged] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handlePurgeAIData = () => {
        purgeAIData();
        setAiDataPurged(true);
        setTimeout(() => setAiDataPurged(false), 4000);
    };

    return (
    <SettingsGroup
        id="advanced"
        title="Avanzate"
        subtitle="Configurazione tecnica"
        icon="build"
        variant="surface"
        expanded={expanded}
        onToggle={onToggle}
    >
        <Stack spacing={2}>
            {/* AI Experimental Mode */}
            <Box sx={{ p: 2, bgcolor: 'color-mix(in srgb, var(--md-sys-color-tertiary-container) 20%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid var(--md-sys-color-tertiary)' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-tertiary)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>science</Box>
                    <Typography variant="overline" sx={{ color: 'var(--md-sys-color-tertiary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>AI Experimental Mode</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 1.5 }}>
                    Abilita funzionalità AI in beta: Copilot Docente, predizione trend, azioni automatiche e dashboard aggregata.
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={isBeta}
                            onChange={(e) => setBeta(e.target.checked)}
                            aria-label="Abilita AI Experimental Mode"
                            color="secondary"
                        />
                    }
                    label={isBeta ? 'Attivo — funzionalità AI beta abilitate' : 'Disattivo — solo funzionalità stabili'}
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.85rem' } }}
                />
            </Box>

            <Divider />

            {/* Google Cloud API */}
            <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>key</Box>
                    <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Google Cloud API</Typography>
                </Stack>
                <Stack spacing={2}>
                    <TextField
                        label="Client ID (OAuth)"
                        value={localSettings.googleClientId || ''}
                        onChange={e => handleChange('googleClientId', e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Box component="span" className="material-symbols-outlined" aria-hidden="true">badge</Box></InputAdornment> } }}
                    />
                    <TextField
                        label="API Key (Picker)"
                        type="password"
                        value={localSettings.googleApiKey || ''}
                        onChange={e => handleChange('googleApiKey', e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Box component="span" className="material-symbols-outlined" aria-hidden="true">lock</Box></InputAdornment> } }}
                    />
                </Stack>
            </Box>

            {/* Privacy — GDPR B5: cancellazione dati AI */}
            <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-secondary)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>shield</Box>
                    <Typography variant="overline" sx={{ color: 'var(--md-sys-color-secondary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Privacy</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 2 }}>
                    Rimuove i dati AI elaborati localmente (telemetria, audit trail AI) dal dispositivo.
                    I dati del docente (UDA, alunni, valutazioni) non vengono cancellati.
                </Typography>
                {aiDataPurged ? (
                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-secondary)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
                        ✓ Dati AI eliminati correttamente.
                    </Typography>
                ) : (
                    <Button
                        onClick={handlePurgeAIData}
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">delete_sweep</Box>}
                        aria-label="Cancella i dati AI elaborati localmente"
                    >
                        Cancella dati AI
                    </Button>
                )}
                <Button
                    onClick={() => setShowTerms(true)}
                    variant="text"
                    color="secondary"
                    fullWidth
                    startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">gavel</Box>}
                    aria-label="Leggi i termini di utilizzo"
                >
                    Termini di utilizzo
                </Button>
            </Box>
            <TermsOfUseModal open={showTerms} onClose={() => setShowTerms(false)} />

            <Divider />

            {/* Danger zone */}
            <Box sx={{ p: 2, bgcolor: 'color-mix(in srgb, var(--md-sys-color-error-container) 10%, transparent)', borderRadius: 'var(--md-sys-shape-corner-extra-large)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-error)' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-error)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>warning</Box>
                    <Typography variant="overline" sx={{ color: 'var(--md-sys-color-error)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Zona Pericolo</Typography>
                </Stack>
                <Button
                    onClick={() => setIsResetModalOpen(true)}
                    variant="contained"
                    color="error"
                    fullWidth
                    startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">delete_forever</Box>}
                >
                    Reset Totale Dati
                </Button>
            </Box>
        </Stack>
    </SettingsGroup>
    );
};

export default SettingsAdvancedSection;
