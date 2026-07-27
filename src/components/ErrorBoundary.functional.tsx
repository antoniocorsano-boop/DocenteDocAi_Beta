// MD3 Compliant
import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { logger } from '../utils/logger';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => {
  const handleHardReset = () => {
  if (window.confirm("Questo cancellerà la cache locale per ripristinare l'app. I dati salvati su Drive sono al sicuro. Continuare?")) {
      localStorage.clear();
      window.location.reload();
    }
  };
  return (
    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', minHeight: "var(--md-sys-viewport-height-full)", display: "flex", alignItems: "center", justifyContent: "center", padding: 'var(--md-sys-spacing-6)'}}>
      <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', width: "var(--md-sys-percent-100)", backgroundColor: "var(--md-sys-color-surface)", padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", textAlign: "center"}}>
        <div style={{ width: 'var(--md-sys-spacing-16)', height: 'var(--md-sys-spacing-16)', backgroundColor: "var(--md-sys-color-error-container)", borderRadius: 'var(--md-sys-shape-corner-full)', display: "flex", alignItems: "center", justifyContent: "center", marginInline: 'var(--md-sys-margin-auto)', marginBottom: 'var(--md-sys-spacing-6)'}}>
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-error-container)', fontSize: 'var(--md-sys-typescale-headline-medium-font-size)' }}>error</Box>
        </div>
        <Typography component="h1" variant="h5" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: "var(--md-sys-typescale-weight-black)", marginBottom: 'var(--md-sys-spacing-2)'}}>Qualcosa è andato storto</Typography>
        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 'var(--md-sys-spacing-6)'}}>
          Si è verificato un errore imprevisto nell'interfaccia. Non preoccuparti, i tuoi dati sono al sicuro nel database locale.
        </Typography>
        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-4)', textAlign: "left", marginBottom: 'var(--md-sys-spacing-6)'}}>
          <Typography component="p" variant="body1" sx={{ margin: 'var(--md-sys-spacing-4)' , color: "var(--md-sys-color-error)"}}>{error.toString()}</Typography>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 'var(--md-sys-spacing-3)'}}>
          <Button variant="contained" onClick={resetErrorBoundary} sx={{ width: "var(--md-sys-percent-100)", justifyContent: "center" }}>
            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ marginRight: 'var(--md-sys-spacing-2)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>refresh</Box> Ricarica App
          </Button>
          <Button variant="outlined" onClick={handleHardReset} sx={{ width: "var(--md-sys-percent-100)", justifyContent: "center" }}>
            Reset Totale (Emergenza)
          </Button>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ErrorBoundary caught:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

/*
// NOTE: react-error-boundary not installed - using class-based approach above instead
const _ErrorFallbackUnused: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => {
  const handleHardReset = () => {
  if (window.confirm("Questo cancellerà la cache locale per ripristinare l'app. I dati salvati su Drive sono al sicuro. Continuare?")) {
      localStorage.clear();
      window.location.reload();
    }
  };
  return (
    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', minHeight: "var(--md-sys-viewport-height-full)", display: "flex", alignItems: "center", justifyContent: "center", padding: 'var(--md-sys-spacing-6)'}}>
      <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', width: "var(--md-sys-percent-100)", backgroundColor: "var(--md-sys-color-surface)", padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", textAlign: "center"}}>
        <div style={{ color: 'var(--md-sys-color-on-error-container)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', backgroundColor: "var(--md-sys-color-error)", borderRadius: 'var(--md-sys-spacing-4)', display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)", marginBottom: 'var(--md-sys-spacing-6)'}}>
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-error)' }}>dizzy</Box>
        </div>
        <Typography component="h1" variant="h5" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", marginBottom: 'var(--md-sys-spacing-2)'}}>Qualcosa è andato storto</Typography>
        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 'var(--md-sys-spacing-6)'}}>
          Si è verificato un errore imprevisto nell'interfaccia. Non preoccuparti, i tuoi dati sono al sicuro nel database locale.
        </Typography>
        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-4)', textAlign: "left", marginBottom: 'var(--md-sys-spacing-6)'}}>
          <Typography component="p" variant="body1" sx={{ margin: 'var(--md-sys-spacing-4)' , color: "var(--md-sys-color-error)"}}>{error.toString()}</Typography>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 'var(--md-sys-spacing-3)'}}>
          <button onClick={resetErrorBoundary}  style={{ width: "var(--md-sys-percent-100)", justifyContent: "center" }}>
            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ marginRight: "var(--md-sys-spacing-2)" }}>refresh</Box> Ricarica App
          </button>
          <button onClick={handleHardReset}  style={{ width: "var(--md-sys-percent-100)", justifyContent: "center" }}>
            Reset Totale (Emergenza)
          </button>
        </div>
      </div>
    </div>
  );
};

// Modern ErrorBoundary using react-error-boundary (recommended for functional React)
// import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { logger } from '../utils/logger';
// NOT USED: react-error-boundary not installed
*/
