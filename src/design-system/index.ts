 
import { Theme, ColorTokens, DesignSystemDefinition } from '../types';
import { defaultLightTheme, defaultDarkTheme, hexToRgb, rgbToHsl, adjustColor, getLegibleTextColor, hexToRgbString } from './utils';

/**
 * The single source of truth for the design system definition.
 * It is immutable to prevent accidental changes at runtime.
 */
export const baseDesignSystem: Readonly<DesignSystemDefinition> = Object.freeze({
  version: '4.0.0-rc1',
  colors: {
    primary: { value: defaultLightTheme.colors.primary, description: 'The primary color for main interactive elements.', cssVar: '--md-sys-color-primary' },
    onPrimary: { value: defaultLightTheme.colors.onPrimary, description: 'Text and icons on top of the primary color.', cssVar: '--md-sys-color-on-primary' },
    primaryContainer: { value: defaultLightTheme.colors.primaryContainer, description: 'A container color derived from the primary color.', cssVar: '--md-sys-color-primary-container' },
    onPrimaryContainer: { value: defaultLightTheme.colors.onPrimaryContainer, description: 'Text and icons on top of the primary container color.', cssVar: '--md-sys-color-on-primary-container' },
    secondary: { value: defaultLightTheme.colors.secondary, description: 'The secondary color for less prominent elements.', cssVar: '--md-sys-color-secondary' },
    onSecondary: { value: defaultLightTheme.colors.onSecondary, description: 'Text and icons on top of the secondary color.', cssVar: '--md-sys-color-on-secondary' },
    secondaryContainer: { value: defaultLightTheme.colors.secondaryContainer, description: 'A container color derived from the secondary color.', cssVar: '--md-sys-color-secondary-container' },
    onSecondaryContainer: { value: defaultLightTheme.colors.onSecondaryContainer, description: 'Text and icons on top of the secondary container color.', cssVar: '--md-sys-color-on-secondary-container' },
    tertiary: { value: defaultLightTheme.colors.tertiary, description: 'The tertiary color for contrasting accents.', cssVar: '--md-sys-color-tertiary' },
    onTertiary: { value: defaultLightTheme.colors.onTertiary, description: 'Text and icons on top of the tertiary color.', cssVar: '--md-sys-color-on-tertiary' },
    tertiaryContainer: { value: defaultLightTheme.colors.tertiaryContainer, description: 'A container color derived from the tertiary color.', cssVar: '--md-sys-color-tertiary-container' },
    onTertiaryContainer: { value: defaultLightTheme.colors.onTertiaryContainer, description: 'Text and icons on top of the tertiary container color.', cssVar: '--md-sys-color-on-tertiary-container' },
    error: { value: defaultLightTheme.colors.error, description: 'Color for error states.', cssVar: '--md-sys-color-error' },
    onError: { value: defaultLightTheme.colors.onError, description: 'Text and icons on top of the error color.', cssVar: '--md-sys-color-on-error' },
    errorContainer: { value: defaultLightTheme.colors.errorContainer, description: 'A container color for error states.', cssVar: '--md-sys-color-error-container' },
    onErrorContainer: { value: defaultLightTheme.colors.onErrorContainer, description: 'Text and icons on top of the error container color.', cssVar: '--md-sys-color-on-error-container' },
    background: { value: defaultLightTheme.colors.background, description: 'The main background color of the app.', cssVar: '--md-sys-color-background' },
    onBackground: { value: defaultLightTheme.colors.onBackground, description: 'Text and icons on top of the background color.', cssVar: '--md-sys-color-on-background' },
    surface: { value: defaultLightTheme.colors.surface, description: 'The color of component surfaces like cards and menus.', cssVar: '--md-sys-color-surface' },
    onSurface: { value: defaultLightTheme.colors.onSurface, description: 'Text and icons on top of surface colors.', cssVar: '--md-sys-color-on-surface' },
    surfaceVariant: { value: defaultLightTheme.colors.surfaceVariant, description: 'A variant of the surface color for subtle differentiation.', cssVar: '--md-sys-color-surface-variant' },
    onSurfaceVariant: { value: defaultLightTheme.colors.onSurfaceVariant, description: 'Text and icons on top of surface variant colors.', cssVar: '--md-sys-color-on-surface-variant' },
    outline: { value: defaultLightTheme.colors.outline, description: 'Color for borders and dividers.', cssVar: '--md-sys-color-outline' },
    outlineVariant: { value: defaultLightTheme.colors.outlineVariant, description: 'A subtler color for borders and dividers.', cssVar: '--md-sys-color-outline-variant' },
    surfaceContainerLowest: { value: defaultLightTheme.colors.surfaceContainerLowest, description: 'Lowest emphasis surface color.', cssVar: '--md-sys-color-surface-container-lowest' },
    surfaceContainerLow: { value: defaultLightTheme.colors.surfaceContainerLow, description: 'Low emphasis surface color.', cssVar: '--md-sys-color-surface-container-low' },
    surfaceContainer: { value: defaultLightTheme.colors.surfaceContainer, description: 'Default emphasis surface color.', cssVar: '--md-sys-color-surface-container' },
    surfaceContainerHigh: { value: defaultLightTheme.colors.surfaceContainerHigh, description: 'High emphasis surface color.', cssVar: '--md-sys-color-surface-container-high' },
    surfaceContainerHighest: { value: defaultLightTheme.colors.surfaceContainerHighest, description: 'Highest emphasis surface color.', cssVar: '--md-sys-color-surface-container-highest' },
    surfaceDisabled: { value: defaultLightTheme.colors.surfaceDisabled, description: 'Color for disabled surfaces.', cssVar: '--md-sys-color-surface-disabled' },
  },
  typography: {
    displayLarge: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-display-large-font-size)', fontWeight: 'var(--md-sys-typescale-display-large-font-weight)', lineHeight: 'var(--md-sys-typescale-display-large-line-height)' }, description: 'Style for large, impactful display text.', cssVar: '--typography-display-large' },
    displayMedium: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-display-medium-font-size)', fontWeight: 'var(--md-sys-typescale-display-medium-font-weight)', lineHeight: 'var(--md-sys-typescale-display-medium-line-height)' }, description: 'Style for medium display text.', cssVar: '--typography-display-medium' },
    displaySmall: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-display-small-font-size)', fontWeight: 'var(--md-sys-typescale-display-small-font-weight)', lineHeight: 'var(--md-sys-typescale-display-small-line-height)' }, description: 'Style for small display text.', cssVar: '--typography-display-small' },
    headlineLarge: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-headline-large-font-size)', fontWeight: 'var(--md-sys-typescale-headline-large-font-weight)', lineHeight: 'var(--md-sys-typescale-headline-large-line-height)' }, description: 'Style for large headlines.', cssVar: '--typography-headline-large' },
    headlineMedium: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-headline-medium-font-size)', fontWeight: 'var(--md-sys-typescale-headline-medium-font-weight)', lineHeight: 'var(--md-sys-typescale-headline-medium-line-height)' }, description: 'Style for medium headlines.', cssVar: '--typography-headline-medium' },
    headlineSmall: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-headline-small-font-size)', fontWeight: 'var(--md-sys-typescale-headline-small-font-weight)', lineHeight: 'var(--md-sys-typescale-headline-small-line-height)' }, description: 'Style for small headlines.', cssVar: '--typography-headline-small' },
    titleLarge: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-title-large-font-weight)', lineHeight: 'var(--md-sys-typescale-title-large-line-height)' }, description: 'Style for large titles.', cssVar: '--typography-title-large' },
    titleMedium: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-title-medium-font-size)', fontWeight: 'var(--md-sys-typescale-title-medium-font-weight)', lineHeight: 'var(--md-sys-typescale-title-medium-line-height)' }, description: 'Style for medium titles.', cssVar: '--typography-title-medium' },
    titleSmall: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-title-small-font-size)', fontWeight: 'var(--md-sys-typescale-title-small-font-weight)', lineHeight: 'var(--md-sys-typescale-title-small-line-height)' }, description: 'Style for small titles.', cssVar: '--typography-title-small' },
    labelLarge: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-label-large-font-size)', fontWeight: 'var(--md-sys-typescale-label-large-font-weight)', lineHeight: 'var(--md-sys-typescale-label-large-line-height)' }, description: 'Style for large labels, like buttons.', cssVar: '--typography-label-large' },
    labelMedium: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-label-medium-font-size)', fontWeight: 'var(--md-sys-typescale-label-medium-font-weight)', lineHeight: 'var(--md-sys-typescale-label-medium-line-height)' }, description: 'Style for medium labels.', cssVar: '--typography-label-medium' },
    labelSmall: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-label-small-font-size)', fontWeight: 'var(--md-sys-typescale-label-small-font-weight)', lineHeight: 'var(--md-sys-typescale-label-small-line-height)' }, description: 'Style for small labels.', cssVar: '--typography-label-small' },
    bodyLarge: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-large-font-weight)', lineHeight: 'var(--md-sys-typescale-body-large-line-height)' }, description: 'Style for large body text.', cssVar: '--typography-body-large' },
    bodyMedium: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', lineHeight: 'var(--md-sys-typescale-body-medium-line-height)' }, description: 'Style for medium body text.', cssVar: '--typography-body-medium' },
    bodySmall: { value: { fontFamily: "'Roboto', sans-serif", fontSize: 'var(--md-sys-typescale-body-small-font-size)', fontWeight: 'var(--md-sys-typescale-body-small-font-weight)', lineHeight: 'var(--md-sys-typescale-body-small-line-height)' }, description: 'Style for small body text.', cssVar: '--typography-body-small' },
  },
  spacing: {
    '1': { value: 'var(--md-sys-spacing-1)', description: 'var(--md-sys-spacing-1)', cssVar: '--spacing-1' },
    '2': { value: 'var(--md-sys-spacing-2)', description: 'var(--md-sys-spacing-2)', cssVar: '--spacing-2' },
    '3': { value: 'var(--md-sys-spacing-3)', description: 'var(--md-sys-spacing-3)', cssVar: '--spacing-3' },
    '4': { value: 'var(--md-sys-spacing-4)', description: 'var(--md-sys-spacing-4)', cssVar: '--spacing-4' },
    '6': { value: 'var(--md-sys-spacing-6)', description: 'var(--md-sys-spacing-6)', cssVar: '--spacing-6' },
    '8': { value: 'var(--md-sys-spacing-8)', description: 'var(--md-sys-spacing-8)', cssVar: '--spacing-8' },
    '12': { value: 'var(--md-sys-spacing-12)', description: 'var(--md-sys-spacing-12)', cssVar: '--spacing-12' },
    '16': { value: 'var(--md-sys-spacing-16)', description: 'var(--md-sys-spacing-16)', cssVar: '--spacing-16' },
  }
});

/** Default light theme instance. */
export { defaultLightTheme };

/** Default dark theme instance. */
export { defaultDarkTheme };

// --- Main Functions (Moved from utils.ts) ---

const _generateRolePalette = (hexSeed: string, mode: 'light' | 'dark', role: 'primary' | 'secondary' | 'tertiary' | 'error') => {
    const rgb = hexToRgb(hexSeed);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    let mainL, contL;

    if (mode === 'light') {
        mainL = role === 'primary' ? 40 : (role === 'error' ? 40 : 50); 
        contL = 96; 
    } else {
        mainL = 80; 
        contL = 30; 
    }

    const mainHex = adjustColor(hsl.h, hsl.s, mainL);
    const containerHex = adjustColor(hsl.h, hsl.s, contL);

    const onMainHex = getLegibleTextColor(mainHex);
    const onContainerHex = getLegibleTextColor(containerHex);

    return {
        main: mainHex,
        container: containerHex,
        onMain: onMainHex,
        onContainer: onContainerHex
    };
};

const _generateNeutralPalette = (hexSeed: string, mode: 'light' | 'dark') => {
    const rgb = hexToRgb(hexSeed);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const neutralS = 4; 
    const variantS = 8;

    if (mode === 'light') {
        return {
            background: adjustColor(hsl.h, neutralS, 99),
            onBackground: adjustColor(hsl.h, neutralS, 10),
            surface: adjustColor(hsl.h, neutralS, 99),
            onSurface: adjustColor(hsl.h, neutralS, 10),
            surfaceVariant: adjustColor(hsl.h, variantS, 90), 
            onSurfaceVariant: adjustColor(hsl.h, variantS, 30),
            outline: adjustColor(hsl.h, variantS, 50),
            outlineVariant: adjustColor(hsl.h, variantS, 80),
            surfaceContainerLowest: adjustColor(hsl.h, neutralS, 100),
            surfaceContainerLow: adjustColor(hsl.h, neutralS, 96),
            surfaceContainer: adjustColor(hsl.h, neutralS, 94),
            surfaceContainerHigh: adjustColor(hsl.h, neutralS, 92),
            surfaceContainerHighest: adjustColor(hsl.h, neutralS, 90),
        };
    } else {
        return {
            background: adjustColor(hsl.h, neutralS, 6), 
            onBackground: adjustColor(hsl.h, neutralS, 90),
            surface: adjustColor(hsl.h, neutralS, 6),
            onSurface: adjustColor(hsl.h, neutralS, 90),
            surfaceVariant: adjustColor(hsl.h, variantS, 30), 
            onSurfaceVariant: adjustColor(hsl.h, variantS, 80),
            outline: adjustColor(hsl.h, variantS, 60),
            outlineVariant: adjustColor(hsl.h, variantS, 30),
            surfaceContainerLowest: adjustColor(hsl.h, neutralS, 4),
            surfaceContainerLow: adjustColor(hsl.h, neutralS, 10),
            surfaceContainer: adjustColor(hsl.h, neutralS, 12),
            surfaceContainerHigh: adjustColor(hsl.h, neutralS, 17),
            surfaceContainerHighest: adjustColor(hsl.h, neutralS, 22),
        };
    }
};

export const validateTheme = (theme: unknown): theme is Theme => {
  if (typeof theme !== 'object' || theme === null) return false;
  const themeObj = theme as Theme;
  if (!themeObj.mode || !themeObj.colors) return false;
  const baseColorKeys = Object.keys(baseDesignSystem.colors); 
  const themeColorKeys = Object.keys(themeObj.colors);
  return baseColorKeys.every(key => themeColorKeys.includes(key));
};

export const createTheme = (config: { 
    name: string; 
    mode: 'light' | 'dark'; 
    visualStyle?: 'aura' | 'flat' | 'minimal' | 'cupertino' | 'windows' | 'expressive';
    colors?: Partial<ColorTokens>;
    glassBlur?: number;
    radiusMultiplier?: number;
    fontScale?: number;
    contrastLevel?: number;
}): Theme => {
  const baseTheme = config.mode === 'light' ? defaultLightTheme : defaultDarkTheme;

  // Start from base theme and only override explicitly provided tokens
  const newColors: ColorTokens = { ...baseTheme.colors } as ColorTokens;
  if (config.colors) {
    for (const key in config.colors) {
      if (Object.prototype.hasOwnProperty.call(config.colors, key)) {
        const tokenKey = key as keyof ColorTokens;
        const value = config.colors[tokenKey];
        if (typeof value === 'string' && value.length > 0) {
          (newColors as Record<string, string>)[tokenKey] = value;
        }
      }
    }
  }

  return {
    name: config.name,
    mode: config.mode,
    visualStyle: config.visualStyle || baseTheme.visualStyle,
    colors: newColors,
    glassBlur: config.glassBlur ?? baseTheme.glassBlur,
    radiusMultiplier: config.radiusMultiplier ?? baseTheme.radiusMultiplier,
    fontScale: config.fontScale ?? baseTheme.fontScale,
    contrastLevel: config.contrastLevel ?? baseTheme.contrastLevel,
  };
};

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  const body = document.body;
  
  let themeToApply = theme;

  if (!validateTheme(theme)) {
    themeToApply = (theme as Partial<Theme>).mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
  }
  
  root.style.colorScheme = themeToApply.mode;
  root.setAttribute('data-visual-style', themeToApply.visualStyle || 'aura');

  // Apply dark mode via .theme-dark on documentElement (single mechanism, synced with theme.css)
  root.classList.toggle('theme-dark', themeToApply.mode === 'dark');

  // Remove any legacy mode classes still on body from previous architecture
  const legacyBodyClasses = Array.from(body.classList).filter(
    c => c === 'dark' || c === 'light' || c === 'theme-dark' || c === 'theme-light'
  );
  if (legacyBodyClasses.length > 0) body.classList.remove(...legacyBodyClasses);

  if (themeToApply.name) {
      const themeSlug = themeToApply.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      
      if (themeSlug && themeSlug !== themeToApply.mode) {
          body.classList.add(`theme-${themeSlug}`);
      }
  }

  // Parametric styling injection
  if (themeToApply.glassBlur !== undefined) {
    root.style.setProperty('--glass-blur-px', `${themeToApply.glassBlur}px`);
  }
  if (themeToApply.radiusMultiplier !== undefined) {
    root.style.setProperty('--md-sys-shape-scale-factor', themeToApply.radiusMultiplier.toString());
  }
  
  const fontScale = themeToApply.fontScale ?? 1;
  root.style.setProperty('--md-sys-typescale-font-scale', fontScale.toString());
  root.style.setProperty('--nav-rail-width', `${80 * fontScale}px`);

  if (themeToApply.contrastLevel !== undefined) {
    root.style.setProperty('--md-sys-accessibility-contrast-level', themeToApply.contrastLevel.toString());
    root.setAttribute('data-contrast-level', themeToApply.contrastLevel.toString());
  }
  
  for (const key in themeToApply.colors) {
    const tokenName = key as keyof ColorTokens;
    const tokenInfo = baseDesignSystem.colors[tokenName];
    if (tokenInfo) {
      const value = (themeToApply.colors as Record<string, string>)[tokenName];
      root.style.setProperty(tokenInfo.cssVar, value);
      
      const rgbValue = hexToRgbString(value);
      if (rgbValue) {
        root.style.setProperty(`${tokenInfo.cssVar}-rgb`, rgbValue);
      }
    }
  }

  for (const key in baseDesignSystem.typography) {
    const tokenName = key as keyof typeof baseDesignSystem.typography;
    const tokenInfo = baseDesignSystem.typography[tokenName];
    const tokenValue = tokenInfo.value as Record<string, string>;
    for (const prop in tokenValue) {
      root.style.setProperty(`${tokenInfo.cssVar}-${String(prop)}`, tokenValue[prop]);
    }
  }

  for (const key in baseDesignSystem.spacing) {
    const tokenName = key as keyof typeof baseDesignSystem.spacing;
    const tokenInfo = baseDesignSystem.spacing[tokenName];
    root.style.setProperty(tokenInfo.cssVar, tokenInfo.value);
  }

  // Visual style overrides — applied LAST so they win over base inline tokens.
  // These mirror the values in theme.css [data-visual-style="..."] blocks but must
  // also be set as inline styles because root.style.setProperty() (above) would
  // otherwise take precedence over CSS attribute-selector rules.
  const visualStyleOverrides: Partial<Record<string, Record<string, string>>> = {
    cupertino: {
      '--md-sys-color-primary': '#007AFF',
      '--md-sys-color-primary-rgb': '0, 122, 255',
      '--md-sys-shape-scale-factor': '0.8',
      '--md-sys-surface-alpha': '0.7',
    },
    windows: {
      '--md-sys-color-primary': '#0078D4',
      '--md-sys-color-primary-rgb': '0, 120, 212',
      '--md-sys-shape-scale-factor': '0.4',
      '--md-sys-surface-alpha': '0.85',
    },
    expressive: {
      '--md-sys-color-primary': '#1a73e8',
      '--md-sys-color-primary-rgb': '26, 115, 232',
      '--md-sys-shape-scale-factor': '1.2',
    },
    minimal: {
      '--md-sys-shape-scale-factor': '0.25',
    },
  };

  const vsStyle = themeToApply.visualStyle;
  if (vsStyle && visualStyleOverrides[vsStyle]) {
    const overrides = visualStyleOverrides[vsStyle]!;
    for (const [prop, value] of Object.entries(overrides)) {
      root.style.setProperty(prop, value);
    }
  }
};

