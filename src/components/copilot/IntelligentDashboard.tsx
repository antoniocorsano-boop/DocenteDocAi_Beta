/**
 * IntelligentDashboard.tsx — Sprint 10: Copilot Brain Intelligent Dashboard.
 *
 * Assembles the 4 main blocks of the cognitive dashboard:
 *   Block 1 — Primary action (PrimaryActionCard + SecondaryActionsList)
 *   Block 2 — System health (SystemStatusPanel)
 *   Block 3 — Recent decisions timeline (RecentDecisions)
 *
 * Architecture rules:
 *   - Zero business logic — reads only from hooks
 *   - All navigation via optional onNavigate prop
 *   - MD3 Gold Compliant
 *
 * @example
 * <IntelligentDashboard onNavigate={(view) => navigate(view)} />
 */

import React, { useState, useMemo } from 'react';
import Box        from '@mui/material/Box';
import Stack      from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider    from '@mui/material/Divider';
import Button     from '@mui/material/Button';
import Collapse   from '@mui/material/Collapse';
import { useNextAction }                  from '../../hooks/useNextAction';
import { useCopilotDashboard }            from '../../hooks/useCopilotDashboard';
import { useProactiveNotifications }      from '../../hooks/useProactiveNotifications';
import { explainAction }                  from '../../cognition/explainAction';
import PrimaryActionCard                  from './PrimaryActionCard';
import SecondaryActionsList               from './SecondaryActionsList';
import SystemStatusPanel                  from './SystemStatusPanel';
import NotificationToast                  from './NotificationToast';
import DecisionTimeline                   from './DecisionTimeline';
import ExplainabilityPanel               from './ExplainabilityPanel';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onNavigate?: (view: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const IntelligentDashboard: React.FC<Props> = ({ onNavigate }) => {
  // Primary action with full NextAction richness (icon, cta, reason)
  const primaryAction = useNextAction();

  // Secondary actions + system status + ranked primary (reactive to DecisionMemory)
  const { primaryRanked, secondaries, systemStatus } = useCopilotDashboard();

  // Sprint 11 — proactive notification queue
  const { notifications, dismiss, dismissAll } = useProactiveNotifications();

  // Sprint 15 — explainability panel toggle
  const [showExplain, setShowExplain] = useState(false);
  const explanation = useMemo(
    () => (showExplain ? explainAction(primaryRanked) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showExplain, primaryRanked.id, primaryRanked.finalScore],
  );

  return (
    <Box sx={{ py: 'var(--md-sys-spacing-2)' }}>
      <Stack gap="var(--md-sys-spacing-4)">

        {/* ── Dashboard header ── */}
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-md)', color: 'var(--md-sys-color-primary)' }}
          >
            neurology
          </Box>
          <Stack>
            <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              Brain Dashboard
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Decisioni, stato sistema e attività recenti
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />

        {/* ── Proactive notifications (Sprint 11) — hidden when empty ── */}
        <NotificationToast
          notifications={notifications}
          onDismiss={dismiss}
          onDismissAll={dismissAll}
        />

        {/* ── Block 1a: Primary action ── */}
        <PrimaryActionCard action={primaryAction} onNavigate={onNavigate} />

        {/* ── Sprint 15: Explainability toggle ── */}
        <Box>
          <Button
            size="small"
            variant="text"
            onClick={() => setShowExplain((v) => !v)}
            aria-expanded={showExplain}
            aria-controls="explainability-panel"
            startIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
              >
                help_outline
              </Box>
            }
            endIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
              >
                {showExplain ? 'expand_less' : 'expand_more'}
              </Box>
            }
            sx={{
              color: 'var(--md-sys-color-secondary)',
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              px: 0,
            }}
          >
            Perché questo suggerimento?
          </Button>
          <Collapse in={showExplain}>
            <Box id="explainability-panel" sx={{ mt: 'var(--md-sys-spacing-3)' }}>
              <ExplainabilityPanel
                explanation={explanation}
                onClose={() => setShowExplain(false)}
              />
            </Box>
          </Collapse>
        </Box>

        {/* ── Block 1b: Secondary actions ── */}
        <SecondaryActionsList actions={secondaries} onNavigate={onNavigate} />

        <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />

        {/* ── Block 2: System status ── */}
        <SystemStatusPanel status={systemStatus} />

        <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />

        {/* ── Block 3: Full decisional timeline (Sprint 12) ── */}
        <DecisionTimeline />

      </Stack>
    </Box>
  );
};

export default IntelligentDashboard;
