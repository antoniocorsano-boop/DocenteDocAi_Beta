/**
 * src/services/monitoring.ts — P27 Monitoring & Observability
 *
 * Sentry SDK initialization + helpers for error/event capture.
 *
 * Activation:
 *   Set VITE_SENTRY_DSN in .env.local.
 *   Leave empty (or unset) to run silently in no-op mode (dev default).
 *
 * Privacy integration:
 *   Sentry is only activated when canLogExternally() returns true
 *   (i.e. the user's privacy mode is 'enhanced').
 *   In 'strict' and 'balanced' modes, events are logged locally only.
 *
 * Observability wiring:
 *   Registers an ObserverCallback so pure system modules (TokenController,
 *   PrivacyGuard, SimulationGuard) emit Sentry breadcrumbs without importing
 *   Sentry directly.
 *
 * Usage:
 *   // In main.tsx — call once before ReactDOM.render:
 *   initMonitoring();
 *
 *   // Anywhere in the app:
 *   import { captureError, captureMessage, addBreadcrumb } from '@/services/monitoring';
 */

import * as Sentry from '@sentry/react';
import { registerObserver, type ObservePayload } from '@/utils/observability';
import { canLogExternally }                       from '@/modules/system/PrivacyGuard';

// ─── State ────────────────────────────────────────────────────────────────────

let _enabled = false;

const DSN    = (import.meta.env.VITE_SENTRY_DSN as string | undefined) || '';
const IS_DEV = import.meta.env.DEV as boolean;

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Initialise Sentry if:
 *   1. VITE_SENTRY_DSN is configured, AND
 *   2. The user's privacy mode permits external logging.
 *
 * Must be called once, as early as possible in main.tsx.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initMonitoring(): void {
  if (_enabled) return;

  if (!DSN) {
    // No DSN configured — run in silent/no-op mode. Normal for local dev.
    if (IS_DEV) console.debug('[monitoring] VITE_SENTRY_DSN not set — Sentry disabled');
    return;
  }

  if (!canLogExternally()) {
    // Privacy mode blocks external telemetry (strict / balanced).
    if (IS_DEV) console.debug('[monitoring] Sentry disabled — privacy mode blocks external logging');
    return;
  }

  Sentry.init({
    dsn:              DSN,
    environment:      IS_DEV ? 'development' : 'production',
    release:          (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'unknown',
    debug:            IS_DEV,
    // Low sample rate in production to control costs
    tracesSampleRate: IS_DEV ? 1.0 : 0.05,
    // Never send PII-laden URL fragments
    sendDefaultPii:   false,
  });

  _enabled = true;

  if (IS_DEV) console.info('[monitoring] Sentry initialised', { dsn: DSN.slice(0, 30) + '…' });

  // Wire system-module observability events into Sentry breadcrumbs
  registerObserver((payload: ObservePayload) => {
    const sentryLevel = payload.level === 'warn'  ? 'warning'
                      : payload.level === 'error' ? 'error'
                      : payload.level === 'debug' ? 'debug'
                      : 'info';

    Sentry.addBreadcrumb({
      category: 'orbit',
      message:  payload.event,
      data:     payload.data,
      level:    sentryLevel,
    });
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true if Sentry was successfully initialised.
 */
export function isMonitoringEnabled(): boolean {
  return _enabled;
}

/**
 * Captures an exception in Sentry.
 * Includes additional context as Sentry "extras" (key/value pairs).
 * Safe to call even when Sentry is disabled — becomes a no-op.
 */
export function captureError(
  error:   unknown,
  context?: Record<string, unknown>,
): void {
  if (!_enabled) return;
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

/**
 * Captures a custom message in Sentry at the given severity level.
 * Defaults to 'info'. Safe to call when Sentry is disabled.
 */
export function captureMessage(
  message: string,
  level:   Sentry.SeverityLevel = 'info',
): void {
  if (!_enabled) return;
  Sentry.captureMessage(message, level);
}

/**
 * Manually adds a Sentry breadcrumb.
 * Breadcrumbs appear in the Sentry event detail to explain the lead-up.
 * Safe to call when Sentry is disabled.
 */
export function addBreadcrumb(
  category: string,
  message:  string,
  data?:    Record<string, unknown>,
): void {
  if (!_enabled) return;
  Sentry.addBreadcrumb({ category, message, data, level: 'info' });
}
