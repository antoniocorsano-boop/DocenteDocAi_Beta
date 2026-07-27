// MD3 Gold Compliant — Container Transform
// Implements the M3 Container Transform shared-element pattern:
// a source element expands to reveal detail content, then
// collapses back. Pure CSS transition — no third-party deps.
//
// Usage:
//   <ContainerTransform
//     trigger={({ open, triggerRef }) => (
//       <M3Card ref={triggerRef} onClick={open}>Open me</M3Card>
//     )}
//   >
//     {({ close }) => <DetailView onClose={close} />}
//   </ContainerTransform>

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';

/* ─── types ─────────────────────────────────────────────────── */

interface TriggerRenderProps {
  open: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

interface ContentRenderProps {
  close: () => void;
}

export interface ContainerTransformProps {
  /** Render the small "source" element that triggers the expansion. */
  trigger: (props: TriggerRenderProps) => React.ReactNode;
  /** Render the full expanded content. */
  children: (props: ContentRenderProps) => React.ReactNode;
  /**
   * Background color of the expanding container.
   * Default: var(--md-sys-color-surface-container-high)
   */
  containerColor?: string;
  /**
   * Border radius of the source element to start from.
   * Default: var(--md-sys-shape-corner-large)
   */
  sourceRadius?: string;
  /**
   * Border radius once fully expanded.
   * Default: 0px (full screen)
   */
  targetRadius?: string;
  /** z-index of the overlay. Default: 1300. */
  zIndex?: number;
}

/* ─── component ─────────────────────────────────────────────── */

export const ContainerTransform: React.FC<ContainerTransformProps> = ({
  trigger,
  children,
  containerColor = 'var(--md-sys-color-surface-container-high)',
  sourceRadius = 'var(--md-sys-shape-corner-large)',
  targetRadius = 'var(--md-sys-shape-corner-none, 0px)',
  zIndex = 1300,
}) => {
  const triggerRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [rect, setRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
    setPhase('opening');
  }, []);

  const close = useCallback(() => {
    setPhase('closing');
  }, []);

  // Transition: opening → open after next frame
  useEffect(() => {
    if (phase === 'opening') {
      // force reflow, then transition to full size
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('open'));
      });
    }
  }, [phase]);

  // Transition: closing → closed after animation ends
  const handleTransitionEnd = useCallback(() => {
    if (phase === 'closing') setPhase('closed');
  }, [phase]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (phase === 'open' || phase === 'opening')) close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, close]);

  const isVisible = phase !== 'closed';
  const isExpanded = phase === 'open';

  // Compute style for each phase
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex,
    backgroundColor: containerColor,
    overflow: 'hidden',
    transition: [
      `top    var(--md-sys-motion-duration-medium) var(--md-sys-motion-spring-expressive-default-spatial)`,
      `left   var(--md-sys-motion-duration-medium) var(--md-sys-motion-spring-expressive-default-spatial)`,
      `width  var(--md-sys-motion-duration-medium) var(--md-sys-motion-spring-expressive-default-spatial)`,
      `height var(--md-sys-motion-duration-medium) var(--md-sys-motion-spring-expressive-default-spatial)`,
      `border-radius var(--md-sys-motion-duration-medium) var(--md-sys-motion-spring-expressive-default-spatial)`,
    ].join(', '),
    // Start from source rect, expand to viewport
    top:    isExpanded ? '0px' : `${rect?.top ?? 0}px`,
    left:   isExpanded ? '0px' : `${rect?.left ?? 0}px`,
    width:  isExpanded ? 'var(--md-sys-viewport-width-full)' : `${rect?.width ?? 0}px`,
    height: isExpanded ? 'var(--md-sys-viewport-height-full)' : `${rect?.height ?? 0}px`,
    borderRadius: isExpanded ? targetRadius : sourceRadius,
  };

  const contentStyle: React.CSSProperties = {
    width: 'var(--md-sys-percent-100)',
    height: 'var(--md-sys-percent-100)',
    opacity: isExpanded ? 1 : 0,
    transition: `opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)${isExpanded ? ' var(--md-sys-motion-duration-short4)' : ''}`,
    overflow: 'auto',
  };

  return (
    <>
      {trigger({ open, triggerRef })}

      {isVisible &&
        ReactDOM.createPortal(
          <div
            ref={overlayRef}
            style={overlayStyle}
            onTransitionEnd={handleTransitionEnd}
            role="dialog"
            aria-modal="true"
          >
            <div style={contentStyle}>
              {children({ close })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ContainerTransform;
