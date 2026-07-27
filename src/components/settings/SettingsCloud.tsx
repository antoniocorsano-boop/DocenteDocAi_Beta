import React, { useRef, useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import SettingsGroup from './SettingsGroupAccordion';
import { InfoCard } from '../ui';
import { FeatureHintChip } from '../journey';
import { DriveSyncState, TimetableSettings } from '../../types';
import { logger } from '../../utils/logger';
import RegisterImportWizard from './RegisterImportWizard';

interface SettingsCloudSectionProps {
    expanded: boolean;
    onToggle: () => void;
    driveState: DriveSyncState;
    settings: TimetableSettings;
    onConnectDrive: () => void;
    onSyncToDrive: () => void;
    onExportData: () => void;
    onImportData: (file: File) => void;
}

export const SettingsCloudSection: React.FC<SettingsCloudSectionProps> = ({
    expanded, onToggle, driveState, settings, onConnectDrive, onSyncToDrive, onExportData, onImportData
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [storageInfo, setStorageInfo] = useState<{ used: string; total: string; percent: number } | null>(null);
    const [wizardOpen, setWizardOpen] = useState(false);

    useEffect(() => {
        if (!navigator?.storage?.estimate) return;
        navigator.storage.estimate().then((estimate) => {
            const used = ((estimate.usage || 0) / 1024 / 1024).toFixed(1);
            const total = ((estimate.quota || 0) / 1024 / 1024).toFixed(1);
            const percent = Math.round(((estimate.usage || 0) / (estimate.quota || 1)) * 100);
            setStorageInfo({ used, total, percent });
        }).catch((error) => logger.error('Storage estimation failed:', error));
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onImportData(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <SettingsGroup
            id="cloud"
            title="Dati & Cloud"
            subtitle="Backup e Storage"
            icon="cloud_sync"
            variant="primary"
            expanded={expanded}
            onToggle={onToggle}
        >
            <Stack spacing={2}>
                <FeatureHintChip hintId="drive-sync" requiredLevel="maestro" message="Attiva il backup Google Drive per sincronizzare tutti i tuoi dati in cloud." />
                {storageInfo && (
                    <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Storage Dispositivo</Typography>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>{storageInfo.used}MB / {storageInfo.total}MB</Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={storageInfo.percent}
                            color={storageInfo.percent > 80 ? 'error' : 'primary'}
                            sx={{ borderRadius: 1, height: 6, bgcolor: 'var(--md-sys-color-surface-container-high)' }}
                        />
                        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Dati salvati in IndexedDB (senza limiti LocalStorage).
                        </Typography>
                    </Box>
                )}

                {(() => {
                    const DAYS_LIMIT = 30;
                    let showReminder = false;
                    if (driveState.lastSyncTime) {
                        const lastSyncDate = new Date(driveState.lastSyncTime as string);
                        const diffDays = Math.floor((Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60 * 24));
                        showReminder = diffDays >= DAYS_LIMIT;
                    } else {
                        showReminder = true;
                    }
                    return showReminder ? (
                        <InfoCard
                            title="Backup cloud non aggiornato!"
                            description="Esegui un backup cloud e verifica il ripristino periodicamente per la sicurezza dei tuoi dati."
                            icon="warning"
                            variant="outlined" />
                    ) : null;
                })()}

                <Box sx={{ p: 2, bgcolor: driveState.isAuthenticated ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: driveState.isAuthenticated ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 36, height: 36, borderRadius: 'var(--md-sys-shape-corner-large)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: driveState.isAuthenticated ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)', color: driveState.isAuthenticated ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>{driveState.isAuthenticated ? 'cloud_done' : 'cloud_off'}</Box>
                        </Box>
                        <Stack spacing={0.25}>
                            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                                {driveState.isAuthenticated ? 'Google Drive Connesso' : 'Backup Cloud Disattivo'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {driveState.lastSyncTime ? `Ultimo: ${new Date(driveState.lastSyncTime as string).toLocaleString()}` : 'Nessun backup cloud'}
                            </Typography>
                        </Stack>
                    </Stack>
                    {driveState.isAuthenticated ? (
                        <Button onClick={() => onSyncToDrive()} disabled={driveState.isSyncing} variant="contained" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">{driveState.isSyncing ? 'sync' : 'cloud_upload'}</Box>}>
                            {driveState.isSyncing ? '...' : 'Salva'}
                        </Button>
                    ) : (
                        settings.googleClientId && (
                            <Button onClick={onConnectDrive} variant="contained">Connetti</Button>
                        )
                    )}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, var(--md-sys-grid-fr-1)))', gap: 2 }}>
                    <Button onClick={onExportData} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">download</Box>}>
                        Backup Locale
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">upload</Box>}>
                        Ripristina File
                    </Button>
                    <Button
                        onClick={() => setWizardOpen(true)}
                        variant="outlined"
                        aria-label="Importa studenti e valutazioni da registro elettronico"
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">school</Box>}
                    >
                        Importa da Registro
                    </Button>
                    <input type="file" id="settings-restore-file" name="restoreFile" aria-label="Ripristina file di backup" ref={fileInputRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} accept=".json,.csv,.xlsx,.xls" onChange={handleFileChange} />
                </Box>
                <RegisterImportWizard
                    open={wizardOpen}
                    onClose={() => setWizardOpen(false)}
                    onImportFile={(file) => { onImportData(file); setWizardOpen(false); }}
                />
            </Stack>
        </SettingsGroup>
    );
};

export default SettingsCloudSection;
