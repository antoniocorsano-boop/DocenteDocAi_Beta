/**
 * PrimaryActionCard.tsx — Sprint 10: Intelligent Dashboard block 1.
 *
 * Displays the primary recommended action from the Decision Engine.
 * Executes through the full policy→HITL→audit→signal pipeline on CTA click.
 *
 * MD3 Gold Compliant — all sizing/spacing via tokens.
 */

import React, { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import M3Surface from '../ui/M3Surface';
import { executeCopilotAction } from '../../cognition/executeCopilotAction';
import type { SuggestedAction }   from '../../cognition/copilotBrain';
import type { ExecutionStatus }   from '../../cognition/executeCopilotAction';
import type { NextAction }        from '../../cognition/decisionEngine/types';

// ─── Priority → token mapping ─────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  high:   { bg: 'var(--md-sys-color-error-container)',     fg: 'var(--md-sys-color-on-error-container)',     label: 'Alta' },
  medium: { bg: 'var(--md-sys-color-tertiary-container)',  fg: 'var(--md-sys-color-on-tertiary-container)',  label: 'Media' },
  low:    { bg: 'var(--md-sys-color-secondary-container)', fg: 'var(--md-sys-color-on-secondary-container)', label: 'Bassa' },
};

const DEFAULT_PRIORITY = PRIORITY_COLORS.low;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  action:       NextAction;
  onNavigate?:  (view: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PrimaryActionCard: React.FC<Props> = ({ action, onNavigate }) => {
  const [showReason,   setShowReason]   = useState(false);
  const [execStatus,   setExecStatus]   = useState<ExecutionStatus | 'idle'>('idle');

  const priority = action.priority ?? 'low';
  const colors   = PRIORITY_COLORS[priority] ?? DEFAULT_PRIORITY;

  const handleCta = useCallback(() => {
    const suggested: SuggestedAction = {
      id:               action.id,
      title:            action.label,
      description:      action.description,
      priority:         action.priority ?? 'low',
      type:             action.targetView ?? 'general',
      requiresApproval: action.requiresApproval,
    };

    const result = executeCopilotAction(suggested, {});
    setExecStatus(result.status);

    if (result.status === 'executed') {
      const target = result.navigateTo;
      if (target && onNavigate) onNavigate(target);
    }
  }, [action, onNavigate]);

  return (
    <M3Surface
      elevation={3}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-large)',
        p: 'var(--md-sys-spacing-5)',
      }}
    >
      <Stack gap="var(--md-sys-spacing-4)">

        {/* ── Header: icon + label + priority chip ── */}
        <Stack direction="row" alignItems="flex-start" gap="var(--md-sys-spacing-3)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize: 'var(--md-sys-icon-size-xl)',
              color: 'var(--md-sys-color-primary)',
              flexShrink: 0,
              mt: '2px',
            }}
          >
            {action.icon}
          </Box>

          <Stack gap="var(--md-sys-spacing-1)" flexGrow={1} minWidth={0}>
            <Typography
              variant="titleMedium"
              sx={{ color: 'var(--md-sys-color-on-surface)', lineHeight: 1.3 }}
            >
              {action.label}
            </Typography>
            <Typography
              variant="bodySmall"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {action.description}
            </Typography>
          </Stack>

          {/* Priority badge */}
          <Box
            sx={{
              px: 'var(--md-sys-spacing-3)',
              py: 'var(--md-sys-spacing-1)',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              bgcolor: colors.bg,
              flexShrink: 0,
            }}
          >
            <Typography variant="labelSmall" sx={{ color: colors.fg, whiteSpace: 'nowrap' }}>
              {colors.label}
            </Typography>
          </Box>
        </Stack>

        {/* ── Reason collapsible ── */}
        <Box>
          <Button
            size="small"
            variant="text"
            onClick={() => setShowReason((v) => !v)}
            aria-expanded={showReason}
            aria-controls={`reason-${action.id}`}
            endIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
              >
                {showReason ? 'expand_less' : 'expand_more'}
              </Box>
            }
            sx={{
              color: 'var(--md-sys-color-on-surface-variant)',
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              px: 0,
            }}
          >
            Perché questo suggerimento?
          </Button>
          <Collapse in={showReason}>
            <Box
              id={`reason-${action.id}`}
              sx={{
                mt: 'var(--md-sys-spacing-2)',
                p: 'var(--md-sys-spacing-3)',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                bgcolor: 'var(--md-sys-color-surface-container-low)',
              }}
            >
              <Typography
                variant="bodySmall"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {action.reason}
              </Typography>
            </Box>
          </Collapse>
        </Box>

        {/* ── CTA ── */}
        {action.targetView && (
          <Button
            variant="contained"
            onClick={handleCta}
            aria-label={`${action.cta}: ${action.label}`}
            fullWidth
            startIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
              >
                {action.icon}
              </Box>
            }
            sx={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}
          >
            {action.cta}
          </Button>
        )}

        {/* ── Execution feedback ── */}
        {execStatus === 'blocked' && (
          <Box
            role="status"
            sx={{
              p: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              bgcolor: 'var(--md-sys-color-error-container)',
            }}
          >
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>
              Azione bloccata dalla policy. Verifica conformità GDPR/AgID.
            </Typography>
          </Box>
        )}
        {execStatus === 'pending_approval' && (
          <Box
            role="status"
            sx={{
              p: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              bgcolor: 'var(--md-sys-color-secondary-container)',
            }}
          >
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
              Richiesta inviata al dirigente. In attesa di approvazione.
            </Typography>
          </Box>
        )}

      </Stack>
    </M3Surface>
  );
};

export default PrimaryActionCard;
