/**
 * BackupRecoveryPanel.tsx — C18: UI per backup e recovery completo dell'app.
 *
 * Funzionalità:
 *   - Salva backup completo (localStorage + stato Zustand) su IndexedDB
 *   - Ripristina backup da IndexedDB (con conferma)
 *   - Esporta backup come file JSON
 *   - Elimina backup (con conferma doppia)
 *   - Mostra quota storage e timestamp ultimo backup
 *   - Verifica persistenza live (integra C17 persistenceVerifier)
 *
 * Usa backupService.ts esistente (IndexedDB, saveBackup / loadBackup).
 * MD3 Gold Compliant: M3Surface, token MD3, aria-label completi.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Box         from '@mui/material/Box';
import Button      from '@mui/material/Button';
import Chip        from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider     from '@mui/material/Divider';
import LinearProgress    from '@mui/material/LinearProgress';
import Stack       from '@mui/material/Stack';
import Typography  from '@mui/material/Typography';
import M3Surface   from '../ui/M3Surface';
import {
  saveBackup,
  loadBackup,
  deleteBackup,
  exportBackupAsJson,
  checkStorageQuota,
} from '../../services/backupService';
import { verifyPersistence } from '../../utils/persistenceVerifier';
import type { PersistenceVerificationReport } from '../../utils/persistenceVerifier';
import { slog } from '../../utils/structuredLogger';

// ─── Types ────────────────────────────────────────────────────────────────────

type PanelStatus = 'idle' | 'saving' | 'loading' | 'deleting' | 'exporting' | 'verifying';

interface QuotaInfo {
  usageBytes:  number;
  quotaBytes:  number;
  usedPercent: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Assembla uno snapshot dello stato applicativo da persistere.
 * Raccoglie: localStorage completo (esclude dati sensibili / auth temporanei).
 */
function gatherStateSnapshot(): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {
    _version: 1,
    _timestamp: new Date().toISOString(),
    localStorage: {} as Record<string, unknown>,
  };

  // Capture all localStorage keys (never capture session / auth tokens)
  const EXCLUDED_PREFIXES = ['gsi_', 'google_', '__ld', 'otel_'];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (EXCLUDED_PREFIXES.some((p) => key.toLowerCase().startsWith(p))) continue;
    try {
      (snapshot.localStorage as Record<string, unknown>)[key] = JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {
      (snapshot.localStorage as Record<string, unknown>)[key] = localStorage.getItem(key);
    }
  }

  return snapshot;
}

/**
 * Ripristina uno snapshot: scrive ogni chiave in localStorage.
 * Chiavi escluse dalla sovrascrittura: auth, GSI.
 */
function restoreStateSnapshot(snapshot: Record<string, unknown>): void {
  const lsData = snapshot.localStorage as Record<string, unknown> | undefined;
  if (!lsData || typeof lsData !== 'object') return;

  for (const [key, value] of Object.entries(lsData)) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded — skip silently */
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ConfirmState {
  pending: 'restore' | 'delete' | null;
}

const BackupRecoveryPanel: React.FC = () => {
  const [status, setStatus]           = useState<PanelStatus>('idle');
  const [message, setMessage]         = useState<string | null>(null);
  const [isError, setIsError]         = useState(false);
  const [backupTimestamp, setBackupTs] = useState<string | null>(null);
  const [quota, setQuota]             = useState<QuotaInfo | null>(null);
  const [confirm, setConfirm]         = useState<ConfirmState>({ pending: null });
  const [verification, setVerification] = useState<PersistenceVerificationReport | null>(null);

  // ── Load backup metadata on mount ──
  const refreshBackupMeta = useCallback(async () => {
    try {
      const saved = await loadBackup();
      if (saved && typeof saved === 'object' && '_timestamp' in saved) {
        setBackupTs((saved as Record<string, unknown>)._timestamp as string);
      } else if (saved) {
        setBackupTs('Backup presente (data sconosciuta)');
      } else {
        setBackupTs(null);
      }
    } catch {
      setBackupTs(null);
    }
    // Storage quota
    try {
      const est = await checkStorageQuota();
      if (est && est.usage !== undefined && est.quota !== undefined) {
        setQuota({
          usageBytes:  est.usage,
          quotaBytes:  est.quota,
          usedPercent: Math.round((est.usage / est.quota) * 100),
        });
      }
    } catch { /* best effort */ }
  }, []);

  useEffect(() => { refreshBackupMeta(); }, [refreshBackupMeta]);

  // ── Actions ──

  const handleSave = async () => {
    setStatus('saving');
    setMessage(null);
    setIsError(false);
    try {
      const snapshot = gatherStateSnapshot();
      await saveBackup(snapshot);
      slog.info('BACKUP', 'Backup salvato', { keys: Object.keys(snapshot.localStorage as object).length });
      setMessage('Backup salvato con successo.');
      await refreshBackupMeta();
    } catch (e) {
      setIsError(true);
      setMessage(`Errore durante il salvataggio: ${String(e)}`);
      slog.error('BACKUP', 'Salvataggio backup fallito', { error: String(e) });
    } finally {
      setStatus('idle');
    }
  };

  const handleRestore = async () => {
    if (confirm.pending !== 'restore') {
      setConfirm({ pending: 'restore' });
      return;
    }
    setConfirm({ pending: null });
    setStatus('loading');
    setMessage(null);
    setIsError(false);
    try {
      const saved = await loadBackup();
      if (!saved) throw new Error('Nessun backup disponibile');
      restoreStateSnapshot(saved as Record<string, unknown>);
      slog.info('BACKUP', 'Backup ripristinato');
      setMessage('Backup ripristinato. Ricarica la pagina per applicare le modifiche.');
    } catch (e) {
      setIsError(true);
      setMessage(`Errore durante il ripristino: ${String(e)}`);
      slog.error('BACKUP', 'Ripristino backup fallito', { error: String(e) });
    } finally {
      setStatus('idle');
    }
  };

  const handleExport = async () => {
    setStatus('exporting');
    setMessage(null);
    setIsError(false);
    try {
      const json = await exportBackupAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `backup-docentedoc-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      slog.info('BACKUP', 'Backup esportato');
      setMessage('Backup esportato come file JSON.');
    } catch (e) {
      setIsError(true);
      setMessage(`Errore durante l'export: ${String(e)}`);
    } finally {
      setStatus('idle');
    }
  };

  const handleDelete = async () => {
    if (confirm.pending !== 'delete') {
      setConfirm({ pending: 'delete' });
      return;
    }
    setConfirm({ pending: null });
    setStatus('deleting');
    setMessage(null);
    setIsError(false);
    try {
      await deleteBackup();
      slog.warn('BACKUP', 'Backup eliminato');
      setMessage('Backup eliminato.');
      setBackupTs(null);
    } catch (e) {
      setIsError(true);
      setMessage(`Errore durante l'eliminazione: ${String(e)}`);
    } finally {
      setStatus('idle');
    }
  };

  const handleVerify = () => {
    setStatus('verifying');
    try {
      const report = verifyPersistence();
      setVerification(report);
    } finally {
      setStatus('idle');
    }
  };

  const isBusy = status !== 'idle';

  return (
    <Stack gap="var(--md-sys-spacing-4)">

      {/* ── Header ── */}
      <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center">
        <Box component="span" className="material-symbols-outlined" aria-hidden="true"
          sx={{ fontSize: 'var(--md-sys-icon-size-md)', color: 'var(--md-sys-color-primary)' }}>
          backup
        </Box>
        <Typography variant="titleSmall">Backup e Recovery</Typography>
        {isBusy && <CircularProgress size={16} aria-label="Operazione in corso" />}
      </Stack>

      {/* ── Backup status ── */}
      <M3Surface elevation={0} sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-surface-variant)' }}>
        <Stack gap="var(--md-sys-spacing-2)">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="labelMedium">Stato backup</Typography>
            <Chip
              label={backupTimestamp ? 'Backup disponibile' : 'Nessun backup'}
              size="small"
              sx={{
                bgcolor: backupTimestamp
                  ? 'var(--md-sys-color-primary-container)'
                  : 'var(--md-sys-color-surface-variant)',
              }}
            />
          </Stack>
          {backupTimestamp && (
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Ultimo: {typeof backupTimestamp === 'string' && backupTimestamp.includes('T')
                ? new Date(backupTimestamp).toLocaleString('it-IT')
                : backupTimestamp}
            </Typography>
          )}
          {!backupTimestamp && (
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Nessun backup salvato in IndexedDB.
            </Typography>
          )}
        </Stack>
      </M3Surface>

      {/* ── Storage quota ── */}
      {quota && (
        <M3Surface elevation={0} sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-surface-variant)' }}>
          <Stack gap="var(--md-sys-spacing-2)">
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="labelSmall">Storage utilizzato</Typography>
              <Typography variant="labelSmall">
                {formatBytes(quota.usageBytes)} / {formatBytes(quota.quotaBytes)} ({quota.usedPercent}%)
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(quota.usedPercent, 100)}
              aria-label={`Storage: ${quota.usedPercent}% utilizzato`}
              sx={{
                height: 6,
                borderRadius: 'var(--md-sys-shape-corner-full)',
                bgcolor: 'var(--md-sys-color-outline-variant)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: quota.usedPercent > 80
                    ? 'var(--md-sys-color-error)'
                    : 'var(--md-sys-color-primary)',
                },
              }}
            />
          </Stack>
        </M3Surface>
      )}

      {/* ── Actions ── */}
      <Stack gap="var(--md-sys-spacing-2)">
        <Typography variant="labelMedium">Operazioni</Typography>
        <Stack direction="row" flexWrap="wrap" gap="var(--md-sys-spacing-2)">
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={isBusy}
            aria-label="Salva backup completo dell'applicazione"
            sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
            startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>save</Box>}
          >
            {status === 'saving' ? 'Salvataggio...' : 'Salva backup'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleRestore}
            disabled={isBusy || !backupTimestamp}
            aria-label={confirm.pending === 'restore' ? 'Conferma ripristino backup' : 'Ripristina backup da IndexedDB'}
            color={confirm.pending === 'restore' ? 'error' : 'primary'}
            sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
            startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>restore</Box>}
          >
            {confirm.pending === 'restore' ? 'Conferma ripristino?' : status === 'loading' ? 'Ripristino...' : 'Ripristina'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleExport}
            disabled={isBusy || !backupTimestamp}
            aria-label="Esporta backup come file JSON scaricabile"
            sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
            startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>download</Box>}
          >
            {status === 'exporting' ? 'Esportazione...' : 'Esporta JSON'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleVerify}
            disabled={isBusy}
            aria-label="Verifica lo stato di tutti i layer di persistenza"
            sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
            startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>verified</Box>}
          >
            {status === 'verifying' ? 'Verifica...' : 'Verifica persistenza'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleDelete}
            disabled={isBusy || !backupTimestamp}
            aria-label={confirm.pending === 'delete' ? 'Conferma eliminazione backup' : 'Elimina backup da IndexedDB'}
            color="error"
            sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
            startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>delete</Box>}
          >
            {confirm.pending === 'delete' ? 'Conferma eliminazione?' : status === 'deleting' ? 'Eliminazione...' : 'Elimina backup'}
          </Button>
        </Stack>

        {/* Cancel confirm */}
        {confirm.pending && (
          <Button
            variant="text"
            size="small"
            onClick={() => setConfirm({ pending: null })}
            aria-label="Annulla operazione"
            sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
          >
            Annulla
          </Button>
        )}
      </Stack>

      {/* ── Feedback message ── */}
      {message && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: isError ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-primary-container)',
          }}
          role={isError ? 'alert' : 'status'}
        >
          <Typography variant="bodySmall" sx={{ color: isError ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-primary-container)' }}>
            {message}
          </Typography>
        </M3Surface>
      )}

      {/* ── Persistence verification report ── */}
      {verification && (
        <>
          <Divider />
          <Stack gap="var(--md-sys-spacing-2)">
            <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center">
              <Typography variant="labelMedium">Verifica layer di persistenza</Typography>
              <Chip
                label={verification.allOk ? 'Tutto OK' : `${verification.errors.length} errori`}
                size="small"
                sx={{
                  bgcolor: verification.allOk
                    ? 'var(--md-sys-color-primary-container)'
                    : 'var(--md-sys-color-error-container)',
                }}
              />
            </Stack>
            {verification.layers.map((l) => {
              const icon  = l.status === 'ok' ? 'check_circle' : l.status === 'empty' ? 'radio_button_unchecked' : l.status === 'missing' ? 'warning' : 'error';
              const color = l.status === 'ok' ? 'var(--md-sys-color-primary)' : l.status === 'empty' ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-error)';
              return (
                <Stack key={l.storageKey} direction="row" gap="var(--md-sys-spacing-2)" alignItems="flex-start">
                  <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                    sx={{ fontSize: 'var(--md-sys-icon-size-xs)', color, flexShrink: 0, mt: '2px' }}>
                    {icon}
                  </Box>
                  <Box>
                    <Typography variant="labelSmall">{l.layer}</Typography>
                    <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {l.entryCount !== undefined ? `${l.entryCount} voci` : ''}{l.sizeBytes !== undefined ? ` · ${formatBytes(l.sizeBytes)}` : ''}{l.note ? ` · ${l.note}` : ''}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
            {verification.warnings.length > 0 && (
              <M3Surface elevation={0} sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-2)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                {verification.warnings.map((w, i) => (
                  <Typography key={i} variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>{w}</Typography>
                ))}
              </M3Surface>
            )}
          </Stack>
        </>
      )}

    </Stack>
  );
};

export default BackupRecoveryPanel;
