import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook per gestire la navigazione da tastiera nei modal/dialog
 * Implementa focus trap, chiusura con ESC e navigazione con Tab
 */
export const useKeyboardNavigation = (
    isOpen: boolean,
    onClose?: () => void,
    options: {
        focusOnOpen?: boolean;
        restoreFocus?: boolean;
    } = {}
): React.RefObject<HTMLDivElement> => {
    const { focusOnOpen = true, restoreFocus = true } = options;
    const modalRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedElement = useRef<Element | null>(null);
    const lastInteractionTarget = useRef<HTMLElement | null>(null);
    // Guard against re-entrant focus calls: calling element.focus() fires
    // focusin synchronously, which would re-trigger handleFocusIn and create
    // an infinite loop with MUI's own document-level focus listeners.
    const isFocusingRef = useRef(false);

    useEffect(() => {
      const recordInteraction = (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (target && typeof target.focus === 'function') {
          lastInteractionTarget.current = target;
        }
      };

      document.addEventListener('mousedown', recordInteraction, true);
      document.addEventListener('touchstart', recordInteraction, true);
      document.addEventListener('click', recordInteraction, true);

      return () => {
        document.removeEventListener('mousedown', recordInteraction, true);
        document.removeEventListener('touchstart', recordInteraction, true);
        document.removeEventListener('click', recordInteraction, true);
      };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        // Salva l'elemento attualmente focalizzato (una sola volta per apertura)
        if (restoreFocus && !previouslyFocusedElement.current) {
          previouslyFocusedElement.current = document.activeElement && document.activeElement !== document.body
            ? document.activeElement
            : lastInteractionTarget.current;
        }

        // Focus trap: cattura tutti gli elementi focusabili nel modal
        const getFocusableElements = (): HTMLElement[] => {
          if (!modalRef.current) return [];
          const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
          ];
          const focusables = Array.from(
            modalRef.current.querySelectorAll(focusableSelectors.join(', '))
          ) as HTMLElement[];

          // Keep DOM order but move negative-priority items (e.g., header close) to the end
          const preferred = focusables.filter(el => Number(el.getAttribute('data-focus-priority') ?? 0) >= 0);
          const deprioritized = focusables.filter(el => Number(el.getAttribute('data-focus-priority') ?? 0) < 0);
          return [...preferred, ...deprioritized];
        };

        const handleKeyDown = (event: KeyboardEvent) => {
          if (!isOpen) return;

            const focusableElements = getFocusableElements();
            const preferredElements = focusableElements.filter(el => Number(el.getAttribute('data-focus-priority') ?? 0) >= 0);
            const firstElement = preferredElements[0] || focusableElements[0];
            const lastElement = preferredElements[preferredElements.length - 1] || focusableElements[focusableElements.length - 1];

            switch (event.key) {
                case 'Escape':
                    event.preventDefault();
                    if (onClose) onClose();
                    break;

                case 'Tab':
                  if (focusableElements.length === 0 || preferredElements.length === 0) return;

                    if (event.shiftKey) {
                        // Shift + Tab: vai all'ultimo elemento se siamo sul primo
                        if (document.activeElement === firstElement) {
                            event.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        // Tab: vai al primo elemento se siamo sull'ultimo
                        if (document.activeElement === lastElement) {
                            event.preventDefault();
                            firstElement.focus();
                        }
                    }
                    break;
            }
        };

        // Aggiungi event listener
        document.addEventListener('keydown', handleKeyDown);
        const handleFocusIn = (event: FocusEvent) => {
          // Re-entrance guard: element.focus() fires focusin synchronously.
          // Without this guard, our focus() call triggers MUI's document listener
          // which moves focus elsewhere, which triggers ours again → infinite loop
          // (Maximum call stack size exceeded).
          if (isFocusingRef.current) return;
          if (!isOpen || !modalRef.current) return;
          const targetNode = event.target as Node;
          const closestDialog = (targetNode as Element | null)?.closest('[data-testid="m3-dialog"]');

          // Allow focus inside other dialog shells (e.g., nested modals)
          if (closestDialog && closestDialog !== modalRef.current) {
            return;
          }

          if (!modalRef.current.contains(targetNode)) {
            const focusableElements = getFocusableElements();
            const preferredElements = focusableElements.filter(el => Number(el.getAttribute('data-focus-priority') ?? 0) >= 0);

            // If there are no preferred focusable elements, do not force focus back (allows triggers to keep focus)
            if (preferredElements.length === 0) return;

            const fallback = preferredElements[0] || focusableElements[0];
            if (fallback && document.activeElement !== fallback) {
              isFocusingRef.current = true;
              fallback.focus();
              isFocusingRef.current = false;
            }
          }
        };
        document.addEventListener('focusin', handleFocusIn);

        // Focus sul primo elemento quando il modal si apre
        if (focusOnOpen) {
          const immediateFocusable = getFocusableElements();
          const immediatePreferred = immediateFocusable.filter(el => Number(el.getAttribute('data-focus-priority') ?? 0) >= 0);
          if (immediatePreferred.length === 0 && previouslyFocusedElement.current instanceof HTMLElement) {
            previouslyFocusedElement.current.focus();
          }

          setTimeout(() => {
            const focusableElements = getFocusableElements();
            if (focusableElements.length > 0) {
              const target = focusableElements.find(el => Number(el.getAttribute('data-focus-priority') ?? 0) >= 0);
              if (target) {
                target.focus();
              } else if (previouslyFocusedElement.current && 'focus' in previouslyFocusedElement.current) {
                // Keep focus on the trigger when the dialog has no preferred focusable elements
                (previouslyFocusedElement.current as HTMLElement).focus();
              }
            }
          }, 100); // Timeout per permettere al DOM di aggiornarsi
        }

        // Cleanup
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('focusin', handleFocusIn);

            // Ripristina il focus quando il modal si chiude
            if (restoreFocus && previouslyFocusedElement.current && typeof (previouslyFocusedElement.current as HTMLElement).focus === 'function') {
              setTimeout(() => {
                const el = previouslyFocusedElement.current as HTMLElement | null;
                if (el && typeof el.focus === 'function') {
                  el.focus();
                }
                previouslyFocusedElement.current = null;
              }, 100);
            } else {
              previouslyFocusedElement.current = null;
            }
        };
    }, [isOpen, onClose, focusOnOpen, restoreFocus]);

    return modalRef;
};

/**
 * Hook per la navigazione da tastiera negli elenchi
 * Supporta: frecce (su/giu), Home/End, Enter/Space
 * Implementa WCAG 2.1 compliance per list navigation
 * 
 * @param itemCount - Numero totale di elementi
 * @param selectedIndex - Indice attualmente selezionato
 * @param onSelect - Callback quando la selezione cambia
 * @param onActivate - Callback quando l'elemento è attivato (Enter/Space)
 * @param cycleItems - Se true, cicla tra elementi (wrap around)
 * 
 * @example
 * const { handleKeyDown, navigateToIndex } = useListKeyboardNavigation({
 *   itemCount: items.length,
 *   selectedIndex: selected,
 *   onSelect: setSelected,
 *   onActivate: handleActivate
 * });
 * 
 * <ul onKeyDown={handleKeyDown}>
 *   {items.map((item, i) => (
 *     <li key={i} tabIndex={i === selected ? 0 : -1}>
 *       {item}
 *     </li>
 *   ))}
 * </ul>
 */
export interface UseListKeyboardNavigationOptions {
  itemCount: number;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  onActivate?: (index: number) => void;
  cycleItems?: boolean;
}

interface UseListKeyboardNavigationResult {
  handleKeyDown: (e: KeyboardEvent) => void;
}

export const useListKeyboardNavigation = (options: UseListKeyboardNavigationOptions): UseListKeyboardNavigationResult => {
  const {
    itemCount,
    selectedIndex = 0,
    onSelect,
    onActivate,
    cycleItems = true
  } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    let newIndex = selectedIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = selectedIndex + 1;
        if (newIndex >= itemCount) {
          newIndex = cycleItems ? 0 : itemCount - 1;
        }
        onSelect?.(newIndex);
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = selectedIndex - 1;
        if (newIndex < 0) {
          newIndex = cycleItems ? itemCount - 1 : 0;
        }
        onSelect?.(newIndex);
        break;

      case 'Home':
        e.preventDefault();
        onSelect?.(0);
        break;

      case 'End':
        e.preventDefault();
        onSelect?.(itemCount - 1);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        onActivate?.(selectedIndex);
        break;

      default:
        break;
    }
  }, [selectedIndex, itemCount, cycleItems, onSelect, onActivate]);

  return { handleKeyDown };
};

// Re-export for convenience
export { useCallback } from 'react';

