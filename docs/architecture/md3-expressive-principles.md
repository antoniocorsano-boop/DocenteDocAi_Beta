# MD3 Expressive Principles

## Core Principles

Material Design 3 Expressive builds on MD3 foundations with enhanced emotional and adaptive design capabilities. It emphasizes:

- **Emotional Resonance**: Themes that evoke specific moods through coordinated token overrides.
- **Adaptive Flexibility**: Runtime theme switching without rebuilds.
- **Token Layering**: Hierarchical token system (sys/ref/comp) with motion, shape, and elevation extensions.
- **Accessibility First**: All expressive features must maintain WCAG compliance.

## Emotional Presets

Expressive themes include predefined emotional presets (calm, energetic, creative, etc.) that override multiple token layers simultaneously. These are not standalone themes but coordinated overrides applied to a base MD3 theme.

## Rationale

A single theme file cannot capture the multi-dimensional nature of expressive design, where colors, spacing, motion, and typography interact dynamically. Expressive requires a theme manager that handles layered overrides and runtime adaptation.