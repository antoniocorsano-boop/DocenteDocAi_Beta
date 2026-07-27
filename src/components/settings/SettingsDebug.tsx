import React, { useState } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SettingsGroup from './SettingsGroupAccordion';
import { InfoCard, M3ConfirmDialog } from '../ui';
import { errorLogger } from '../../services/errorLogger';

interface SettingsDebugSectionProps {
    expanded: boolean;
    onToggle: () => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsDebugSection: React.FC<SettingsDebugSectionProps> = ({
    expanded, onToggle, showToast
}) => {
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
    return (
    <SettingsGroup
        id="debug_logging"
        title="Debug & Logging"
        subtitle="Visualizza e gestisci i log degli errori"
        icon="bug_report"
        variant="surface"
        expanded={expanded}
        onToggle={onToggle}
    >
        <Stack spacing={2}>
            <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Stack spacing={0.5}>
                        <Typography variant="overline" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>
                            Log degli Errori
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Visualizza tutti gli errori registrati durante l'utilizzo dell'app
                        </Typography>
                    </Stack>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: errorLogger.getErrorStats().total > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)' }}>
                        {errorLogger.getErrorStats().total > 0 ? 'error' : 'check_circle'}
                    </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-medium)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)', mb: 2 }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>info</Box>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{errorLogger.getErrorStats().total} log registrati</Typography>
                </Stack>
                <Stack spacing={1}>
                    <Button
                        onClick={() => showToast('Apri la console del browser (F12) e digita: window.__errorLogger.getRecentErrors()', 'info')}
                        variant="outlined"
                        fullWidth
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">terminal</Box>}
                    >
                        Console Browser (F12)
                    </Button>
                    <Button
                        onClick={() => {
                            const json = errorLogger.exportLogsAsJson();
                            const blob = new Blob([json], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `error-logs-${new Date().toISOString().slice(0, 10)}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            showToast('Log esportati in JSON', 'success');
                        }}
                        variant="outlined"
                        fullWidth
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">download</Box>}
                    >
                        Esporta JSON
                    </Button>
                    <Button
                        onClick={() => setConfirmDialog({
                            message: 'Sei sicuro di voler eliminare tutti i log?',
                            onConfirm: () => {
                                errorLogger.clearAllLogs();
                                showToast('Tutti i log sono stati eliminati', 'success');
                            }
                        })}
                        variant="text"
                        fullWidth
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">delete</Box>}
                    >
                        Elimina Log
                    </Button>
                </Stack>
            </Box>
            <InfoCard
                title="Come usare"
                description="Premi F12 per aprire la console, digita window.__errorLogger.getRecentErrors(10) per visualizzare gli ultimi 10 errori."
                icon="info"
                variant="outlined" />
        </Stack>
        {confirmDialog && (
            <M3ConfirmDialog
                title="Conferma eliminazione"
                message={confirmDialog.message}
                onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                onCancel={() => setConfirmDialog(null)}
                danger={true}
            />
        )}
    </SettingsGroup>
    );
};

export default SettingsDebugSection;
