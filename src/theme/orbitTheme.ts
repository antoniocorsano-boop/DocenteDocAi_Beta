/**
 * theme/orbitTheme.ts
 *
 * Orbit Design System — CSS custom property injector.
 *
 * Responsabilità:
 *   - Definisce i CSS custom property Orbit-specifici (--orbit-*)
 *   - Li inietta in :root una volta sola (idempotente)
 *   - Fornisce varianti light/dark per step state tokens
 *
 * Uso:
 *   import { injectOrbitCssVars } from '@/theme/orbitTheme';
 *   // Chiamare una volta in main.tsx o nel provider più esterno
 *   injectOrbitCssVars();
 *
 * Tutti i valori di fallback referenziano var(--md-sys-color-*) per mantenere
 * la compatibilità MD3 Gold Compliant senza duplicare valori cromatici.
 */

// ─── CSS custom properties map ────────────────────────────────────────────────

/**
 * Map of Orbit-specific CSS custom properties and their default values.
 * Values use MD3 var() fallbacks — never hardcoded hex/rgb.
 */
export const ORBIT_CSS_VARS: Record<string, string> = {
  // ── Background gradients ──────────────────────────────────────────────────
  '--orbit-bg-landing':
    'linear-gradient(160deg, var(--md-sys-color-surface-container-lowest) 0%, var(--md-sys-color-surface-container) 100%)',
  '--orbit-bg-plan':
    'linear-gradient(135deg, var(--md-sys-color-primary-container) 0%, var(--md-sys-color-surface-container-low) 100%)',
  '--orbit-bg-dock':
    'linear-gradient(180deg, var(--md-sys-color-surface-container-high) 0%, var(--md-sys-color-surface) 100%)',
  '--orbit-bg-teaser':
    'linear-gradient(160deg, var(--md-sys-color-surface-container-lowest) 0%, var(--md-sys-color-primary-container) 60%, var(--md-sys-color-surface-container) 100%)',

  // ── Step state indicators ─────────────────────────────────────────────────
  '--orbit-step-current':   'var(--md-sys-color-primary)',
  '--orbit-step-completed': 'var(--md-sys-color-secondary)',
  '--orbit-step-pending':   'var(--md-sys-color-outline-variant)',

  // ── Teaser accent ─────────────────────────────────────────────────────────
  '--orbit-teaser-accent':        'var(--md-sys-color-primary)',
  '--orbit-teaser-muted':         'var(--md-sys-color-on-surface-variant)',
  '--orbit-teaser-dot-inactive':  'var(--md-sys-color-outline-variant)',
  '--orbit-teaser-dot-active':    'var(--md-sys-color-primary)',

  // ── Presence ring ─────────────────────────────────────────────────────────
  '--orbit-ring-idle':       'var(--md-sys-color-outline-variant)',
  '--orbit-ring-thinking':   'var(--md-sys-color-tertiary)',
  '--orbit-ring-active':     'var(--md-sys-color-primary)',
  '--orbit-ring-suggestion': 'var(--md-sys-color-secondary)',
};

// ─── Dark mode overrides ───────────────────────────────────────────────────────

/**
 * Overrides applied when `.theme-dark` class is on `<html>`.
 * These complement the MD3 dark palette without duplicating color values.
 */
export const ORBIT_CSS_VARS_DARK: Record<string, string> = {
  '--orbit-bg-landing': 'linear-gradient(160deg, var(--md-sys-color-surface-container) 0%, var(--md-sys-color-surface-container-high) 100%)',
  '--orbit-bg-plan':    'linear-gradient(135deg, var(--md-sys-color-primary-container) 0%, var(--md-sys-color-surface-container) 100%)',
  '--orbit-bg-dock':    'linear-gradient(180deg, var(--md-sys-color-surface-container-high) 0%, var(--md-sys-color-surface-container-low) 100%)',
  '--orbit-bg-teaser':  'linear-gradient(160deg, var(--md-sys-color-surface-container) 0%, var(--md-sys-color-primary-container) 50%, var(--md-sys-color-surface-container-high) 100%)',
};

// ─── Injector ─────────────────────────────────────────────────────────────────

let _injected = false;

/**
 * Injects Orbit CSS custom properties into `:root` (and `.theme-dark`).
 * Idempotent — safe to call multiple times; only executes once.
 *
 * Call this once at app bootstrap (main.tsx) before the first render.
 */
export function injectOrbitCssVars(): void {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;

  const style = document.createElement('style');
  style.dataset['orbitTheme'] = '1';

  const rootRules = Object.entries(ORBIT_CSS_VARS)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n');

  const darkRules = Object.entries(ORBIT_CSS_VARS_DARK)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n');

  style.textContent = `:root {\n${rootRules}\n}\n.theme-dark {\n${darkRules}\n}`;
  document.head.appendChild(style);
}
