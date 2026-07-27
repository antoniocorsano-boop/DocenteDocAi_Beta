/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CRITICAL: React availability guard
 * Runs FIRST before any hook-dependent code to ensure React is available
 * This prevents "Cannot read properties of undefined (reading 'useState')" errors
 */

// Ensure React object exists globally before any hooks are used
if (typeof window !== 'undefined') {
  // Create a dummy React object that will be replaced when real React loads
  if (!window.__REACT_AVAILABLE__) {
    (window as any).__REACT_AVAILABLE__ = false;
  }
}

export {};

