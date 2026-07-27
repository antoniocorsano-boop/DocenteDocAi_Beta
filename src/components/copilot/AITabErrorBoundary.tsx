/**
 * AITabErrorBoundary.tsx
 *
 * Lightweight error boundary for individual Copilot sub-tabs.
 * Prevents a crash in one AI panel from collapsing the entire CopilotDocentePanel.
 * Shows an inline MD3-compliant error card with a retry button (no full-page reload).
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import { logger } from '../../utils/logger';

interface Props {
  /** Label shown in the error message, e.g. "Performance" */
  tabName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AITabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error(`[AITabErrorBoundary] Tab "${this.props.tabName}" crashed:`, error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <Stack spacing={2} sx={{ p: 'var(--md-sys-spacing-4)' }}>
        <Alert
          severity="error"
          action={
            <Button
              size="small"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={this.handleRetry}
              aria-label={`Riprova pannello ${this.props.tabName}`}
            >
              Riprova
            </Button>
          }
        >
          <Typography variant="bodySmall">
            Il pannello <strong>{this.props.tabName}</strong> ha incontrato un errore imprevisto.
            I dati della classe non sono stati modificati.
          </Typography>
        </Alert>
        {import.meta.env.DEV && this.state.error && (
          <details>
            <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
              Dettagli errore (solo in sviluppo)
            </summary>
            <pre style={{ fontSize: '0.7rem', marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--md-sys-color-error)' }}>
              {this.state.error.stack}
            </pre>
          </details>
        )}
      </Stack>
    );
  }
}
