// MD3 Gold Compliant
// Bottom Sheet per modal mobile-friendly
// Audit: febbraio 2026

import React, { useEffect, useState, useRef } from 'react';
import Typography from '@mui/material/Typography';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
  dismissible?: boolean;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  dismissible = true,
  showHandle = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Calculate sheet height
  const sheetHeight = {
    auto: 'var(--md-sys-percent-60)',
    half: 'var(--md-sys-percent-50)',
    full: 'var(--md-sys-percent-90)'
  }[height];

  // Lock body scroll when sheet is open
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

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!dismissible) return;
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    currentY.current = translateY;
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dismissible) return;
    const deltaY = e.touches[0].clientY - startY.current;
    
    // Only allow dragging down
    if (deltaY > 0) {
      setTranslateY(deltaY);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!dismissible) return;
    setIsDragging(false);
    
    // Close if dragged more than 100px
    if (translateY > 100) {
      onClose();
    }
    
    // Reset position
    setTranslateY(0);
  };

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (dismissible) {
      onClose();
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && dismissible) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, dismissible, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 'var(--md-sys-spacing-0)',
          left: 'var(--md-sys-spacing-0)',
          right: 'var(--md-sys-spacing-0)',
          bottom: 'var(--md-sys-spacing-0)',
          backgroundColor: 'var(--md-sys-color-scrim)',
          zIndex: 'var(--md-sys-z-modal)',
          animation: 'backdrop-fade-in var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
          backdropFilter: 'blur(var(--md-sys-blur-small))'
        }}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 'var(--md-sys-spacing-0)',
          left: 'var(--md-sys-spacing-0)',
          right: 'var(--md-sys-spacing-0)',
          maxHeight: sheetHeight,
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderTopLeftRadius: 'var(--md-sys-shape-corner-large)',
          borderTopRightRadius: 'var(--md-sys-shape-corner-large)',
          zIndex: 'var(--md-sys-z-modal)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--md-sys-elevation-3)',
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
          animation: 'sheet-slide-up var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)'
        }}
      >
        {/* Drag handle */}
        {showHandle && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 'var(--md-sys-spacing-3)',
              paddingBottom: 'var(--md-sys-spacing-2)',
              cursor: dismissible ? 'grab' : 'default'
            }}
          >
            <div
              style={{
                width: 'var(--md-sys-spacing-8)',
                height: 'var(--md-sys-spacing-0_5)',
                backgroundColor: 'var(--md-sys-color-on-surface-variant)',
                borderRadius: 'var(--md-sys-spacing-1)',
                opacity: 'var(--md-sys-state-opacity-empty)'
              }}
            />
          </div>
        )}

        {/* Title */}
        {title && (
          <div
            style={{
              padding: 'var(--md-sys-spacing-4)',
              paddingTop: showHandle ? 'var(--md-sys-spacing-2)' : 'var(--md-sys-spacing-4)',
              borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'
            }}
          >
            <Typography
              id="bottom-sheet-title"
              variant="subtitle1"
              sx={{
                color: 'var(--md-sys-color-on-surface)',
                fontWeight: 'var(--md-sys-typescale-weight-semibold)'
              }}
            >
              {title}
            </Typography>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--md-sys-spacing-4)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes backdrop-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes sheet-slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(var(--md-sys-spacing-0));
          }
        }
      `}</style>
    </>
  );
};

export default BottomSheet;
