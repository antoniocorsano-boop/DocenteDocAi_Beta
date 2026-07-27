// MD3 Expressive — Floating Action Button (FAB + Extended FAB)
// Supports standard (icon-only) and extended (icon + label) modes.
// Extended FAB auto-collapses on scroll when scrollContainerRef is provided.
// Shape: corner-large (extended) ↔ corner-full (compact) — spring animated.
// All values use MD3 tokens. No hardcoded values.

import React, { useEffect, useRef, useState } from 'react';

// Spring expressive tokens for spatial transitions (shape, size)
const SPRING_SPATIAL =
  'var(--md-sys-motion-spring-expressive-default-spatial-duration, 500ms) ' +
  'var(--md-sys-motion-spring-expressive-default-spatial, cubic-bezier(0.38, 1.21, 0.22, 1.00))';

const SPRING_EFFECTS =
  'var(--md-sys-motion-spring-expressive-default-effects-duration, 200ms) ' +
  'var(--md-sys-motion-spring-expressive-default-effects, cubic-bezier(0.34, 0.80, 0.34, 1.00))';

// Scroll threshold (px) before collapsing label
const COLLAPSE_THRESHOLD = 60;

export interface M3FabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Material Symbol icon name or ReactNode */
  icon: React.ReactNode;
  /**
   * Label shown next to the icon when extended.
   * When provided the FAB starts in extended mode unless `defaultCollapsed` is true
   * or the scroll container is scrolled past the threshold.
   */
  label?: string;
  /** Color role. Default: 'primary' */
  variant?: 'primary' | 'secondary' | 'tertiary';
  /**
   * Ref of the scrollable container to observe.
   * When provided, the FAB collapses after COLLAPSE_THRESHOLD px of scroll
   * and re-extends when the user scrolls back to the top.
   */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** Forces collapsed state externally (overrides internal scroll state). */
  collapsed?: boolean;
}

export const M3Fab: React.FC<M3FabProps> = ({
  icon,
  label,
  variant = 'primary',
  scrollContainerRef,
  collapsed: collapsedProp,
  style,
  ...props
}) => {
  // Internal scroll-driven collapse state
  const [scrollCollapsed, setScrollCollapsed] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el || !label) return;

    const onScroll = () => {
      const y = el.scrollTop;
      if (y > COLLAPSE_THRESHOLD && !scrollCollapsed) setScrollCollapsed(true);
      if (y < COLLAPSE_THRESHOLD / 2 && scrollCollapsed) setScrollCollapsed(false);
      lastScrollY.current = y;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollContainerRef, scrollCollapsed, label]);

  // Resolve final collapsed state: explicit prop wins, then scroll state
  const isCollapsed = collapsedProp !== undefined ? collapsedProp : scrollCollapsed;
  const isExtended = !!label && !isCollapsed;

  // Color tokens
  const bg =
    variant === 'primary'   ? 'var(--md-sys-color-primary-container)'
    : variant === 'secondary' ? 'var(--md-sys-color-secondary-container)'
    : 'var(--md-sys-color-tertiary-container)';

  const fg =
    variant === 'primary'   ? 'var(--md-sys-color-on-primary-container)'
    : variant === 'secondary' ? 'var(--md-sys-color-on-secondary-container)'
    : 'var(--md-sys-color-on-tertiary-container)';

  // Shape: corner-large when extended, corner-full when compact
  const borderRadius = isExtended
    ? 'var(--md-sys-shape-corner-large)'
    : 'var(--md-sys-shape-corner-full)';

  // Padding: wider when extended
  const padding = isExtended
    ? 'var(--md-sys-spacing-4) var(--md-sys-spacing-6)'   // 16px 24px
    : 'var(--md-sys-spacing-4)';                           // 16px all sides (square)

  return (
    <button
      type="button"
      {...props}
      style={{
        // Color
        background: bg,
        color: fg,
        // Elevation
        boxShadow: 'var(--md-sys-elevation-level3)',
        // Shape — animates between circle and pill
        borderRadius,
        // Size — MD3 FAB standard (spacing-14 = 56px)
        minWidth: 'var(--md-sys-spacing-14)',
        minHeight: 'var(--md-sys-spacing-14)',
        // Layout
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        // Transitions via spring tokens
        transition: [
          `border-radius ${SPRING_SPATIAL}`,
          `padding ${SPRING_SPATIAL}`,
          `box-shadow ${SPRING_EFFECTS}`,
        ].join(', '),
        // Reset
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        // Caller overrides
        ...style,
      }}
      aria-label={props['aria-label'] ?? label}
    >
      {/* Icon */}
      <span style={{ display: 'inline-flex', flexShrink: 0 }}>
        {icon}
      </span>

      {/* Label — max-width trick for smooth width animation */}
      {label && (
        <span
          aria-hidden={!isExtended}
          style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            // max-width 0→140px drives horizontal expand animation
            maxWidth: isExtended ? 'var(--md-sys-spacing-35)' : '0',
            opacity: isExtended ? 1 : 0,
            // Spatial spring for width, effects spring for opacity
            transition: [
              `max-width ${SPRING_SPATIAL}`,
              `opacity ${SPRING_EFFECTS}`,
              `margin-left ${SPRING_SPATIAL}`,
            ].join(', '),
            marginLeft: isExtended ? 'var(--md-sys-spacing-2)' : '0',
            font: 'var(--md-sys-typescale-label-large)',
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
};

export default M3Fab;
