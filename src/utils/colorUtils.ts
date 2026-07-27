// Removed unused ColorTokens import


/**
 * DESIGN SYSTEM EXCEPTION: Avatar Color Palettes
 * This is used to create a unique color for each class name (timetable slots).
 */
export const generateHueFromString = (str: string): number => {
  let hash = 0;
  const len = str.length;
  
  if (len === 0) return 0;

  for (let i = 0; i < len; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Additional mixing for short strings
  if (len < 5) {
      const lastChar = str.charCodeAt(len - 1);
      const firstChar = str.charCodeAt(0);
      hash = hash * 13 + lastChar * 157 + firstChar * 31;
  }

  return Math.abs(hash % 360);
};

// M3 EXPRESSIVE CONTAINER PALETTE (DESIGN SYSTEM EXCEPTION)
// These are HARDCODED by design as they represent Material Design 3's
// predefined expressive color containers used for avatar backgrounds.
// Pastel/Light backgrounds with Dark contrasting text.
// Better for readability and fits the modern M3 look.
// 
  // These are NOT used in component styling—use var(--md-sys-color-*) tokens instead.
// Exception documented in: docs/DESIGN_SYSTEM_CONSOLIDATION.md § 5
const AVATAR_PALETTES = [
    { bg: '#EADDFF', text: '#21005D' }, // --md-sys-color-primary-container / --md-sys-color-on-primary-container
    { bg: '#E8DEF8', text: '#1D192B' }, // --md-sys-color-secondary-container / --md-sys-color-on-secondary-container
    { bg: '#FFD8E4', text: '#31111D' }, // --md-sys-color-tertiary-container / --md-sys-color-on-tertiary-container
    { bg: '#FFDBCF', text: '#380D00' }, // Orange Container (custom)
    { bg: '#C4EED0', text: '#07210F' }, // Green Container (custom)
    { bg: '#D7E3FF', text: '#001B3D' }, // Blue Container (custom)
    { bg: '#E0E0FF', text: '#00006E' }, // Indigo Container (custom)
    { bg: '#FFD9E3', text: '#3E001D' }, // Rose Container (custom)
    { bg: '#F2DDA6', text: '#261900' }, // Yellow Container (custom)
    { bg: '#CBE6FF', text: '#001E30' }, // Cyan Container (custom)
    { bg: '#E6E0E9', text: '#1D1B20' }, // --md-sys-color-surface-variant / --md-sys-color-on-surface-variant
    { bg: '#F9DEDC', text: '#410E0B' }, // --md-sys-color-error-container / --md-sys-color-on-error-container
];

/**
 * Returns a set of harmonious M3 Container colors for an avatar based on a string.
 * Guarantees accessible contrast (Dark Text on Light Background).
 */
export const getAvatarColors = (str: string): { bg: string; textColor: string } => {
    if (!str) return { bg: AVATAR_PALETTES[0].bg, textColor: AVATAR_PALETTES[0].text };
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash % AVATAR_PALETTES.length);
    return { bg: AVATAR_PALETTES[index].bg, textColor: AVATAR_PALETTES[index].text };
};

