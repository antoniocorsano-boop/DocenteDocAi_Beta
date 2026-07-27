/**
 * Material Design 3 - Z-Index Hierarchy
 *
 * MD3 GOLD COMPLIANCE: Only MD3 semantic z-index tokens are allowed.
 * Legacy --z-* tokens are FORBIDDEN.
 *
 * ALLOWED TOKENS:
 * - --md-sys-z-base: Base layout content
 * - --md-sys-z-raised: Raised content, overlays within layout
 * - --md-sys-z-nav: Navigation, BottomNav, NavigationRail, ContextualStrip
 * - --md-sys-z-app-bar: Header, TopAppBar
 * - --md-sys-z-sticky: Sticky banners, fixed notices
 * - --md-sys-z-snackbar: Snackbars, toasts
 * - --md-sys-z-modal: Modals, dialogs, bottom sheets
 * - --md-sys-z-tooltip: Tooltips, critical floating affordances
 *
 * Usage:
 * ```tsx
 * // Direct MD3 token usage ONLY
 * <div style={{ zIndex: 'var(--md-sys-z-modal)' }}>
 *
 * // For modal stacking (ModalContext)
 * const zIndex = getModalZIndex(level);
 * ```
 */

/**
 * Utility function to calculate modal z-index for nesting levels
 * Uses MD3 tokens with proper hierarchy
 *
 * @param level - Modal nesting level (0-based: 0, 1, 2, ...)
 * @returns MD3 z-index token for modal level
 */
export function getModalZIndex(level: number): string {
  const tokens = [
    'var(--md-sys-z-modal)',      // level 0 (base modal)
    'var(--md-sys-z-tooltip)',    // level 1 (above modal)
    'var(--md-sys-z-snackbar)',   // level 2 (above tooltip)
  ];
  return tokens[Math.min(level, tokens.length - 1)] || tokens[tokens.length - 1];
}

/**
 * Get z-index for modal content (same as backdrop for simplicity)
 *
 * @param level - Modal nesting level
 * @returns MD3 z-index token for modal content
 */
export function getModalContentZIndex(level: number): string {
  return getModalZIndex(level);
}

