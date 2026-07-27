/**
 * settings/PrivacyPolicyPanel.tsx — Privacy & Sicurezza panel per le Impostazioni Orbit.
 *
 * Visualizza e gestisce:
 *  - Modalità privacy (strict / relaxed / disabled) via PrivacyGuard
 *  - Stato KeyVault (chiave PBKDF2 derivata o effimera)
 *  - Profondità coda offline (IndexedDB)
 *  - Stato consenso GDPR + pulsante revoca
 *
 * MD3 compliant: M3Surface, token MD3 per spacing, nessun div visivo,
 * nessun inline fontSize/fontWeight, aria-label su ogni interattivo.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from '@mui/material';
import LockIcon          from '@mui/icons-material/Lock';
import LockOpenIcon      from '@mui/icons-material/LockOpen';
import SecurityIcon      from '@mui/icons-material/Security';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import WarningAmberIcon  from '@mui/icons-material/WarningAmber';
import KeyIcon           from '@mui/icons-material/Key';
import QueueIcon         from '@mui/icons-material/Queue';
import VerifiedUserIcon  from '@mui/icons-material/VerifiedUser';

import M3Surface from '../ui/M3Surface';

import {
  getPrivacyMode,
  setPrivacyMode,
  type PrivacyMode,
} from '../../modules/system/PrivacyGuard';
import { hasPersistentKey }  from '../../modules/system/KeyVault';
import { getQueueDepth }     from '../../modules/system/OfflineQueue';
import {
  hasPrivacyConsent,
} from '../PrivacyConsentModal';

// ─── Costante chiave consenso ────────────────────────────────────────────────

const CONSENT_KEY = 'privacy_consent_v1';

// ─── Tipi ────────────────────────────────────────────────────────────────────

interface PrivacyPolicyPanelProps {
  expanded?: boolean;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function revokeConsent(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // non-fatal
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PrivacyPolicyPanel({ expanded = false }: PrivacyPolicyPanelProps): React.JSX.Element {
  const [privacyMode, setLocalMode]  = useState<PrivacyMode>(getPrivacyMode());
  const [persistentKey, setPersistentKey] = useState<boolean>(hasPersistentKey());
  const [queueDepth, setQueueDepth]  = useState<number>(0);
  const [consentActive, setConsentActive] = useState<boolean>(hasPrivacyConsent());
  const [consentRevoked, setConsentRevoked] = useState<boolean>(false);

  // Aggiorna queueDepth asincrono al mount e ogni 10 secondi
  useEffect(() => {
    let cancelled = false;

    const refresh = (): void => {
      void getQueueDepth().then(depth => {
        if (!cancelled) setQueueDepth(depth);
      });
      setPersistentKey(hasPersistentKey());
      setConsentActive(hasPrivacyConsent());
    };

    refresh();
    const id = window.setInterval(refresh, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const handleModeChange = useCallback((e: SelectChangeEvent<string>) => {
    const mode = e.target.value as PrivacyMode;
    setPrivacyMode(mode);
    setLocalMode(mode);
  }, []);

  const handleRevoke = useCallback(() => {
    revokeConsent();
    setConsentActive(false);
    setConsentRevoked(true);
  }, []);

  // Aspetto del chip modalità privacy
  const modeColor: 'success' | 'warning' | 'error' =
    privacyMode === 'strict'    ? 'success' :
    privacyMode === 'balanced'  ? 'warning' : 'error';

  const modeLabel =
    privacyMode === 'strict'    ? 'Strict — massima protezione' :
    privacyMode === 'balanced'  ? 'Balanced — bilanciato'     : 'Enhanced — ottimizzato';

  if (!expanded) {
    return (
      <M3Surface elevation={1} sx={{ p: 'var(--md-sys-spacing-4, 16px)', borderRadius: 'var(--md-sys-shape-corner-medium, 12px)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2, 8px)' }}>
          <SecurityIcon fontSize="small" aria-hidden />
          <Typography variant="titleMedium">Privacy & Sicurezza</Typography>
          <Chip label={modeLabel} color={modeColor} size="small" sx={{ ml: 'auto' }} />
        </Box>
      </M3Surface>
    );
  }

  return (
    <M3Surface
      elevation={1}
      sx={{
        p:            'var(--md-sys-spacing-6, 24px)',
        borderRadius: 'var(--md-sys-shape-corner-medium, 12px)',
        display:      'flex',
        flexDirection: 'column',
        gap:          'var(--md-sys-spacing-4, 16px)',
      }}
    >
      {/* Intestazione */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2, 8px)' }}>
        <SecurityIcon color="primary" aria-hidden />
        <Typography variant="titleLarge">Privacy & Sicurezza</Typography>
      </Box>

      <Divider />

      {/* ── Modalità privacy ──────────────────────────────────────────────── */}
      <M3Surface elevation={0} sx={{ p: 'var(--md-sys-spacing-4, 16px)', borderRadius: 'var(--md-sys-shape-corner-small, 8px)' }}>
        <Typography variant="titleMedium" gutterBottom>
          Modalità Privacy
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" sx={{ mb: 'var(--md-sys-spacing-3, 12px)' }}>
          Controlla il livello di protezione applicato alla raccolta e all&apos;elaborazione dei dati.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3, 12px)', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="privacy-mode-label">Modalità</InputLabel>
            <Select
              labelId="privacy-mode-label"
              label="Modalità"
              value={privacyMode}
              onChange={handleModeChange}
              inputProps={{ 'aria-label': 'Seleziona modalità privacy' }}
            >
              <MenuItem value="strict">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2, 8px)' }}>
                  <LockIcon fontSize="small" aria-hidden />
                  Strict — massima protezione
                </Box>
              </MenuItem>
              <MenuItem value="balanced">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2, 8px)' }}>
                  <LockOpenIcon fontSize="small" aria-hidden />
                  Balanced — bilanciato
                </Box>
              </MenuItem>
              <MenuItem value="enhanced">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2, 8px)' }}>
                  <WarningAmberIcon fontSize="small" color="warning" aria-hidden />
                  Enhanced — ottimizzato
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Chip
            label={modeLabel}
            color={modeColor}
            size="small"
            icon={<SecurityIcon fontSize="small" />}
            aria-label={`Modalità attiva: ${modeLabel}`}
          />
        </Box>
      </M3Surface>

      {/* ── KeyVault ──────────────────────────────────────────────────────── */}
      <M3Surface elevation={0} sx={{ p: 'var(--md-sys-spacing-4, 16px)', borderRadius: 'var(--md-sys-shape-corner-small, 8px)' }}>
        <List dense disablePadding>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <KeyIcon
                fontSize="small"
                color={persistentKey ? 'success' : 'warning'}
                aria-hidden
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="labelLarge">
                  Chiave di cifratura
                </Typography>
              }
              secondary={
                <Typography variant="bodySmall" color="text.secondary">
                  {persistentKey
                    ? 'Chiave PBKDF2 derivata dall\'identità utente (sessione persistente)'
                    : 'Chiave effimera — valida solo per questa sessione (nessun login rilevato)'}
                </Typography>
              }
            />
            <Chip
              label={persistentKey ? 'Persistente' : 'Effimera'}
              color={persistentKey ? 'success' : 'warning'}
              size="small"
              aria-label={persistentKey ? 'Chiave persistente PBKDF2' : 'Chiave effimera di sessione'}
            />
          </ListItem>

          <Divider component="li" sx={{ my: 'var(--md-sys-spacing-2, 8px)' }} />

          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <QueueIcon
                fontSize="small"
                color={queueDepth > 0 ? 'warning' : 'success'}
                aria-hidden
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="labelLarge">
                  Coda offline
                </Typography>
              }
              secondary={
                <Typography variant="bodySmall" color="text.secondary">
                  Richieste AI in attesa di sincronizzazione (max 50)
                </Typography>
              }
            />
            <Chip
              label={queueDepth === 0 ? 'Vuota' : `${queueDepth} in coda`}
              color={queueDepth > 0 ? 'warning' : 'success'}
              size="small"
              aria-label={`Coda offline: ${queueDepth} elementi`}
            />
          </ListItem>

          <Divider component="li" sx={{ my: 'var(--md-sys-spacing-2, 8px)' }} />

          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {consentActive
                ? <CheckCircleIcon fontSize="small" color="success" aria-hidden />
                : <WarningAmberIcon fontSize="small" color="warning" aria-hidden />
              }
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="labelLarge">
                  Consenso GDPR
                </Typography>
              }
              secondary={
                <Typography variant="bodySmall" color="text.secondary">
                  {consentActive
                    ? 'Consenso al trattamento dei dati registrato (art. 13 GDPR)'
                    : 'Nessun consenso attivo — alcune funzionalità potrebbero essere limitate'}
                </Typography>
              }
            />
            <Chip
              label={consentActive ? 'Attivo' : 'Non attivo'}
              color={consentActive ? 'success' : 'default'}
              size="small"
              aria-label={consentActive ? 'Consenso GDPR attivo' : 'Consenso GDPR non attivo'}
            />
          </ListItem>
        </List>
      </M3Surface>

      {/* ── Revoca consenso ──────────────────────────────────────────────── */}
      {consentActive && !consentRevoked && (
        <Alert severity="warning" icon={<VerifiedUserIcon aria-hidden />}>
          <AlertTitle>Revoca consenso</AlertTitle>
          <Typography variant="bodySmall" sx={{ mb: 'var(--md-sys-spacing-2, 8px)' }}>
            La revoca rimuove il consenso GDPR da questo dispositivo. Alcune funzionalità AI
            potrebbero risultare disabilitate fino al successivo consenso.
          </Typography>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            onClick={handleRevoke}
            aria-label="Revoca consenso al trattamento dei dati GDPR"
          >
            Revoca consenso
          </Button>
        </Alert>
      )}

      {consentRevoked && (
        <Alert severity="info" icon={<CheckCircleIcon aria-hidden />}>
          Consenso revocato correttamente. Ricarica l&apos;app per applicare le modifiche.
        </Alert>
      )}

      {/* ── Informativa sintetica ─────────────────────────────────────────── */}
      <M3Surface elevation={0} sx={{ p: 'var(--md-sys-spacing-4, 16px)', borderRadius: 'var(--md-sys-shape-corner-small, 8px)', bgcolor: 'action.hover' }}>
        <Typography variant="labelMedium" color="text.secondary" gutterBottom>
          Informativa sintetica (art. 13 GDPR)
        </Typography>
        <Typography variant="bodySmall" color="text.secondary">
          I dati del docente (UDA, alunni, valutazioni) sono memorizzati localmente nel browser
          e non trasmessi a server esterni salvo backup esplicito su Google Drive.
          Le elaborazioni AI sono gestite tramite proxy sicuro Vercel — nessuna chiave API
          è esposta al browser. I dati AI vengono eliminati automaticamente dopo 365 giorni.
        </Typography>
      </M3Surface>
    </M3Surface>
  );
}

export default PrivacyPolicyPanel;
