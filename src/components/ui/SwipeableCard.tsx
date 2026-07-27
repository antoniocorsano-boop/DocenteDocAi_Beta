// MD3 Gold Compliant
// Card con swipe actions (delete, archive, etc.)
// Audit: febbraio 2026

import React, { useState, useRef } from 'react';

interface SwipeAction {
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  threshold?: number; // px to trigger action
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftAction,
  rightAction,
  threshold = 80,
  disabled = false
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [actionTriggered, setActionTriggered] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    currentX.current = translateX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    const deltaX = e.touches[0].clientX - startX.current;
    const newTranslateX = currentX.current + deltaX;

    // Limit swipe distance
    const maxSwipe = 120;
    const limitedTranslateX = Math.max(-maxSwipe, Math.min(maxSwipe, newTranslateX));
    
    // Check if action should be triggered
    if (leftAction && limitedTranslateX >= threshold) {
      setActionTriggered(true);
    } else if (rightAction && limitedTranslateX <= -threshold) {
      setActionTriggered(true);
    } else {
      setActionTriggered(false);
    }

    setTranslateX(limitedTranslateX);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsDragging(false);

    // Trigger action if threshold reached
    if (leftAction && translateX >= threshold && actionTriggered) {
      leftAction.onAction();
      setTranslateX(0);
    } else if (rightAction && translateX <= -threshold && actionTriggered) {
      rightAction.onAction();
      setTranslateX(0);
    } else {
      // Reset position
      setTranslateX(0);
    }
    
    setActionTriggered(false);
  };

  const showLeftAction = leftAction && translateX > 0;
  const showRightAction = rightAction && translateX < 0;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--md-sys-spacing-2)',
        touchAction: disabled ? 'auto' : 'pan-y'
      }}
    >
      {/* Left Action */}
      {showLeftAction && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: Math.abs(translateX),
            backgroundColor: leftAction.backgroundColor,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 'var(--md-sys-spacing-4)',
            gap: 'var(--md-sys-spacing-2)',
            opacity: actionTriggered ? 1 : 'var(--md-sys-state-opacity-icon-muted)' as unknown as number,
            transition: 'opacity var(--md-sys-motion-duration-short2)'
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 'var(--md-sys-typescale-headline-small-font-size)',
              color: leftAction.color,
              fontVariationSettings: '"FILL" 1, "wght" 600'
            }}
          >
            {leftAction.icon}
          </span>
          <span
            style={{
              color: leftAction.color,
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              fontSize: 'var(--md-sys-typescale-label-medium-font-size)'
            }}
          >
            {leftAction.label}
          </span>
        </div>
      )}

      {/* Right Action */}
      {showRightAction && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: Math.abs(translateX),
            backgroundColor: rightAction.backgroundColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 'var(--md-sys-spacing-4)',
            gap: 'var(--md-sys-spacing-2)',
            opacity: actionTriggered ? 1 : 'var(--md-sys-state-opacity-icon-muted)' as unknown as number,
            transition: 'opacity var(--md-sys-motion-duration-short2)'
          }}
        >
          <span
            style={{
              color: rightAction.color,
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              fontSize: 'var(--md-sys-typescale-label-medium-font-size)'
            }}
          >
            {rightAction.label}
          </span>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 'var(--md-sys-typescale-headline-small-font-size)',
              color: rightAction.color,
              fontVariationSettings: '"FILL" 1, "wght" 600'
            }}
          >
            {rightAction.icon}
          </span>
        </div>
      )}

      {/* Card Content */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          cursor: disabled ? 'default' : 'grab',
          userSelect: 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;
