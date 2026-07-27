import { Theme, ColorTokens } from '../types'; // FIX: Updated import path to types


/**
 * DESIGN SYSTEM EXCEPTION: Base Color Token Definitions
 * 
 * These HEX color values are HARDCODED by design. They are the SOURCE OF TRUTH
 * for the Material Design 3 default color system. These values are used to:
 * 
 * 1. Generate CSS variables (--md-sys-color-primary, --md-sys-color-secondary, etc.)
 * 2. Define the design token system in src/design-system/index.ts
 * 3. Automatically switch between light and dark mode
 * 
 * These values MUST NOT be used directly in component code.
 * Instead, always use the generated CSS variables:
 *   ❌ WRONG: color: '#6750A4'
 *   ✅ RIGHT: color: 'var(--md-sys-color-primary)'
 * 
 * Documented in: docs/DESIGN_SYSTEM_CONSOLIDATION.md § 5 (Exceptions)
 */

// Source of Truth for raw color values in HEX
export const lightColors: ColorTokens = {
  primary: '#6750A4', onPrimary: '#FFFFFF', primaryContainer: '#EADDFF', onPrimaryContainer: '#21005D',
  secondary: '#625B71', onSecondary: '#FFFFFF', secondaryContainer: '#E8DEF8', onSecondaryContainer: '#1D192B',
  tertiary: '#7D5260', onTertiary: '#FFFFFF', tertiaryContainer: '#FFD8E4', onTertiaryContainer: '#31111D',
  error: '#B3261E', onError: '#FFFFFF', errorContainer: '#F9DEDC', onErrorContainer: '#410E0B',
  background: '#FFFBFE', onBackground: '#1C1B1F',
  surface: '#FFFBFE', onSurface: '#1C1B1F', surfaceVariant: '#E7E0EC', onSurfaceVariant: '#49454F',
  outline: '#79747E', outlineVariant: '#C4C7C5',
  surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#F7F2FA', surfaceContainer: '#F3EDF7', surfaceContainerHigh: '#ECE6F0', surfaceContainerHighest: '#E6E0E9',
  surfaceDisabled: 'rgba(28, 27, 31, 0.12)',
};

export const darkColors: ColorTokens = {
  primary: '#D0BCFF', onPrimary: '#381E72', primaryContainer: '#4F378B', onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC', onSecondary: '#332D41', secondaryContainer: '#4A4458', onSecondaryContainer: '#E8DEF8',
  tertiary: '#EFB8C8', onTertiary: '#492532', tertiaryContainer: '#633B48', onTertiaryContainer: '#FFD8E4',
  error: '#F2B8B5', onError: '#601410', errorContainer: '#8C1D18', onErrorContainer: '#F9DEDC',
  background: '#1C1B1F', onBackground: '#E6E1E5',
  surface: '#1C1B1F', onSurface: '#E6E1E5', surfaceVariant: '#49454F', onSurfaceVariant: '#CAC4D0',
  outline: '#938F99', outlineVariant: '#444746',
  surfaceContainerLowest: '#0F0D13', surfaceContainerLow: '#1C1B1F', surfaceContainer: '#201F23', surfaceContainerHigh: '#2B292D', surfaceContainerHighest: '#36343B',
  surfaceDisabled: 'rgba(230, 225, 229, 0.12)',
};

/** Default light theme instance. */
export const defaultLightTheme: Theme = {
  name: 'Default Light',
  mode: 'light',
  visualStyle: 'aura',
  colors: lightColors,
  glassBlur: 30,
  radiusMultiplier: 1,
  fontScale: 1,
  contrastLevel: 0,
};

/** Default dark theme instance. */
export const defaultDarkTheme: Theme = {
  name: 'Default Dark',
  mode: 'dark',
  visualStyle: 'aura',
  colors: darkColors,
  glassBlur: 30,
  radiusMultiplier: 1,
  fontScale: 1,
  contrastLevel: 0,
};

// --- Color Utilities ---

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }

export const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
};

export const hexToRgbString = (hex: string): string | null => {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : null;
};

export const rgbToHsl = (r: number, g: number, b: number): HSL => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; 
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const hslToRgb = (h: number, s: number, l: number): RGB => {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; 
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
};

export const adjustColor = (hue: number, saturation: number, lightness: number): string => {
    const rgb = hslToRgb(hue, saturation, lightness);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
};

export const getRelativeLuminance = (r: number, g: number, b: number): number => {
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;

    const R = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const G = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const B = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

export const getLegibleTextColor = (hexBackgroundColor: string): string => {
    const rgb = hexToRgb(hexBackgroundColor);
    if (!rgb) return '#000000'; 

    const bgLuminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
    
    const contrastWhite = (1.0 + 0.05) / (bgLuminance + 0.05);
    const contrastBlack = (bgLuminance + 0.05) / (0.0 + 0.05);

    return contrastBlack >= contrastWhite ? '#000000' : '#FFFFFF';
};

