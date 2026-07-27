
/**
 * PDF REPORT COLOR UTILITIES
 * 
 * These colors are used exclusively for PDF document generation via jsPDF library.
 * These are NOT CSS colors and do NOT participate in component styling rules.
 * 
 * PDF colors are:
 * - Fixed HEX values (not CSS variables, since jsPDF doesn't support var())
 * - Unaffected by dark mode or theme switching
 * - Independent from the design token system
 * - Only used in PDF export functionality
 * 
 * This file is EXCLUDED from the design-system/no-hardcoded-colors ESLint rule
 * to allow hardcoded values necessary for PDF generation.
 * 
 * @see docs/DESIGN_SYSTEM_CONSOLIDATION.md § 5 - "Exceptions & Overrides"
 */

export const PDF_COLORS = {
  // Header styling for table reports
  header: {
    background: '#6750A4',  // --md-sys-color-primary
    text: '#FFFFFF',        // --md-sys-color-on-primary
  },
  
  // Table row styling
  table: {
    evenRowBg: '#EADDFF',   // --md-sys-color-primary-container
    borderColor: 200,       // Grayscale for subtle borders
  },
  
  // Trend indicators for student progress
  trend: {
    positive: '#388E3C',    // Success color (not in MD3 tokens, keeping as semantic equivalent)
    negative: '#D32F2F',    // Error color (not in MD3 tokens, keeping as semantic equivalent)
    stable: '#757575',      // Outline variant equivalent
  },
  
  // Competency evaluation level badges
  competencyLevels: {
    A: { bg: '#FFD700', text: '#000000' },  // Gold - Advanced level (custom)
    B: { bg: '#C0C0C0', text: '#000000' },  // Silver - Intermediate level (custom)
    C: { bg: '#66BB6A', text: '#FFFFFF' },  // Green - Base level (success equivalent)
    D: { bg: '#EF5350', text: '#FFFFFF' },  // Red - Initial level (error equivalent)
  },
} as const;

/**
 * Get competency level badge colors
 * @param level - Competency level (A, B, C, D)
 * @returns Object with background and text colors for the level badge
 */
export function getCompetencyLevelColors(level: string | undefined): { bg: string; text: string } {
  if (!level || level === '-') {
    return { bg: '#E0E0E0', text: '#000000' };  // Default for missing level (neutral)
  }
  return PDF_COLORS.competencyLevels[level as keyof typeof PDF_COLORS.competencyLevels] ?? 
         { bg: '#E0E0E0', text: '#000000' };
}

/**
 * Get trend indicator color based on student progress direction
 * @param trend - Trend type (up, down, or other)
 * @returns Hex color code for the trend indicator
 */
export function getTrendColor(trend: string | undefined): string {
  switch (trend) {
    case 'up':
      return PDF_COLORS.trend.positive;
    case 'down':
      return PDF_COLORS.trend.negative;
    default:
      return PDF_COLORS.trend.stable;
  }
}

