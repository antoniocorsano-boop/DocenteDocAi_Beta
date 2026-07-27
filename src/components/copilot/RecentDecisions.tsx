/**
 * RecentDecisions.tsx — Sprint 10: Intelligent Dashboard block 3.
 *
 * Vertical timeline of the last 10 system signals from DecisionMemory.
 * Shows type, message, timestamp, and severity color coding.
 *
 * MD3 Gold Compliant — all sizing/spacing via tokens.
 */

import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import M3Surface from '../ui/M3Surface';
import type { SystemSignal, SystemSignalType } from '../../cognition/signals';

// ─── Signal type metadata ─────────────────────────────────────────────────────

interface SignalMeta { icon: string; label: string }

const SIGNAL_META: Record<SystemSignalType, SignalMeta> = {
  COMPLIANCE_UPDATE:  { icon: 'gavel',            label: 'Conformità' },
  NEW_DOCUMENT:       { icon: 'description',       label: 'Nuovo documento' },
  INTEGRATION_ERROR:  { icon: 'cloud_off',         label: 'Errore integrazione' },
  PERFORMANCE_ALERT:  { icon: 'trending_down',     label: 'Alert performance' },
  MISSING_DATA:       { icon: 'data_alert',        label: 'Dati mancanti' },
  ACTION_EXECUTED:    { icon: 'check_circle',      label: 'Azione eseguita' },
  APPROVAL_REQUIRED:  { icon: 'pending_actions',   label: 'Approvazione richiesta' },
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'var(--md-sys-color-error)',
  warning:  'var(--md-sys-color-tertiary)',
  info:     'var(--md-sys-color-secondary)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  signals: SystemSignal[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const RecentDecisions: React.FC<Props> = ({ signals }) => {
  return (
    <M3Surface
      elevation={1}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-large)',
        p: 'var(--md-sys-spacing-4)',
      }}
    >
      <Stack gap="var(--md-sys-spacing-3)">
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}
          >
            history
          </Box>
          <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            Attività recenti
          </Typography>
        </Stack>

        {signals.length === 0 ? (
          <Typography
            variant="bodySmall"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)', py: 'var(--md-sys-spacing-2)' }}
          >
            Nessuna attività registrata in questa sessione.
          </Typography>
        ) : (
          <Stack gap="var(--md-sys-spacing-1)">
            {signals.map((signal, index) => {
              const meta  = SIGNAL_META[signal.type] ?? { icon: 'bolt', label: signal.type };
              const color = SEVERITY_COLOR[signal.severity] ?? 'var(--md-sys-color-secondary)';

              return (
                <React.Fragment key={signal.id}>
                  {index > 0 && (
                    <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />
                  )}
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    gap="var(--md-sys-spacing-2)"
                    sx={{ py: 'var(--md-sys-spacing-1)' }}
                  >
                    {/* Severity indicator dot + icon */}
                    <Box sx={{ position: 'relative', flexShrink: 0, mt: '2px' }}>
                      <Box
                        component="span"
                        className="material-symbols-outlined"
                        aria-hidden="true"
                        sx={{ fontSize: 'var(--md-sys-icon-size-xs)', color }}
                      >
                        {meta.icon}
                      </Box>
                    </Box>

                    {/* Content */}
                    <Stack flexGrow={1} minWidth={0} gap="var(--md-sys-spacing-05)">
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="var(--md-sys-spacing-2)">
                        <Typography
                          variant="labelSmall"
                          sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}
                        >
                          {meta.label}
                        </Typography>
                        <Typography
                          variant="labelSmall"
                          sx={{ color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}
                        >
                          {formatTime(signal.timestamp)}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="bodySmall"
                        sx={{
                          color: 'var(--md-sys-color-on-surface-variant)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {signal.message}
                      </Typography>
                    </Stack>
                  </Stack>
                </React.Fragment>
              );
            })}
          </Stack>
        )}
      </Stack>
    </M3Surface>
  );
};

export default RecentDecisions;
