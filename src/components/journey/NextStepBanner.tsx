/**
 * NextStepBanner — MD3 compliant banner showing the single highest-priority
 * next action from the centralised Decision Engine.
 *
 * Architecture rule: this component contains ZERO decision logic.
 * It only renders what `useNextAction()` returns.
 *
 * Progressive Disclosure: shows ONE primary CTA based on CapabilityLevel.
 *
 * MD3 compliance:
 *   - Container via M3Surface with primary-container colours
 *   - No raw <div> for layout
 *   - aria-label on root, aria-hidden on decorative icon
 *   - No inline fontSize/fontWeight
 */

import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import M3Surface from '../ui/M3Surface';
import { useNextAction } from '../../hooks/useNextAction';

interface NextStepBannerProps {
  /** Called when the primary CTA is clicked. Receives the targetView key. */
  onNavigate?: (view: string) => void;
}

/**
 * Shows the one recommended next step for the teacher.
 * Delegates ALL decision logic to the Decision Engine (useNextAction).
 */
const NextStepBanner: React.FC<NextStepBannerProps> = ({ onNavigate }) => {
  const action = useNextAction();

  return (
    <M3Surface
      elevation={1}
      role="complementary"
      aria-label="Prossimo passo consigliato"
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-large)',
        p: 'var(--md-sys-spacing-4)',
        bgcolor: 'var(--md-sys-color-primary-container)',
        color: 'var(--md-sys-color-on-primary-container)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing="var(--md-sys-spacing-4)" flexWrap="wrap">
        {/* Icon */}
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 'var(--md-sys-icon-size-lg)', flexShrink: 0, color: 'var(--md-sys-color-primary)' }}
        >
          {action.icon}
        </Box>

        {/* Text content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="labelSmall"
            sx={{
              color: 'var(--md-sys-color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              mb: 'var(--md-sys-spacing-1)',
            }}
          >
            Prossimo passo
          </Typography>
          <Typography
            variant="bodyMedium"
            sx={{
              color: 'var(--md-sys-color-on-primary-container)',
              fontWeight: 'var(--md-sys-typescale-weight-medium)',
            }}
          >
            {action.label}
          </Typography>
          <Typography
            variant="bodySmall"
            sx={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.8, mt: 'var(--md-sys-spacing-1)' }}
          >
            {action.description}
          </Typography>
        </Box>

        {/* Primary CTA — only 1, only when targetView is defined */}
        {action.targetView && onNavigate && (
          <Button
            variant="contained"
            size="small"
            aria-label={`${action.cta}: ${action.label}`}
            onClick={() => onNavigate(action.targetView!)}
            sx={{ flexShrink: 0 }}
          >
            {action.cta}
          </Button>
        )}
      </Stack>
    </M3Surface>
  );
};

export default NextStepBanner;
