/**
 * components/workspace/AgentStatusPanel.tsx — P29 Integration Hub
 *
 * Compact read-only panel showing:
 *   - Session token budget (LinearProgress + remaining count)
 *   - Every registered agent with its current status chip
 *
 * Reacts in real-time to observability events: no polling needed.
 *
 * MD3 Gold Compliant — M3Surface wrapper, MUI tokens for spacing,
 * aria-labels on all interactive/informational elements, no raw <div>
 * for layout or visual containers.
 */

import React, { useEffect, useState } from 'react';
import Box            from '@mui/material/Box';
import Chip           from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack          from '@mui/material/Stack';
import Typography     from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

import M3Surface           from '../ui/M3Surface';
import { useAgentStore }   from '../../stores/useAgentStore';
import { getTokenState }   from '../../modules/system/TokenController';
import { registerObserver } from '../../utils/observability';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AgentStatusPanelProps {
  sx?: SxProps<Theme>;
}

// ─── Status → Chip colour mapping ────────────────────────────────────────────

const STATUS_COLOR = {
  idle:    'default',
  running: 'primary',
  success: 'success',
  error:   'error',
} as const satisfies Record<string, 'default' | 'primary' | 'success' | 'error'>;

const STATUS_LABEL: Record<string, string> = {
  idle:    'in attesa',
  running: 'in esecuzione',
  success: 'completato',
  error:   'errore',
};

// ─── Component ────────────────────────────────────────────────────────────────

const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({ sx }) => {
  const { agents, refreshAgents } = useAgentStore();
  const [tokenState, setTokenState] = useState(() => getTokenState());

  // Subscribe to token + agent observability events for live updates
  useEffect(() => {
    const unsub = registerObserver((payload) => {
      if (payload.event.startsWith('token.')) {
        setTokenState(getTokenState());
      }
      // Agent events trigger store refreshes via useAgentStore's own observer;
      // we only need to re-read agents from the store, which happens automatically.
    });
    refreshAgents();
    return unsub;
  }, [refreshAgents]);

  const tokenPct = tokenState.limit > 0
    ? Math.min(100, Math.round((tokenState.used / tokenState.limit) * 100))
    : 0;

  const progressColor = tokenPct >= 90 ? 'error' : tokenPct >= 70 ? 'warning' : 'primary';

  return (
    <M3Surface
      elevation={1}
      sx={{ p: 'var(--md-sys-spacing-3, 12px)', borderRadius: 'var(--md-sys-shape-corner-medium, 12px)', ...sx }}
    >
      {/* ── Token budget section ─────────────────────────────────────────── */}
      <Typography
        variant="labelMedium"
        component="p"
        color="text.secondary"
        gutterBottom
        aria-label="Budget token sessione"
      >
        Budget token sessione
      </Typography>

      <LinearProgress
        variant="determinate"
        value={tokenPct}
        color={progressColor}
        aria-label={`Token usati: ${tokenState.used} su ${tokenState.limit}`}
        sx={{ height: 6, borderRadius: 3, mb: 'var(--md-sys-spacing-1, 4px)' }}
      />

      <Typography
        variant="bodySmall"
        color={tokenPct >= 90 ? 'error.main' : 'text.secondary'}
        component="p"
        sx={{ mb: 'var(--md-sys-spacing-2, 8px)' }}
      >
        {tokenState.remaining.toLocaleString('it-IT')} rimasti
        {' / '}
        {tokenState.limit.toLocaleString('it-IT')} totali
        {tokenPct >= 90 && ' — limite quasi raggiunto'}
      </Typography>

      {/* ── Agents list ──────────────────────────────────────────────────── */}
      {agents.length > 0 && (
        <>
          <Typography
            variant="labelMedium"
            component="p"
            color="text.secondary"
            sx={{ mt: 'var(--md-sys-spacing-2, 8px)', mb: 'var(--md-sys-spacing-1, 4px)' }}
          >
            Agenti registrati
          </Typography>

          <Stack
            spacing="var(--md-sys-spacing-1, 4px)"
            component="ul"
            aria-label="Lista agenti"
            sx={{ listStyle: 'none', p: 0, m: 0 }}
          >
            {agents.map(agent => (
              <Box
                key={agent.id}
                component="li"
                sx={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  gap:            'var(--md-sys-spacing-2, 8px)',
                }}
              >
                <Typography variant="bodySmall" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {agent.name}
                </Typography>
                <Chip
                  label={STATUS_LABEL[agent.status] ?? agent.status}
                  size="small"
                  color={STATUS_COLOR[agent.status] ?? 'default'}
                  aria-label={`Stato agente ${agent.name}: ${STATUS_LABEL[agent.status] ?? agent.status}`}
                />
              </Box>
            ))}
          </Stack>
        </>
      )}
    </M3Surface>
  );
};

export default AgentStatusPanel;
