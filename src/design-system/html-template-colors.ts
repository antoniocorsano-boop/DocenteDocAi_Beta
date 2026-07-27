 

/**
 * HTML TEMPLATE COLOR UTILITIES
 * 
 * These colors are used in HTML template strings for document generation.
 * These are NOT CSS colors used in React components�they are part of
 * generated document content via jsPDF, HTML export, etc.
 * 
 * HTML template colors are:
 * - Hardcoded HEX values in template strings (not CSS variables)
 * - Embedded in generated documents (not affected by dark mode)
 * - Part of document data, not component styling
 * - Used by: DocumentGenerator, PDF exports, HTML reports
 * 
 * This file is EXCLUDED from the design-system/no-hardcoded-colors ESLint rule.
 * @see docs/DESIGN_SYSTEM_CONSOLIDATION.md � 5 - "Exceptions & Overrides"
 */

export const HTML_TEMPLATE_COLORS = {
  // Header and title styling
  headers: {
    primary: 'var(--md-sys-color-primary)',      // Blue - for main titles
    accent: 'var(--md-sys-color-primary-container)',       // Light blue background
  },
  
  // Text colors
  text: {
    primary: 'var(--md-sys-color-on-surface)',      // Dark gray - main text
    secondary: 'var(--md-sys-color-on-surface-variant)',    // Medium gray - secondary text
    footer: 'var(--md-sys-color-on-surface-variant)',       // Gray - footer text
  },
  
  // Table and structure colors
  structure: {
    headerBg: 'var(--md-sys-color-surface-variant)',     // Light blue for header backgrounds
    borderColor: 'var(--md-sys-color-outline-variant)',  // Light gray for borders
  },
} as const;

/**
 * Generate styled header HTML for document templates
 * @param title - Header title text
 * @returns HTML string with styled header
 */
export function getStyledHeader(title: string): string {
  return `<h1 style="text-align: center; color: ${HTML_TEMPLATE_COLORS.headers.primary};">${title}</h1><hr/>`;
}

/**
 * Generate styled footer HTML for document templates
 * @param text - Footer text (can include placeholders like {{data}})
 * @returns HTML string with styled footer
 */
export function getStyledFooter(text: string): string {
  // Font size matches --md-sys-typescale-footnote-size token (10px)
  return `<p style="text-align: center; font-size: var(--md-sys-typescale-footnote-size, 10px); color: ${HTML_TEMPLATE_COLORS.text.footer};">${text}</p>`;
}

/**
 * Generate styled section header HTML for document templates
 * @param title - Section title text
 * @returns HTML string with styled section header
 */
export function getStyledSectionHeader(title: string): string {
  return `<div style="background-color: ${HTML_TEMPLATE_COLORS.structure.headerBg}; padding: 15px; border-radius: var(--md-sys-shape-corner-small);"><h2>${title}</h2></div>`;
}

