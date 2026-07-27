// CRITICAL: Initialize Performance API before React/Scheduler modules run
// NOTE: Now inlined in index.html as <script> tag, so we don't need to import pre-react-performance
// import './pre-react-performance';
// CRITICAL: Import polyfills FIRST, before anything else
// Polyfills handle DOM shims and performance fallbacks
import './polyfills';
import { logger } from './utils/logger';

// Initialize tracing lazily — OpenTelemetry packages are only loaded when the
// OTLP endpoint is configured (not at boot for normal users)
if (import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT) {
  import('./tracing');
}

// P27: Monitoring & Observability — Sentry + client metrics reporter
// initMonitoring() is privacy-gated: no-op when VITE_SENTRY_DSN is unset or
// when the user's privacy mode blocks external telemetry.
import { initMonitoring }       from './services/monitoring';
import { startMetricsReporter } from './services/apiMetrics';

// P28: Plan store sync — updates token limit when user.plan changes
import { syncPlanFromUser } from './stores/usePlanStore';
import { setTokenLimit }    from './modules/system/TokenController';
import { useSystemStore }   from './stores/useSystemStore';
// P29/P30: Built-in agent registrations + server sync
import { registerBuiltInAgents, syncAgentsFromServer } from './modules/agents/builtInAgents';

initMonitoring();
startMetricsReporter();

// Sync plan → TokenController whenever user signs in (or plan changes)
syncPlanFromUser();
useSystemStore.subscribe((state) => {
  const plan = state.user?.plan ?? 'free';
  setTokenLimit(plan === 'pro' ? 10_000 : 1_000);
});

// Register built-in agents locally, then sync with server registry (P30)
registerBuiltInAgents();
syncAgentsFromServer(); // best-effort, non-blocking

import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';

// CSS Architecture
import './theme.css';
import './logo.css';
import './global.css';
import './styles/orbit-brand.css';
import './styles/copilot-brand.css';

// Theme imports
import { M3ThemeProvider } from './theme/theme';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { buildMuiTheme } from './theme/muiTheme';
import { injectOrbitCssVars } from './theme/orbitTheme';

// Inject Orbit CSS custom properties into :root before first render
injectOrbitCssVars();
import { NKAProvider } from './nka/NKAProvider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useMemo, useState, useEffect } from 'react';
import { useSettingsStore } from './stores/useSettingsStore';
import { runRetentionCheck } from './utils/dataRetention';
import { hasPrivacyConsent } from './components/PrivacyConsentModal';
import { hasSovereigntyConfig } from './stores/useSovereigntyStore';
import { WorkflowEngine } from './core/workflows/WorkflowEngine';
import { registerBuiltinWorkflows } from './core/workflows/builtinWorkflows';

/**
 * STORAGE RECOVERY:
 * Rimuoviamo immediatamente dati pesanti legacy se presenti.
 */
(() => {
  try {
    const keys = ['app_state', 'orariodoc_backup'];
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data && data.length > 2 * 1024 * 1024) { 
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Intentionally ignore legacy storage cleanup errors
  }
})();

// GDPR B4 — data retention: purge AI artefacts older than 365 days
runRetentionCheck();

// Step 4 — Workflow Engine: register built-in workflows and start the engine
registerBuiltinWorkflows();
WorkflowEngine.start();

// Improved global error handlers.
// - Ignore errors originating from browser extensions (chrome-extension://)
// - Avoid blocking alerts (which break automated tests)
// - Log useful diagnostic info for local debugging
function isExtensionSource(src?: string | null) {
  return typeof src === 'string' && src.startsWith('chrome-extension://');
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (ev: ErrorEvent) => {
    try {
      if (isExtensionSource(ev.filename)) {
        // Ignore noisy extension-injected errors
          logger.debug('[main] ignored extension error', ev.message, ev.filename);
        ev.preventDefault?.();
        return;
      }
          logger.error('[main] window.error', ev.message, ev.filename, ev.lineno, ev.colno, ev.error?.stack || '');
    } catch (err) {
      // swallow to avoid cascading failures
      logger.error('[main] error handler failed', err);
    }
  });

  window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
    try {
      const reason = ev.reason;
      const stack = reason && typeof reason === 'object' ? (reason as { stack?: string }).stack : String(reason);
      if (stack && stack.indexOf('chrome-extension://') !== -1) {
        logger.debug('[main] ignored extension rejection', stack);
        ev.preventDefault?.();
        return;
      }
      logger.error('[main] unhandledrejection', reason);
    } catch (err) {
      logger.error('[main] unhandledrejection handler failed', err);
    }
  });
}

// PWA Service Worker registration is handled by vite-plugin-pwa in vite.config.ts
// with injectRegister: 'auto' which adds the registration script to index.html.

// Conditionally load Google Identity and API scripts only in production and when origin is allowed
(function loadGoogleScriptsIfAllowed() {
  try {
    const isProd = import.meta.env.PROD;
    const isDev = import.meta.env.DEV;
    const enableGsiDev = import.meta.env.VITE_ENABLE_GSI_DEV === 'true';
    const gsiClientId = import.meta.env.VITE_GSI_CLIENT_ID;

    // Allow listing for scripts and service worker registration.
    // Use VITE_ALLOWED_HOSTS env var as comma-separated list, fallback to known hosts.
      const envHosts = import.meta.env.VITE_ALLOWED_HOSTS || '';
      const allowedHosts = envHosts ? envHosts.split(',').map((s: string) => s.trim()).filter(Boolean) : ['docentedoc.app', 'your-production-domain.example'];
    const host = window.location.hostname;

    const shouldLoadGsi = (isProd && allowedHosts.includes(host)) || (isDev && enableGsiDev && !!gsiClientId);

    if (shouldLoadGsi) {
      const mode = isProd ? 'prod' : 'dev';
      const gsi = document.createElement('script');
      gsi.src = 'https://accounts.google.com/gsi/client';
      gsi.async = true;
      gsi.onload = () => { window.__googleGsiReady = true; logger.debug(`✅ Google GSI script loaded (${mode})`); };
      document.head.appendChild(gsi);

      const api = document.createElement('script');
      api.src = 'https://apis.google.com/js/api.js';
      api.async = true;
      api.onload = () => { window.__googleApiReady = true; logger.debug(`✅ Google API script loaded (${mode})`); };
      document.head.appendChild(api);
    } else {
      // Keep flags false in dev to avoid noisy 403s
      window.__googleApiReady = false;
      window.__googleGsiReady = false;
    }
  } catch (e) { logger.debug('Google script load gate error', e); }
})();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element missing");

const root = createRoot(rootElement);

// ── Instant dark-mode bootstrap ─────────────────────────────────────────────
// Apply the last-known mode BEFORE the first React render so the page never
// flashes the wrong theme.  Written each time the resolved mode changes.
(function applyStoredThemeMode() {
  try {
    const stored = localStorage.getItem('docente-ui-mode');
    if (stored === 'dark') document.documentElement.classList.add('theme-dark');
  } catch { /* ignore in SSR / private-mode browsers */ }
})();

/**
 * Reactive MUI ThemeProvider — reads mode from Zustand and rebuilds the MUI
 * theme when dark/light/system changes, so MUI-internal component colours
 * (hover overlays, ripples, select menus, etc.) are always in sync with the
 * active mode.  Uses useMemo so the theme object is only recreated on
 * mode changes.
 */
function AppMuiThemeWrapper({ children }: { children: React.ReactNode }) {
  const mode = useSettingsStore(s => s.themeState.mode);

  // Track OS dark-mode preference reactively (for mode === 'system')
  const mq = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  const [systemDark, setSystemDark] = useState(() => mq?.matches ?? false);
  useEffect(() => {
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedMode: 'light' | 'dark' =
    mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  const theme = useMemo(() => buildMuiTheme(resolvedMode), [resolvedMode]);

  // Phase 1.2: Sync CSS class with MUI theme in the same commit to eliminate
  // mixed-mode frames (MUI dark while CSS still light, or vice versa).
  // Also persist resolved mode to localStorage so the bootstrap snippet above
  // can apply .theme-dark instantly on the next page load (prevents FOWT).
  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', resolvedMode === 'dark');
    try { localStorage.setItem('docente-ui-mode', resolvedMode); } catch { /* ignore */ }
  }, [resolvedMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <Paper
      role="main"
      aria-label="Caricamento applicazione in corso"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'var(--md-sys-viewport-height-full)',
        gap: 4,
        p: 5,
      }}
    >
      <Typography variant="body1">
        Caricamento in corso...
      </Typography>
    </Paper>
  );
}

// Error fallback component
function ErrorFallback({ error: _error }: { error: Error }) {
  return (
    <Paper
      role="main"
      aria-label="Errore di inizializzazione applicazione"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'var(--md-sys-viewport-height-full)',
        gap: 4,
        p: 5,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5">
        Errore di Inizializzazione
      </Typography>
      <Typography variant="body1">
        Si è verificato un errore durante l'avvio dell'applicazione.
      </Typography>
      <Typography variant="body2">
        Aprire la console per maggiori dettagli.
      </Typography>
    </Paper>
  );
}

// Ensure Zustand stores are preloaded before importing the App
async function bootstrapApp() {
  try {
    // ── Landing page fast-path (no consent gate, no App bootstrap) ──────────
    if (window.location.pathname.startsWith('/landing')) {
      const { default: LandingPage } = await import('./pages/landing/LandingPage');
      root.render(
        <ErrorBoundary>
          <React.StrictMode>
            <AppMuiThemeWrapper>
              <M3ThemeProvider>
                <LandingPage />
              </M3ThemeProvider>
            </AppMuiThemeWrapper>
          </React.StrictMode>
        </ErrorBoundary>
      );
      return;
    }

    // ── Legal pages fast-path (no auth, no consent gate) ─────────────────────
    if (window.location.pathname === '/terms') {
      const { default: TermsPage } = await import('./pages/TermsPage');
      root.render(
        <ErrorBoundary>
          <React.StrictMode>
            <AppMuiThemeWrapper>
              <M3ThemeProvider>
                <TermsPage />
              </M3ThemeProvider>
            </AppMuiThemeWrapper>
          </React.StrictMode>
        </ErrorBoundary>
      );
      return;
    }

    if (window.location.pathname === '/privacy') {
      const { default: PrivacyPage } = await import('./pages/PrivacyPage');
      root.render(
        <ErrorBoundary>
          <React.StrictMode>
            <AppMuiThemeWrapper>
              <M3ThemeProvider>
                <PrivacyPage />
              </M3ThemeProvider>
            </AppMuiThemeWrapper>
          </React.StrictMode>
        </ErrorBoundary>
      );
      return;
    }

    // Show loading state
    root.render(
      <ErrorBoundary>
        <React.StrictMode>
          <AppMuiThemeWrapper>
            <M3ThemeProvider>
              <LoadingFallback />
            </M3ThemeProvider>
          </AppMuiThemeWrapper>
        </React.StrictMode>
      </ErrorBoundary>
    );

    const lazy = await import('./stores/lazyStores');

    // Kick off all chunk downloads in parallel with store preloading.
    // Stores must be ready before App *renders*, but not before App *downloads*.
    const appPromise        = import('./components/App');
    const modalProvPromise  = import('./contexts/ModalContext');
    const pilotaPromise     = import('./components/onboarding/PilotaOnboardingModal');
    const onboardingPromise = import('./components/onboarding/UnifiedOnboardingFlow');
    const teaserPromise     = import('./components/ui/OrbitTeaser');

    // preloadAllStores runs in parallel with the above downloads
    await lazy.preloadAllStores();

    // Downloads are now complete (or near-complete); destructure from cached promises
    const { App }                                        = await appPromise;
    const { ModalProvider }                              = await modalProvPromise;
    const { hasPilotOnboarding }                         = await pilotaPromise;
    const { default: UnifiedOnboardingFlow }             = await onboardingPromise;
    const { default: OrbitTeaser, hasSeenTeaser }        = await teaserPromise;

    /** Consent gate — percorso unico di 4 step (Benvenuto → Come funziono → Modalità AI → Privacy GDPR).
     *  Sostituisce la cascata PrivacyConsentModal → SovereigntyOnboarding → PilotaOnboardingModal
     *  con un singolo flusso che parte da un hook emotivo invece che dalle norme legali.
     *
     *  Gate completato quando TUTTI e 3 i flag sono presenti:
     *   1. privacy_consent_v1      (GDPR art. 13)
     *   2. sovereignty_config_v1   (modalità operativa AI)
     *   3. pilot_onboarding_v1     (intro sistema cognitivo)
     */
    function AppWithConsent() {
      const isTestMode = !!(window as unknown as { __TEST_MODE?: boolean }).__TEST_MODE
        || localStorage.getItem('__e2e_test_mode') === 'true';
      const [allDone, setAllDone] = useState(
        () => isTestMode || (hasPrivacyConsent() && hasSovereigntyConfig() && hasPilotOnboarding()),
      );
      const [teaserDone, setTeaserDone] = useState(
        () => isTestMode || hasSeenTeaser(),
      );
      if (!allDone) {
        return <UnifiedOnboardingFlow onComplete={() => setAllDone(true)} />;
      }
      if (!teaserDone) {
        return <OrbitTeaser onClose={() => setTeaserDone(true)} />;
      }
      return (
        <NKAProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </NKAProvider>
      );
    }

    root.render(
      <ErrorBoundary>
        <React.StrictMode>
          <AppMuiThemeWrapper>
            <M3ThemeProvider>
              <AppWithConsent />
            </M3ThemeProvider>
          </AppMuiThemeWrapper>
        </React.StrictMode>
      </ErrorBoundary>
    );
  } catch (e) {
    // Critical bootstrap error — log full stack and render a minimal fallback
    logger.error('[main] bootstrap failed', e);
    try {
      root.render(
        <ErrorBoundary>
          <React.StrictMode>
            <AppMuiThemeWrapper>
              <M3ThemeProvider>
                <ErrorFallback error={e as Error} />
              </M3ThemeProvider>
            </AppMuiThemeWrapper>
          </React.StrictMode>
        </ErrorBoundary>
      );
    } catch (renderErr) {
      logger.error('[main] render fallback failed', renderErr);
    }
  }
}

bootstrapApp();
