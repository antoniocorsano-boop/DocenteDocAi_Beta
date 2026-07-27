/**
 * theme/orbitTokens.ts
 *
 * Orbit Design Tokens — Jarvis presence, density, and motion tokens.
 *
 * All values reference CSS custom properties — no hardcoded colours or pixel
 * values. This keeps the layer theme-agnostic and M3-Gold compliant.
 *
 * Design:
 *   - Three density modes: compact / comfortable / expansive
 *   - Motion tokens for Jarvis presence animations
 *   - Spacing scale derived from the MD3 spacing reference layer
 *   - Orbit-specific semantic color aliases (re-mapped from MD3 system colors)
 */

// ─── Density modes ────────────────────────────────────────────────────────────

export type OrbitDensity = 'compact' | 'comfortable' | 'expansive';

/**
 * Spacing scale per density mode.
 * Values are CSS var() references (token-safe — no rem/px literals).
 */
export const ORBIT_SPACING: Record<OrbitDensity, {
  itemGap:     string;
  sectionGap:  string;
  cardPadding: string;
  orbSize:     string;
}> = {
  compact: {
    itemGap:     'var(--md-sys-spacing-1, 4px)',
    sectionGap:  'var(--md-sys-spacing-2, 8px)',
    cardPadding: 'var(--md-sys-spacing-2, 8px)',
    orbSize:     '32px',
  },
  comfortable: {
    itemGap:     'var(--md-sys-spacing-2, 8px)',
    sectionGap:  'var(--md-sys-spacing-4, 16px)',
    cardPadding: 'var(--md-sys-spacing-3, 12px)',
    orbSize:     '40px',
  },
  expansive: {
    itemGap:     'var(--md-sys-spacing-3, 12px)',
    sectionGap:  'var(--md-sys-spacing-6, 24px)',
    cardPadding: 'var(--md-sys-spacing-4, 16px)',
    orbSize:     '56px',
  },
} as const;

// ─── Motion tokens ────────────────────────────────────────────────────────────

/** CSS keyframe animation durations for Jarvis presence states. */
export const ORBIT_MOTION = {
  /** Duration for the idle ambient glow pulse */
  idlePulseDuration:       '3s',
  /** Duration for suggestion / learning state pulse */
  activePulseDuration:     '1.5s',
  /** Duration for cinematic processing ring spin */
  processingSpinDuration:  '1s',
  /** Easing for state transitions */
  transitionEasing:        'cubic-bezier(0.2, 0, 0, 1)',
  /** Duration for panel slide-in/out */
  panelTransitionDuration: '280ms',
  /** Duration for card fade-in */
  cardFadeInDuration:      '200ms',
} as const;

// ─── Orbit semantic color aliases ─────────────────────────────────────────────

/**
 * Orbit-level semantic aliases over MD3 system colors.
 * References var() — never direct hex/rgb.
 */
export const ORBIT_COLORS = {
  /** Primary accent for Jarvis orb and active states */
  jarvisAccent:     'var(--md-sys-color-primary)',
  /** Background for Jarvis control surfaces */
  jarvisSurface:    'var(--md-sys-color-surface-container)',
  /** Color for ambient / background automation indicators */
  ambientIndicator: 'var(--md-sys-color-tertiary)',
  /** Color for silent / stealth automation indicators */
  silentIndicator:  'var(--md-sys-color-outline)',
  /** Flow step chip color */
  flowChip:         'var(--md-sys-color-surface-container-high)',
  /** Trust score healthy */
  trustHealthy:     'var(--md-sys-color-secondary-container)',
  /** Trust score low */
  trustLow:         'var(--md-sys-color-error-container)',
} as const;

// ─── Presence breakpoints ─────────────────────────────────────────────────────

/**
 * Viewport widths at which Jarvis presence adapts.
 * Narrower than MOBILE_THRESHOLD: ambient layer only.
 * Between thresholds: assistant mode.
 * Above DESKTOP_THRESHOLD: full cinematic mode available.
 */
export const ORBIT_PRESENCE_BREAKPOINTS = {
  MOBILE_THRESHOLD:  600,  // px — same as MD3 compact layout threshold
  DESKTOP_THRESHOLD: 1240, // px — MD3 expanded layout threshold
} as const;

// ─── Background gradient tokens (Fase 2 — Orbit DS) ──────────────────────────

/**
 * Soft gradient backgrounds for fullscreen Orbit surfaces.
 * Uses CSS var() fallbacks to MD3 system colors — never hardcoded hex.
 */
export const ORBIT_BACKGROUND = {
  /** Landing overlays (ScheduleLanding, ClassLanding, LessonLanding) */
  landing: 'linear-gradient(160deg, var(--md-sys-color-surface-container-lowest, #F7F2FA) 0%, var(--md-sys-color-surface-container, #ECE6F0) 100%)',
  /** PlanCard surface background */
  plan:    'linear-gradient(135deg, var(--md-sys-color-primary-container, #EADDFF) 0%, var(--md-sys-color-surface-container-low, #F3EDF7) 100%)',
  /** OrbitDock / bottom sheet background */
  dock:    'linear-gradient(180deg, var(--md-sys-color-surface-container-high, #E6E0E9) 0%, var(--md-sys-color-surface, #FFFBFE) 100%)',
} as const;

// ─── Teaser tokens (Fase 2 — Orbit DS) ────────────────────────────────────────

/**
 * Color tokens for the OrbitTeaser walkthrough and nudge surfaces.
 */
export const ORBIT_TEASER = {
  /** Teaser backdrop */
  background: 'linear-gradient(160deg, var(--md-sys-color-surface-container-lowest, #F7F2FA) 0%, var(--md-sys-color-primary-container, #EADDFF) 60%, var(--md-sys-color-surface-container, #ECE6F0) 100%)',
  /** Accent for CTA buttons in teaser */
  accent:     'var(--md-sys-color-primary)',
  /** Muted text for slide subtitles */
  muted:      'var(--md-sys-color-on-surface-variant)',
  /** Dot indicator — inactive */
  dotInactive: 'var(--md-sys-color-outline-variant)',
  /** Dot indicator — active */
  dotActive:   'var(--md-sys-color-primary)',
} as const;

// ─── Step state tokens (Fase 2 — Orbit DS) ────────────────────────────────────

/**
 * Color tokens for PlanCard step indicators.
 * Referenced via CSS custom properties injected by orbitTheme.ts.
 */
export const ORBIT_STEP_COLORS = {
  /** Currently active / in-progress step */
  current:   'var(--orbit-step-current, var(--md-sys-color-primary))',
  /** Completed step */
  completed: 'var(--orbit-step-completed, var(--md-sys-color-secondary))',
  /** Not yet reached step */
  pending:   'var(--orbit-step-pending, var(--md-sys-color-outline-variant))',
} as const;
