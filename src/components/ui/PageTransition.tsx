// MD3 Expressive Transformative — Page transition wrapper
// Uses MD3 spring expressive tokens for Google-app-like feel
// Supports fade-through, slide-up, fade, and bounce-in variants

import React, { useEffect, useRef, useState } from 'react';

/**
 * - `fade-through`: scale 0.92→1 + opacity 0→1 (Gmail/Photos style, for top-level view changes)
 * - `slide-up`: translateY(var(--md-sys-spacing-4))→0 + opacity 0→1 (for panel/section entrances)
 * - `fade`: opacity only, no spatial movement (for overlays, loading replacements)
 * - `bounce-in`: scale 0.85→1.05→1 + fade (Transformative hero entrances, new view arrivals)
 */
export type PageTransitionVariant = 'fade-through' | 'slide-up' | 'fade' | 'bounce-in';

interface PageTransitionProps {
  children: React.ReactNode;
  /** Animation style. Default: 'fade-through' */
  variant?: PageTransitionVariant;
  /** When true, resets and re-runs the entrance animation. Change this on view switches. */
  transitionKey?: string | number;
  /** When true briefly hides content (e.g. while async data loads). */
  isLoading?: boolean;
}

const SPRING_SPATIAL = `var(--md-sys-motion-spring-expressive-default-spatial-duration, 500ms) var(--md-sys-motion-spring-expressive-default-spatial, cubic-bezier(0.38, 1.21, 0.22, 1.00))`;
const SPRING_EFFECTS = `var(--md-sys-motion-spring-expressive-default-effects-duration, 200ms) var(--md-sys-motion-spring-expressive-default-effects, cubic-bezier(0.34, 0.80, 0.34, 1.00))`;

// bounce-in uses a CSS keyframe animation (m3-bounce-in from motion.css) for the overshoot effect
const BOUNCE_IN_KEYFRAMES = `
  @keyframes _pt-bounce-in {
    0%   { opacity: 0; transform: scale(0.85); }
    55%  { opacity: 1; transform: scale(1.04); }
    75%  { transform: scale(0.98); }
    90%  { transform: scale(1.01); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes _pt-scale-exit {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(0.9); }
  }
  @media (prefers-reduced-motion: reduce) {
    ._pt-bounce-in-anim { animation-duration: 0.01ms !important; }
  }
`;

function getHiddenStyle(variant: PageTransitionVariant): React.CSSProperties {
  switch (variant) {
    case 'fade-through': return { opacity: 0, transform: 'scale(0.92)' };
    case 'slide-up':     return { opacity: 0, transform: 'translateY(var(--md-sys-spacing-4))' };
    case 'fade':         return { opacity: 0, transform: 'none' };
    case 'bounce-in':    return { opacity: 0, transform: 'scale(0.85)' };
  }
}

function getVisibleStyle(): React.CSSProperties {
  return { opacity: 1, transform: 'none' };
}

function getTransition(variant: PageTransitionVariant): string {
  if (variant === 'fade') return `opacity ${SPRING_EFFECTS}`;
  if (variant === 'bounce-in') return 'none'; // keyframe handles it
  return `opacity ${SPRING_EFFECTS}, transform ${SPRING_SPATIAL}`;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'fade-through',
  transitionKey,
  isLoading = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const frameRef = useRef<number | null>(null);

  const triggerEnter = () => {
    setVisible(false);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    // Double rAF ensures the hidden style is painted before transitioning in
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => {
        setVisible(true);
        if (variant === 'bounce-in') setAnimKey(k => k + 1);
      });
    });
  };

  /* eslint-disable react-hooks/exhaustive-deps -- triggerEnter is intentionally excluded from all deps: including it causes an infinite re-render loop */
  // Initial mount
  useEffect(() => {
    triggerEnter();
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  // Re-trigger on view key change
  useEffect(() => {
    if (transitionKey !== undefined) triggerEnter();
  }, [transitionKey]);

  // Re-trigger when loading resolves
  useEffect(() => {
    if (!isLoading) triggerEnter();
  }, [isLoading]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // bounce-in: use CSS animation; other variants: use CSS transition
  if (variant === 'bounce-in') {
    const bounceStyle: React.CSSProperties = visible && !isLoading
      ? {
          animation: `_pt-bounce-in var(--md-sys-motion-spring-expressive-default-spatial-duration, 500ms) var(--md-sys-motion-spring-expressive-default-spatial, cubic-bezier(0.38, 1.21, 0.22, 1.00)) both`,
          willChange: 'opacity, transform',
        }
      : { opacity: 0, transform: 'scale(0.85)', willChange: 'opacity, transform' };

    return (
      <>
        <style>{BOUNCE_IN_KEYFRAMES}</style>
        <div
          key={animKey}
          className="_pt-bounce-in-anim"
          style={bounceStyle}
        >
          {children}
        </div>
      </>
    );
  }

  const currentStyle: React.CSSProperties = {
    ...(visible && !isLoading ? getVisibleStyle() : getHiddenStyle(variant)),
    transition: getTransition(variant),
    willChange: variant !== 'fade' ? 'opacity, transform' : 'opacity',
  };

  return (
    <div style={currentStyle}>
      {children}
    </div>
  );
};

export default PageTransition;
