/**
 * SettingsIntegrations — Section panel for multi-surface integrations
 *
 * Shows all available integrations (Classroom, Drive, WhatsApp, Telegram)
 * via the universal ConnectButton with context-aware actions.
 */

import React, { useCallback } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import SettingsGroup from './SettingsGroupAccordion';
import ConnectButton from '../ConnectButton';
import Typography from '@mui/material/Typography';
import { useIntegrationStore } from '../../stores/useIntegrationStore';
import { classroomConnector } from '../../integrations/connectors/classroom';
import { logger } from '../../utils/logger';

interface SettingsIntegrationsSectionProps {
    expanded: boolean;
    onToggle: () => void;
    onConnectDrive: () => void;
    onSyncToDrive: () => void;
    isDriveConnected: boolean;
    driveConnectedAt?: string;
}

const SettingsIntegrationsSection: React.FC<SettingsIntegrationsSectionProps> = ({
    expanded,
    onToggle,
    onConnectDrive,
    onSyncToDrive,
    isDriveConnected,
    driveConnectedAt,
}) => {
    const { integrations, actions } = useIntegrationStore();

    const classroom = integrations.find((i) => i.id === 'google_classroom')!;
    const driveIntegration = integrations.find((i) => i.id === 'google_drive')!;
    const whatsapp = integrations.find((i) => i.id === 'whatsapp')!;
    const telegram = integrations.find((i) => i.id === 'telegram')!;

    // ── Drive: sync state from real driveSyncEngine ───────────────────────────
    const driveStatus = isDriveConnected ? 'connected' : driveIntegration.status;
    const driveConnectedAtResolved = driveConnectedAt ?? driveIntegration.connectedAt;

    // ── Classroom: OAuth connect flow ─────────────────────────────────────────
    const handleConnectClassroom = useCallback(async () => {
        actions.setIntegrationStatus('google_classroom', 'connecting');
        try {
            await classroomConnector.connect();
            actions.setIntegrationStatus('google_classroom', 'connected');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Errore di connessione';
            logger.error('[SettingsIntegrations] Classroom connect failed:', err);
            actions.setIntegrationError('google_classroom', msg);
        }
    }, [actions]);

    const handleDisconnectClassroom = useCallback(() => {
        actions.disconnectIntegration('google_classroom');
    }, [actions]);

    // ── Drive: delegate to existing engine ────────────────────────────────────
    const handleConnectDrive = useCallback(() => {
        actions.setIntegrationStatus('google_drive', 'connecting');
        onConnectDrive();
        // Status will be updated by the parent once connected (via isDriveConnected prop)
    }, [actions, onConnectDrive]);

    return (
        <SettingsGroup
            id="integrations"
            title="Collega le tue app"
            subtitle="Classroom · Drive · WhatsApp · Telegram"
            icon="hub"
            variant="secondary"
            expanded={expanded}
            onToggle={onToggle}
        >
            <Stack spacing={2} divider={<Divider flexItem />}>

                {/* ── Section: Dati scolastici ─────────────────────────────── */}
                <Box>
                    <Typography
                        variant="overline"
                        sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 1.5, display: 'block', letterSpacing: 1 }}
                    >
                        Dati scolastici
                    </Typography>
                    <Stack spacing={1.5}>
                        <ConnectButton
                            integrationId="google_classroom"
                            icon="school"
                            status={classroom.status}
                            onConnect={handleConnectClassroom}
                            onDisconnect={handleDisconnectClassroom}
                            connectedAt={classroom.connectedAt}
                            errorMessage={classroom.errorMessage}
                            connectedActions={[
                                {
                                    label: 'Importa classi',
                                    icon: 'download',
                                    onClick: () => {
                                        /* TODO: open ClassroomImportDialog */
                                        logger.info('[SettingsIntegrations] Import classes triggered');
                                    },
                                },
                                {
                                    label: 'Sincronizza studenti',
                                    icon: 'sync',
                                    onClick: () => logger.info('[SettingsIntegrations] Sync students triggered'),
                                },
                            ]}
                        />

                        <ConnectButton
                            integrationId="google_drive"
                            icon="add_to_drive"
                            status={driveStatus}
                            onConnect={handleConnectDrive}
                            connectedAt={driveConnectedAtResolved}
                            connectedActions={[
                                {
                                    label: 'Salva ora',
                                    icon: 'cloud_upload',
                                    onClick: onSyncToDrive,
                                },
                            ]}
                        />
                    </Stack>
                </Box>

                {/* ── Section: Copilot via Chat ────────────────────────────── */}
                <Box>
                    <Typography
                        variant="overline"
                        sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 0.5, display: 'block', letterSpacing: 1 }}
                    >
                        Copilot via Chat
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 1.5, display: 'block' }}
                    >
                        Stesso cervello del Copilot, da WhatsApp o Telegram.
                        Crea classi, importa studenti, registra presenze — tutto via messaggio.
                    </Typography>

                    <Stack spacing={1.5}>
                        <ConnectButton
                            integrationId="whatsapp"
                            icon="chat"
                            status={whatsapp.status}
                            label="Attiva su WhatsApp"
                            onConnect={() => {
                                // Chat integrations require a backend webhook.
                                // Show the setup instructions dialog.
                                actions.setIntegrationError(
                                    'whatsapp',
                                    'Richiede configurazione backend. Segui la guida in docs/INTEGRATIONS.md.'
                                );
                            }}
                            errorMessage={whatsapp.errorMessage}
                        />

                        <ConnectButton
                            integrationId="telegram"
                            icon="send"
                            status={telegram.status}
                            label="Attiva su Telegram"
                            onConnect={() => {
                                actions.setIntegrationError(
                                    'telegram',
                                    'Richiede configurazione backend. Segui la guida in docs/INTEGRATIONS.md.'
                                );
                            }}
                            errorMessage={telegram.errorMessage}
                        />
                    </Stack>

                    <Typography
                        variant="caption"
                        sx={{
                            mt: 1.5,
                            px: 2,
                            py: 1,
                            bgcolor: 'var(--md-sys-color-surface-container)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            color: 'var(--md-sys-color-on-surface-variant)',
                            display: 'block',
                        }}
                    >
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', verticalAlign: 'middle', mr: 0.5 }}>
                            info
                        </Box>
                        Le integrazioni chat richiedono un webhook server (Vercel Edge Function).
                        Il command interpreter è già pronto: interpreta italiano naturale → azione.
                    </Typography>
                </Box>
            </Stack>
        </SettingsGroup>
    );
};

export default SettingsIntegrationsSection;
