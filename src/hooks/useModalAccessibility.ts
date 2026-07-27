import { useEffect } from 'react';

/**
 * useModalAccessibility
 * - Focus trap (tab/shift+tab ciclici)
 * - Chiusura con ESC
 * - Chiusura con click overlay (se onOverlayClick fornito)
 * - Scroll lock su <body>
 * - Focus automatico al container
 * - ARIA role="dialog" e aria-modal="true"
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useModalAccessibility({
  isOpen,
  onClose,
  overlayRef,
  containerRef,
  onOverlayClick
}: {
  isOpen: boolean;
  onClose: () => void;
  overlayRef: React.RefObject<HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  onOverlayClick?: () => void;
}) {
  // Focus trap
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const focusable = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    containerRef.current.addEventListener('keydown', handleTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => containerRef.current?.removeEventListener('keydown', handleTab);
  }, [isOpen, containerRef]);

  // ESC close
  useEffect(() => {
    if (!isOpen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Overlay click
  useEffect(() => {
    if (!isOpen || !overlayRef.current || !onOverlayClick) return;
    function handleOverlay(e: MouseEvent) {
      if (e.target === overlayRef.current && typeof onOverlayClick === 'function') {
        onOverlayClick();
      }
    }
    overlayRef.current.addEventListener('mousedown', handleOverlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => overlayRef.current?.removeEventListener('mousedown', handleOverlay);
  }, [isOpen, overlayRef, onOverlayClick]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
}

