/**
 * useJarvisKeyboard — global keyboard shortcuts for Orbit Jarvis Copilot
 *
 * Shortcuts:
 *  Ctrl+J          → toggle ThumbMenu on latest workspace entry
 *  Ctrl+U          → open/focus UserWorkspace (navigate to workspace view)
 *  Ctrl+Shift+D    → show TrustChain audit details in a toast
 */
import { useEffect } from 'react';

import { useUIStore } from '@/stores/useUIStore';

export interface UseJarvisKeyboardOptions {
  /** Whether the ThumbMenu is currently open */
  open: boolean;
  /** ID of the latest workspace entry (null if workspace is empty) */
  latestEntryId: string | null;
  /** Ref to the DOM element near latest entry — used as anchor for ThumbMenu */
  latestEntryAnchor: HTMLElement | null;
  /** Open the ThumbMenu for the given entry at the given anchor element */
  openMenu: (entryId: string, anchor: HTMLElement) => void;
  /** Close the ThumbMenu */
  handleClose: () => void;
  /**
   * Navigate the app to the workspace view.
   * Optional — defaults to dispatching 'jarvis:navigate-workspace' on window
   * so App-level code can subscribe if needed.
   */
  navigateToWorkspace?: () => void;
}

export function useJarvisKeyboard({
  open,
  latestEntryId,
  latestEntryAnchor,
  openMenu,
  handleClose,
  navigateToWorkspace,
}: UseJarvisKeyboardOptions): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      // Ctrl+J → toggle ThumbMenu
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (open) {
          handleClose();
        } else if (latestEntryId && latestEntryAnchor) {
          openMenu(latestEntryId, latestEntryAnchor);
        }
        return;
      }

      // Ctrl+U → navigate to workspace (or dispatch event for App-level handler)
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        if (navigateToWorkspace) {
          navigateToWorkspace();
        } else {
          window.dispatchEvent(new CustomEvent('jarvis:navigate-workspace'));
        }
        return;
      }

      // Ctrl+Shift+D → TrustChain details
      if (e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        const { actions } = useUIStore.getState();
        actions.showToast(
          'TrustChain attivo — ogni azione AI è tracciata immutabilmente nel registro locale.',
          'info',
        );
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, latestEntryId, latestEntryAnchor, openMenu, handleClose, navigateToWorkspace]);
}
