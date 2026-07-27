// MD3 Gold Compliant
import React, { Component, ErrorInfo, ReactNode } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useUIStore } from '../stores/useUIStore';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		logger.error('ErrorBoundary caught an error:', error, errorInfo);
        logger.error('ErrorBoundary: Full error stack:', error.stack);
		// For now, we'll just log it and show a user-friendly message
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return <ErrorFallback error={this.state.error} />;
		}

		return this.props.children;
	}
}

// Separate component to use hooks
const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => {
	const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));

	React.useEffect(() => {
		showToast("Si è verificato un errore imprevisto.", "error");
	}, [showToast]);

	return (
		<Box sx={{
			display: 'flex',
			flexDirection: 'column',
			gap: 'var(--md-sys-spacing-4)',
			alignItems: 'center',
			justifyContent: 'center',
			minHeight: '40vh',
			p: 'var(--md-sys-spacing-6)',
		}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
				<Box component="span" className="material-symbols-outlined" aria-hidden="true"
					sx={{ fontSize: 'var(--md-sys-icon-size-xl)', color: 'var(--md-sys-color-error)' }}>
					error
				</Box>
				<Typography variant="h6" component="h2">
					Qualcosa è andato storto
				</Typography>
			</Box>

			<Typography variant="body2" component="p" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', maxWidth: '480px' }}>
				Si è verificato un errore imprevisto. Puoi ricaricare la pagina oppure consultare la console (F12) per i dettagli.
			</Typography>

			<Button
				variant="contained"
				onClick={() => window.location.reload()}
				startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">refresh</Box>}
				aria-label="Ricarica la pagina"
			>
				Ricarica pagina
			</Button>

			{import.meta.env.DEV && error && (
				<details style={{ maxWidth: '640px', width: '100%' }}>
					<summary style={{ cursor: 'pointer', color: 'var(--md-sys-color-outline)' }}>
						Dettagli errore (solo in sviluppo)
					</summary>
					<pre style={{ fontSize: '12px', overflowX: 'auto', padding: 'var(--md-sys-spacing-3)', background: 'var(--md-sys-color-surface-container)' }}>
						{error.stack}
					</pre>
				</details>
			)}
		</Box>
	);
};

export { ErrorBoundary };
export default ErrorBoundary;

