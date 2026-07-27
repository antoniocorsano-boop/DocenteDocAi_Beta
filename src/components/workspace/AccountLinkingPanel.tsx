/**
 * AccountLinkingPanel.tsx — Pannello collegamento account esterni.
 *
 * Drawer laterale (destra, 360px) che permette di collegare / scollegare
 * account esterni: Google Drive, Gmail, Google Classroom, WhatsApp, Telegram.
 *
 * Flussi di connessione:
 *   Google Drive / Gmail / Classroom → OAuth 2.0 via google.accounts.oauth2
 *     (initTokenClient + requestAccessToken da googleDriveService)
 *   WhatsApp / Telegram → dialog con istruzioni + link al bot
 *
 * Integrazione:
 *   - Legge / aggiorna useIntegrationStore (status, connectedAt, metadata)
 *   - Usa le stesse credenziali di useDriveSyncEngine (VITE_GOOGLE_CLIENT_ID)
 *   - Toast via useUIStore.actions.showToast
 *
 * MD3 Gold Compliant:
 *   - Nessun <div> per layout/shell, solo M3Surface + MUI v7
 *   - Token var(--md-sys-color-*) per tutti i colori
 *   - aria-label espliciti su ogni elemento interattivo
 */

import React, { useCallback, useState } from 'react';
import Box          from '@mui/material/Box';
import Button       from '@mui/material/Button';
import Chip         from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog       from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle  from '@mui/material/DialogTitle';
import Divider      from '@mui/material/Divider';
import Drawer       from '@mui/material/Drawer';
import IconButton   from '@mui/material/IconButton';
import Stack        from '@mui/material/Stack';
import Tooltip      from '@mui/material/Tooltip';
import Typography   from '@mui/material/Typography';
import CloseIcon         from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon  from '@mui/icons-material/ErrorOutline';
import LinkOffIcon       from '@mui/icons-material/LinkOff';
import OpenInNewIcon     from '@mui/icons-material/OpenInNew';

import M3Surface from '../ui/M3Surface';

import {
  initTokenClient,
  requestAccessToken,
  revokeAccessToken,
} from '../../services/googleDriveService';
import { useIntegrationStore } from '../../stores/useIntegrationStore';
import { useSettingsStore }    from '../../stores/useSettingsStore';
import { useUIStore }          from '../../stores/useUIStore';
import type { IntegrationId, ConnectionStatus } from '../../types/integration.types';

// ─── Scopes per service ───────────────────────────────────────────────────────

const GOOGLE_SCOPES: Partial<Record<IntegrationId, string>> = {
  google_drive:     'https://www.googleapis.com/auth/drive.file',
  gmail:            'https://mail.google.com/ https://www.googleapis.com/auth/gmail.modify',
  google_classroom: 'https://www.googleapis.com/auth/classroom.courses.readonly',
};

// ─── Visual helpers ───────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  disconnected: 'var(--md-sys-color-outline)',
  connecting:   'var(--md-sys-color-secondary)',
  connected:    'var(--md-sys-color-primary)',
  error:        'var(--md-sys-color-error)',
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  disconnected: 'Non collegato',
  connecting:   'Connessione…',
  connected:    'Collegato',
  error:        'Errore',
};

// Bot / webhook instructions for chat integrations
const CHAT_INSTRUCTIONS: Partial<Record<IntegrationId, { title: string; steps: string[]; link: string; linkLabel: string }>> = {
  whatsapp: {
    title:     'Collega WhatsApp',
    steps: [
      '1. Scansiona il QR code con WhatsApp.',
      '2. Invia il messaggio di attivazione al numero mostrato.',
      '3. Il bot risponderà confermando la connessione.',
    ],
    link:      'https://wa.me/',
    linkLabel: 'Apri WhatsApp Web',
  },
  telegram: {
    title:     'Collega Telegram',
    steps: [
      '1. Cerca @DocenteDocBot su Telegram.',
      '2. Avvia la chat con /start.',
      '3. Invia il codice di verifica mostrato qui sotto.',
    ],
    link:      'https://t.me/DocenteDocBot',
    linkLabel: 'Apri Bot Telegram',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AccountLinkingPanelProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AccountLinkingPanel({ open, onClose }: AccountLinkingPanelProps): React.JSX.Element {
  const integrations = useIntegrationStore(s => s.integrations);
  const { setIntegrationStatus, setIntegrationError, disconnectIntegration } =
    useIntegrationStore(s => s.actions);
  const googleClientId = useSettingsStore(s => s.settings.googleClientId);
  const showToast = useUIStore(s => s.actions.showToast);

  // active integration being connected (Google flow)
  const [connecting, setConnecting] = useState<IntegrationId | null>(null);
  // chat dialog state
  const [chatDialog, setChatDialog] = useState<IntegrationId | null>(null);

  // ── Google OAuth connect ───────────────────────────────────────────────────
  const handleGoogleConnect = useCallback((id: IntegrationId) => {
    const scope = GOOGLE_SCOPES[id];
    if (!scope) return;

    setIntegrationStatus(id, 'connecting');
    setConnecting(id);

    const ok = initTokenClient(
      (tokenResponse: unknown) => {
        setConnecting(null);
        const resp = tokenResponse as { error?: string };
        if (resp.error) {
          setIntegrationError(id, resp.error);
          showToast(`Errore connessione: ${resp.error}`, 'error');
          return;
        }
        setIntegrationStatus(id, 'connected');
        showToast(`${id === 'gmail' ? 'Gmail' : id === 'google_classroom' ? 'Classroom' : 'Google Drive'} collegato.`, 'success');
      },
      googleClientId || undefined,
      scope.split(' '),
    );

    if (!ok) {
      setConnecting(null);
      setIntegrationError(id, 'Google Identity Services non disponibile.');
      showToast('Google non disponibile. Ricarica la pagina.', 'error');
      return;
    }

    requestAccessToken(scope);
  }, [googleClientId, setIntegrationStatus, setIntegrationError, showToast]);

  // ── Google disconnect ──────────────────────────────────────────────────────
  const handleGoogleDisconnect = useCallback((id: IntegrationId) => {
    try { revokeAccessToken(); } catch { /* best-effort */ }
    disconnectIntegration(id);
    showToast('Account scollegato.', 'info');
  }, [disconnectIntegration, showToast]);

  // ── Chat integration connect (simulated — sets connected after dialog) ─────
  const handleChatConnect = useCallback((id: IntegrationId) => {
    setChatDialog(id);
  }, []);

  const handleChatConfirm = useCallback(() => {
    if (!chatDialog) return;
    setIntegrationStatus(chatDialog, 'connected');
    showToast(`${chatDialog === 'telegram' ? 'Telegram' : 'WhatsApp'} collegato.`, 'success');
    setChatDialog(null);
  }, [chatDialog, setIntegrationStatus, showToast]);

  // ── Grouped integrations ───────────────────────────────────────────────────
  const googleGroup  = integrations.filter(i => i.id.startsWith('google') || i.id === 'gmail');
  const chatGroup    = integrations.filter(i => i.id === 'whatsapp' || i.id === 'telegram');

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width:           { xs: '100vw', sm: 360 },
            maxWidth:        '100vw',
            backgroundColor: 'var(--md-sys-color-surface)',
            backgroundImage: 'none',
          },
        }}
        aria-label="Pannello collegamento account"
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <Typography
            variant="titleMedium"
            sx={{ flexGrow: 1, color: 'var(--md-sys-color-on-surface)' }}
          >
            Account collegati
          </Typography>
          <IconButton onClick={onClose} aria-label="Chiudi pannello" size="small">
            <CloseIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }} />
          </IconButton>
        </Stack>

        {/* Body */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1, py: 1 }}>

          {/* Google services */}
          <Typography
            variant="labelSmall"
            sx={{
              px: 2.5,
              py: 1,
              display: 'block',
              color:         'var(--md-sys-color-on-surface-variant)',
              letterSpacing: '0.08em',
            }}
          >
            GOOGLE
          </Typography>

          {googleGroup.map(integration => (
            <IntegrationRow
              key={integration.id}
              id={integration.id}
              label={integration.label}
              description={integration.description}
              status={integration.status}
              connectedAt={integration.connectedAt}
              errorMessage={integration.errorMessage}
              isConnecting={connecting === integration.id}
              onConnect={() => handleGoogleConnect(integration.id)}
              onDisconnect={() => handleGoogleDisconnect(integration.id)}
            />
          ))}

          <Divider sx={{ my: 1, mx: 2.5 }} />

          {/* Chat services */}
          <Typography
            variant="labelSmall"
            sx={{
              px: 2.5,
              py: 1,
              display: 'block',
              color:         'var(--md-sys-color-on-surface-variant)',
              letterSpacing: '0.08em',
            }}
          >
            CHAT
          </Typography>

          {chatGroup.map(integration => (
            <IntegrationRow
              key={integration.id}
              id={integration.id}
              label={integration.label}
              description={integration.description}
              status={integration.status}
              connectedAt={integration.connectedAt}
              errorMessage={integration.errorMessage}
              isConnecting={false}
              onConnect={() => handleChatConnect(integration.id)}
              onDisconnect={() => {
                disconnectIntegration(integration.id);
                showToast('Account scollegato.', 'info');
              }}
            />
          ))}
        </Box>

        {/* Footer note */}
        <M3Surface
          elevation={0}
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <Typography
            variant="bodySmall"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            Tutte le connessioni sono tracciate in TrustChain.
            I dati non vengono mai condivisi con terze parti.
          </Typography>
        </M3Surface>
      </Drawer>

      {/* Chat integration instructions dialog */}
      {chatDialog && CHAT_INSTRUCTIONS[chatDialog] && (
        <Dialog
          open={!!chatDialog}
          onClose={() => setChatDialog(null)}
          aria-labelledby="chat-link-title"
          PaperProps={{ sx: { borderRadius: 3, minWidth: 300, maxWidth: 440 } }}
        >
          <DialogTitle id="chat-link-title" sx={{ pb: 1 }}>
            {CHAT_INSTRUCTIONS[chatDialog]!.title}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1}>
              {CHAT_INSTRUCTIONS[chatDialog]!.steps.map((step, i) => (
                <Typography key={i} variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {step}
                </Typography>
              ))}
              <Button
                component="a"
                href={CHAT_INSTRUCTIONS[chatDialog]!.link}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 18px)' }} />}
                aria-label={CHAT_INSTRUCTIONS[chatDialog]!.linkLabel}
                sx={{ mt: 1, alignSelf: 'flex-start', borderRadius: 8 }}
              >
                {CHAT_INSTRUCTIONS[chatDialog]!.linkLabel}
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2 }}>
            <Button onClick={() => setChatDialog(null)} aria-label="Annulla collegamento">
              Annulla
            </Button>
            <Button
              variant="contained"
              onClick={handleChatConfirm}
              aria-label="Confermo collegamento completato"
              sx={{ borderRadius: 8 }}
            >
              Ho completato
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

// ─── IntegrationRow sub-component ────────────────────────────────────────────

interface IntegrationRowProps {
  id: IntegrationId;
  label: string;
  description: string;
  status: ConnectionStatus;
  connectedAt?: string;
  errorMessage?: string;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function IntegrationRow({
  id, label, description, status, connectedAt, errorMessage,
  isConnecting, onConnect, onDisconnect,
}: IntegrationRowProps): React.JSX.Element {
  const connected = status === 'connected';

  const connectedDate = connectedAt
    ? new Date(connectedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
    : null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        px: 2.5,
        py: 1.5,
        '&:hover': { backgroundColor: 'var(--md-sys-color-surface-container-low)' },
      }}
    >
      {/* Status icon */}
      {connected ? (
        <CheckCircleOutlineIcon
          aria-hidden
          sx={{
            fontSize:    'var(--md-sys-icon-size-md, 20px)',
            color:       STATUS_COLOR.connected,
            flexShrink:  0,
          }}
        />
      ) : status === 'error' ? (
        <ErrorOutlineIcon
          aria-hidden
          sx={{
            fontSize:   'var(--md-sys-icon-size-md, 20px)',
            color:      STATUS_COLOR.error,
            flexShrink: 0,
          }}
        />
      ) : (
        <Box
          aria-hidden
          sx={{
            width:        20,
            height:       20,
            borderRadius: '50%',
            border:       `1.5px solid ${STATUS_COLOR[status]}`,
            flexShrink:   0,
          }}
        />
      )}

      {/* Text */}
      <Stack flexGrow={1} spacing={0.25} minWidth={0}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="body2"
            sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: connected ? 500 : 400 }}
            noWrap
          >
            {label}
          </Typography>
          {connected && connectedDate && (
            <Chip
              label={connectedDate}
              size="small"
              sx={{
                height:          18,
                fontSize:        11,
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color:           'var(--md-sys-color-on-primary-container)',
              }}
            />
          )}
        </Stack>
        <Typography
          variant="caption"
          sx={{ color: errorMessage ? STATUS_COLOR.error : 'var(--md-sys-color-on-surface-variant)' }}
          noWrap
        >
          {errorMessage ?? (connected ? STATUS_LABEL.connected : description)}
        </Typography>
      </Stack>

      {/* Action */}
      {isConnecting ? (
        <CircularProgress
          size={20}
          aria-label={`Connessione a ${label} in corso`}
          sx={{ color: 'var(--md-sys-color-primary)', flexShrink: 0 }}
        />
      ) : connected ? (
        <Tooltip title={`Scollega ${label}`}>
          <IconButton
            size="small"
            onClick={onDisconnect}
            aria-label={`Scollega ${label}`}
            sx={{ color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}
          >
            <LinkOffIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 18px)' }} />
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          size="small"
          variant="outlined"
          onClick={onConnect}
          aria-label={`Collega ${label}`}
          disabled={id === 'google_classroom'} /* coming soon */
          sx={{ flexShrink: 0, borderRadius: 8, minWidth: 72 }}
        >
          {id === 'google_classroom' ? 'Presto' : 'Collega'}
        </Button>
      )}
    </Stack>
  );
}
