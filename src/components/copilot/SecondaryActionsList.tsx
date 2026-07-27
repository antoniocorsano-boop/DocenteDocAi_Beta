/**
 * SecondaryActionsList.tsx — Sprint 10: Intelligent Dashboard block 1b.
 *
 * Renders up to 2 secondary suggested actions as compact outlined buttons.
 * Executes through executeCopilotAction on click.
 *
 * MD3 Gold Compliant — all sizing/spacing via tokens.
 */

import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { executeCopilotAction } from '../../cognition/executeCopilotAction';
import type { SuggestedAction }   from '../../cognition/copilotBrain';

// ─── Icons per action type ────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  register:   'person_add',
  lessons:    'menu_book',
  planning:   'auto_stories',
  analytics:  'bar_chart',
  aula:       'groups',
  copilot:    'psychology',
  settings:   'settings',
  enterprise: 'business',
  general:    'bolt',
};

function iconFor(type: string): string {
  return TYPE_ICONS[type] ?? 'bolt';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actions:     SuggestedAction[];
  onNavigate?: (view: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SecondaryActionsList: React.FC<Props> = ({ actions, onNavigate }) => {
  const visible = actions.slice(0, 2);

  const handleClick = useCallback((action: SuggestedAction) => {
    const result = executeCopilotAction(action, {});
    if (result.status === 'executed' && result.navigateTo && onNavigate) {
      onNavigate(result.navigateTo);
    }
  }, [onNavigate]);

  if (visible.length === 0) return null;

  return (
    <Box>
      <Typography
        variant="labelSmall"
        sx={{
          color: 'var(--md-sys-color-on-surface-variant)',
          mb: 'var(--md-sys-spacing-2)',
          display: 'block',
        }}
      >
        Puoi fare anche
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap="var(--md-sys-spacing-2)">
        {visible.map((action) => (
          <Button
            key={action.id}
            size="small"
            variant="outlined"
            onClick={() => handleClick(action)}
            aria-label={`${action.title}: ${action.description}`}
            startIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
              >
                {iconFor(action.type)}
              </Box>
            }
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-full)',
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          >
            {action.title}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default SecondaryActionsList;
