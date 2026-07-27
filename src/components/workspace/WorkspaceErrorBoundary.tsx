/**
 * WorkspaceErrorBoundary.tsx  —  P23 Production Hardening / P27 Monitoring
 *
 * React class-component error boundary for the Orbit/Workspace render tree.
 * Catches any unhandled render / lifecycle error and shows a recoverable
 * MD3 fallback surface instead of a blank white screen.
 *
 * Logs every crash to:
 *   1. enterpriseAuditLog ('agent_failed') — PA compliance exports
 *   2. Sentry (via monitoring.captureError) — if VITE_SENTRY_DSN is set
 */

import React from 'react';
import Button     from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box        from '@mui/material/Box';
import M3Surface  from '../ui/M3Surface';
import { enterpriseAuditLog }                    from '../../services/enterprise/enterpriseAuditLog';
import { captureError, addBreadcrumb }           from '../../services/monitoring';

// ── State ─────────────────────────────────────────────────────────────────────

interface State {
  hasError: boolean;
  errorMessage: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export class WorkspaceErrorBoundary extends React.Component<
  React.PropsWithChildren<{ label?: string }>,
  State
> {
  constructor(props: React.PropsWithChildren<{ label?: string }>) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error);
    return { hasError: true, errorMessage: msg };
  }

  override componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    const label = this.props.label ?? 'workspace';
    const msg   = error instanceof Error ? error.message : String(error);
    const stack = info.componentStack?.split('\n').slice(0, 3).join(' | ') ?? '';

    // 1. Sentry capture — best-effort, privacy-gated via monitoring.ts
    try {
      addBreadcrumb('error-boundary', `crash in ${label}`, { msg });
      captureError(error, { boundary: label, stack });
    } catch { /* monitoring must never crash the boundary */ }

    // 2. Enterprise audit trail — PA compliance
    try {
      enterpriseAuditLog.record({
        action:    'agent_failed',
        agentRole: 'regulatory',
        sessionId: `crash_${Date.now().toString(36)}`,
        details:   { boundary: label, error: msg, stack },
      });
    } catch { /* audit log must never crash the boundary itself */ }

    // 3. Console in dev
    if (import.meta.env.DEV) {
      console.error(`[WorkspaceErrorBoundary:${label}]`, error, info.componentStack);
    }
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  override render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <M3Surface elevation={1}>
        <Box
          sx={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            2,
            p:              3,
            minHeight:      240,
            textAlign:      'center',
          }}
        >
          <Typography variant="titleMedium" aria-live="assertive">
            Si è verificato un errore nel workspace
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {this.state.errorMessage}
          </Typography>

          <Button
            variant="outlined"
            onClick={this.handleReload}
            aria-label="Ricarica il workspace"
          >
            Ricarica workspace
          </Button>
        </Box>
      </M3Surface>
    );
  }
}
