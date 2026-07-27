// MD3 Token Layers Definition
// All values use CSS variables or MD3 system values (no hardcoded values)

export type SysLayer = {
  colors: {
    primary: string;
    onPrimary: string;
    secondary: string;
    onSecondary: string;
    tertiary: string;
    onTertiary: string;
    surface: string;
    onSurface: string;
    background: string;
    onBackground: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    outline: string;
    surfaceContainerLow: string;
    primaryHover: string;
    // Additional MD3 colors
    surfaceContainerHigh: string;
    outlineVariant: string;
    error: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    scrim: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
  };
};

export type RefLayer = {
  spacing: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
  };
  typography: {
    body1: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing: string; };
    body2: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing: string; };
    heading1: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing: string; };
    heading2: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing: string; };
    caption: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing: string; };
    labelSmall: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing: string; };
    labelMedium: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing: string; };
    labelLarge: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing: string; };
  };
  shape: {
    small: string;
    medium: string;
    large: string;
  };
};

export type CompLayer = {
  // Component-specific overrides
  infoCard: {
    iconContainerSize: string;
    iconSize: string;
    buttonSize: string;
  };
  [key: string]: Record<string, string>;
};

export type MotionLayer = {
  easing: {
    standard: string;
    emphasized: string;
  };
  duration: {
    short1: string;
    short2: string;
    short3: string;
    short4: string;
    medium1: string;
    medium2: string;
    medium3: string;
    medium4: string;
  };
};

export type ElevationLayer = {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
};

// System layer: Core MD3 colors
export const sys: SysLayer = {
  colors: {
    primary: 'var(--md-sys-color-primary)',
    onPrimary: 'var(--md-sys-color-on-primary)',
    secondary: 'var(--md-sys-color-secondary)',
    onSecondary: 'var(--md-sys-color-on-secondary)',
    tertiary: 'var(--md-sys-color-tertiary)',
    onTertiary: 'var(--md-sys-color-on-tertiary)',
    surface: 'var(--md-sys-color-surface)',
    onSurface: 'var(--md-sys-color-on-surface)',
    background: 'var(--md-sys-color-background)',
    onBackground: 'var(--md-sys-color-on-background)',
    secondaryContainer: 'var(--md-sys-color-secondary-container)',
    onSecondaryContainer: 'var(--md-sys-color-on-secondary-container)',
    outline: 'var(--md-sys-color-outline)',
    surfaceContainerLow: 'var(--md-sys-color-surface-container-low)',
    primaryHover: 'var(--md-sys-color-primary-hover)',
    // Additional MD3 colors
    surfaceContainerHigh: 'var(--md-sys-color-surface-container-high)',
    outlineVariant: 'var(--md-sys-color-outline-variant)',
    error: 'var(--md-sys-color-error)',
    onError: 'var(--md-sys-color-on-error)',
    errorContainer: 'var(--md-sys-color-error-container)',
    onErrorContainer: 'var(--md-sys-color-on-error-container)',
    primaryContainer: 'var(--md-sys-color-primary-container)',
    onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',
    scrim: 'var(--md-sys-color-scrim)',
    surfaceVariant: 'var(--md-sys-color-surface-variant)',
    onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)',
  },
};

// Reference layer: Spacing and typography scales
export const ref: RefLayer = {
  spacing: {
    1: 'var(--md-sys-spacing-1)',
    2: 'var(--md-sys-spacing-2)',
    3: 'var(--md-sys-spacing-3)',
    4: 'var(--md-sys-spacing-4)',
    5: 'var(--md-sys-spacing-5)',
    6: 'var(--md-sys-spacing-6)',
    7: 'var(--md-sys-spacing-7)',
    8: 'var(--md-sys-spacing-8)',
    9: 'var(--md-sys-spacing-9)',
    10: 'var(--md-sys-spacing-10)',
    11: 'var(--md-sys-spacing-11)',
    12: 'var(--md-sys-spacing-12)',
  },
  typography: {
    body1: {
      fontSize: 'var(--md-sys-typescale-body-large-font-size)',
      lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
      fontWeight: 'var(--md-sys-typescale-body-large-font-weight)',
      letterSpacing: 'var(--md-sys-typescale-body-large-letter-spacing)',
    },
    body2: {
      fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
      lineHeight: 'var(--md-sys-typescale-body-medium-line-height)',
      fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)',
      letterSpacing: 'var(--md-sys-typescale-body-medium-letter-spacing)',
    },
    heading1: {
      fontSize: 'var(--md-sys-typescale-headline-large-font-size)',
      lineHeight: 'var(--md-sys-typescale-headline-large-line-height)',
      fontWeight: 'var(--md-sys-typescale-headline-large-font-weight)',
      letterSpacing: 'var(--md-sys-typescale-headline-large-letter-spacing)',
    },
    heading2: {
      fontSize: 'var(--md-sys-typescale-headline-medium-font-size)',
      lineHeight: 'var(--md-sys-typescale-headline-medium-line-height)',
      fontWeight: 'var(--md-sys-typescale-headline-medium-font-weight)',
      letterSpacing: 'var(--md-sys-typescale-headline-medium-letter-spacing)',
    },
    caption: {
      fontSize: 'var(--md-sys-typescale-body-small-font-size)',
      lineHeight: 'var(--md-sys-typescale-body-small-line-height)',
      fontWeight: 'var(--md-sys-typescale-body-small-font-weight)',
      letterSpacing: 'var(--md-sys-typescale-body-small-letter-spacing)',
    },
    labelSmall: {
      fontSize: 'var(--md-sys-typescale-label-small-font-size)',
      lineHeight: 'var(--md-sys-typescale-label-small-line-height)',
      fontWeight: 'var(--md-sys-typescale-label-small-font-weight)',
      letterSpacing: 'var(--md-sys-typescale-label-small-letter-spacing)',
    },
    labelMedium: {
      fontSize: 'var(--md-sys-typescale-label-medium-font-size)',
      lineHeight: 'var(--md-sys-typescale-label-medium-line-height)',
      fontWeight: 'var(--md-sys-typescale-label-medium-font-weight)',
      letterSpacing: 'var(--md-sys-typescale-label-medium-letter-spacing)',
    },
    labelLarge: {
      fontSize: 'var(--md-sys-typescale-label-large-font-size)',
      lineHeight: 'var(--md-sys-typescale-label-large-line-height)',
      fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
      letterSpacing: 'var(--md-sys-typescale-label-large-letter-spacing)',
    },
  },
  shape: {
    small: 'var(--md-sys-shape-corner-small)',
    medium: 'var(--md-sys-shape-corner-medium)',
    large: 'var(--md-sys-shape-corner-large)',
  },
};

// Component layer: Component-specific overrides
export const comp: CompLayer = {
  infoCard: {
    iconContainerSize: 'var(--md-sys-spacing-12)',
    iconSize: 'var(--md-sys-spacing-6)',
    buttonSize: 'var(--md-sys-spacing-10)',
  },
};

// Motion layer: Easing and duration values
export const motion: MotionLayer = {
  easing: {
    standard: 'var(--md-sys-motion-easing-standard)',
    emphasized: 'var(--md-sys-motion-easing-emphasized)',
  },
  duration: {
    short1: 'var(--md-sys-motion-duration-short1)',
    short2: 'var(--md-sys-motion-duration-short2)',
    short3: 'var(--md-sys-motion-duration-short3)',
    short4: 'var(--md-sys-motion-duration-short4)',
    medium1: 'var(--md-sys-motion-duration-medium1)',
    medium2: 'var(--md-sys-motion-duration-medium2)',
    medium3: 'var(--md-sys-motion-duration-medium3)',
    medium4: 'var(--md-sys-motion-duration-medium4)',
  },
};

// Elevation layer: Shadow levels
export const elevation: ElevationLayer = {
  level0: 'var(--md-sys-elevation-level0)',
  level1: 'var(--md-sys-elevation-level1)',
  level2: 'var(--md-sys-elevation-level2)',
  level3: 'var(--md-sys-elevation-level3)',
  level4: 'var(--md-sys-elevation-level4)',
  level5: 'var(--md-sys-elevation-level5)',
};

// Combined token layers
export type TokenLayers = {
  sys: SysLayer;
  ref: RefLayer;
  comp: CompLayer;
  motion: MotionLayer;
  elevation: ElevationLayer;
};

export const tokenLayers: TokenLayers = {
  sys,
  ref,
  comp,
  motion,
  elevation,
};

// Verification function: Ensures no color outside sys layer is hardcoded
// This function checks if a given color value is a valid CSS variable from the sys layer
export const verifySysColors = (colorValue: string): boolean => {
  const sysColorValues = Object.values(sys.colors);
  return sysColorValues.includes(colorValue) || colorValue.startsWith('var(--md-sys-color-');
};

// Verification function: Ensures motion durations do not exceed defined max
// This function checks if a duration value is within the defined motion duration tokens
export const verifyMotionDurations = (durationValue: string): boolean => {
  const motionDurationValues = Object.values(motion.duration);
  return motionDurationValues.includes(durationValue) || durationValue.startsWith('var(--md-sys-motion-duration-');
};