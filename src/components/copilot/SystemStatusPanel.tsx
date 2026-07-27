/**
 * SystemStatusPanel.tsx — Sprint 10: Intelligent Dashboard block 2.
 *
 * Displays the current system health: GDPR/AgID compliance,
 * pending approvals, active signals, and derived risk level.
 *
 * MD3 Gold Compliant — all sizing/spacing via tokens.
 */

import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import M3Surface from '../ui/M3Surface';
import type { SystemStatus } from '../../hooks/useCopilotDashboard';

// ─── Status → token mapping ───────────────────────────────────────────────────

type StatusLevel = 'ok' | 'warning' | 'critical';

interface StatusTokens { bg: string; fg: string; icon: string; label: string }

const STATUS_TOKENS: Record<StatusLevel, StatusTokens> = {
  ok:       { bg: 'var(--md-sys-color-primary-container)',   fg: 'var(--md-sys-color-on-primary-container)',   icon: 'check_circle',   label: 'OK' },
  warning:  { bg: 'var(--md-sys-color-tertiary-container)',  fg: 'var(--md-sys-color-on-tertiary-container)',  icon: 'warning',        label: 'Attenzione' },
  critical: { bg: 'var(--md-sys-color-error-container)',     fg: 'var(--md-sys-color-on-error-container)',     icon: 'error',          label: 'Critico' },
};

// ─── Single status tile ───────────────────────────────────────────────────────

interface TileProps {
  label:  string;
  value:  string;
  level:  StatusLevel;
  icon:   string;
}

function StatusTile({ label, value, level, icon }: TileProps): JSX.Element {
  const t = STATUS_TOKENS[level];
  return (
    <Box
      sx={{
        p: 'var(--md-sys-spacing-3)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        bgcolor: t.bg,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-1)',
      }}
    >
      <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 'var(--md-sys-icon-size-xs)', color: t.fg }}
        >
          {icon}
        </Box>
        <Typography variant="labelSmall" sx={{ color: t.fg }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="titleSmall" sx={{ color: t.fg, fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
        {value}
      </Typography>
    </Box>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  status: SystemStatus;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SystemStatusPanel: React.FC<Props> = ({ status }) => {
  const approvalLevel: StatusLevel =
    status.pendingApprovals > 0 ? 'warning' : 'ok';
  const signalsLevel: StatusLevel =
    status.riskLevel === 'critical' ? 'critical' :
    status.activeSignals > 0 ? 'warning' : 'ok';

  return (
    <M3Surface
      elevation={2}
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
            monitor_heart
          </Box>
          <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            Stato sistema
          </Typography>
        </Stack>

        <Grid container spacing={1}>
          <Grid size={6}>
            <StatusTile
              label="GDPR"
              value={STATUS_TOKENS[status.gdpr].label}
              level={status.gdpr}
              icon={STATUS_TOKENS[status.gdpr].icon}
            />
          </Grid>
          <Grid size={6}>
            <StatusTile
              label="AgID"
              value={STATUS_TOKENS[status.agid].label}
              level={status.agid}
              icon={STATUS_TOKENS[status.agid].icon}
            />
          </Grid>
          <Grid size={6}>
            <StatusTile
              label="Approvazioni"
              value={status.pendingApprovals === 0 ? 'Nessuna' : `${status.pendingApprovals} in attesa`}
              level={approvalLevel}
              icon="pending_actions"
            />
          </Grid>
          <Grid size={6}>
            <StatusTile
              label="Segnali attivi"
              value={status.activeSignals === 0 ? 'Nessuno' : String(status.activeSignals)}
              level={signalsLevel}
              icon="notifications"
            />
          </Grid>
        </Grid>
      </Stack>
    </M3Surface>
  );
};

export default SystemStatusPanel;
