// MD3 Gold Compliant
// Semantic surface container wrapper with MD3 elevation-to-surface-color mapping.
// Replaces arbitrary <div> containers with correct MD3 surface semantics.
// Audit: febbraio 2026 — fix P0-B marzo 2026 (sx richiedeva MUI Box, non div nativo)

import React from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material';

export type SurfaceElevation = 0 | 1 | 2 | 3 | 4 | 5;

const ELEVATION_TOKENS: Record<SurfaceElevation, string> = {
  0: 'var(--md-sys-color-surface)',
  1: 'var(--md-sys-color-surface-container-lowest)',
  2: 'var(--md-sys-color-surface-container-low)',
  3: 'var(--md-sys-color-surface-container)',
  4: 'var(--md-sys-color-surface-container-high)',
  5: 'var(--md-sys-color-surface-container-highest)',
};

export interface M3SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  /** MD3 surface elevation tier (0-5), maps to surface-container tokens */
  elevation?: SurfaceElevation;
  /** Override the root element */
  component?: React.ElementType;
  /** MUI sx prop — funziona correttamente perché Box è il root element */
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
}

/**
 * MD3 Surface container.
 *
 * Use this in place of `<div>` / `<Paper>` for all visual shell, card, and
 * layout containers. Selects the correct `--md-sys-color-surface-container-*`
 * token for each elevation tier.
 *
 * @example
 * <M3Surface elevation={2} sx={{ padding: 'var(--md-sys-spacing-4)' }}>
 *   ...
 * </M3Surface>
 */
const M3Surface = React.forwardRef<HTMLElement, M3SurfaceProps>(
  ({ elevation = 0, component: Component = 'div', style, children, sx, ...rest }, ref) => {
    const bg = ELEVATION_TOKENS[elevation];
    return (
      <Box
        component={Component}
        ref={ref}
        sx={[
          {
            backgroundColor: bg,
            color: 'var(--md-sys-color-on-surface)',
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
        // eslint-disable-next-line no-restricted-syntax -- style passthrough intenzionale: M3Surface espone style per override inline dell'utente
        style={style}
        {...rest}
      >
        {children}
      </Box>
    );
  }
);

M3Surface.displayName = 'M3Surface';

export default M3Surface;
