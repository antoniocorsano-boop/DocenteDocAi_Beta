// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
/**
 * ViewLoadingPlaceholder - Loading UI for Lazy-Loaded Views
 * 
 * Displays a smooth loading skeleton while view chunks are being loaded.
 * Improves perceived performance during code splitting transitions.
 */

import React from 'react';
import { AiThinkingGem } from './ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { logger } from '../utils/logger';
interface ViewLoadingPlaceholderProps {
  message?: string;
  className?: string;
}

/**
 * Default loading placeholder - shown while view code is loading
 */
export const ViewLoadingPlaceholder: React.FC<ViewLoadingPlaceholderProps> = ({ 
  message = 'Caricamento vista...'
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(0.6 * var(--md-sys-viewport-height-full))',
        gap: 'var(--md-sys-spacing-6)'
      }}
    >
      <AiThinkingGem size="large" text={message} />
    </div>
  );
};

/**
 * Minimal loading placeholder - lightweight version
 */
export const MinimalViewLoading: React.FC = () => {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ gap: 'var(--md-sys-spacing-4)', textAlign: "center" }}>
        <div style={{ width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', marginInline: 'var(--md-sys-margin-auto)', borderRadius: 'var(--md-sys-spacing-4)', display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-title-large-font-size)", color: "var(--md-sys-color-primary)" }}>hourglass_bottom</Box>
        </div>
        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Caricamento...</Typography>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for table/list views
 */
export const SkeletonListLoading: React.FC = () => {
  return (
    <div style={{gap: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-4)'}}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ borderRadius: 'var(--md-sys-shape-corner-large)' ,  height: 'var(--md-sys-spacing-12)' }} />
      ))}
    </div>
  );
};

/**
 * Preload hint - called on route navigation to prefetch next view
 */
export function useViewPreload(viewName: string): void {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger prefetch via dynamic import
      import('./viewRegistry/lazyViewLoader').then(mod => {
        if (mod.preloadView) {
          mod.preloadView(viewName as import('../types').View);
        }
      }).catch(err => {
        logger.warn('[view-preload] Failed to import lazy loader:', err);
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [viewName]);
}

export default ViewLoadingPlaceholder;

